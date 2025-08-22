"""
YouTube 업로드 관리자
"""

import os
from typing import Any, Dict, Optional

from googleapiclient.discovery import Resource, build
from googleapiclient.http import MediaFileUpload

from ...config import get_settings
from ...core.constants import ChannelConstants, FileConstants, YouTubeConstants
from ...core.exceptions import (
    UploadProgressError,
    VideoFileNotFoundError,
    YouTubeAuthenticationError,
    YouTubeQuotaExceededError,
    YouTubeUploadError,
)
from .auth_manager import YouTubeAuthManager


class YouTubeUploadManager:
    """YouTube 업로드 관리"""

    def __init__(self, auth_manager: YouTubeAuthManager):
        self.auth_manager = auth_manager
        self.youtube: Optional[Resource] = None
        self.settings = get_settings()

    def _ensure_authenticated(self) -> None:
        """인증 상태 확인 및 YouTube 클라이언트 초기화"""
        if not self.auth_manager.is_authenticated():
            raise YouTubeAuthenticationError("인증이 필요합니다.")

        if not self.youtube:
            credentials = self.auth_manager.get_credentials()
            self.youtube = build("youtube", "v3", credentials=credentials)

    def _get_youtube_client(self) -> Resource:
        """인증된 YouTube 클라이언트 반환 (타입 보장)"""
        self._ensure_authenticated()
        if self.youtube is None:
            raise YouTubeAuthenticationError("YouTube 클라이언트 초기화 실패")
        return self.youtube

    def upload_video(self, video_path: str, metadata: Dict[str, Any]) -> Optional[str]:
        """YouTube에 비디오 업로드

        Args:
            video_path: 업로드할 비디오 파일 경로
            metadata: 비디오 메타데이터
                - title: 제목 (필수)
                - description: 설명
                - tags: 태그 (문자열 또는 리스트)
                - category_id: 카테고리 ID (
                    기본: {YouTubeConstants.DEFAULT_CATEGORY_ID} - Entertainment
                )
                - privacy_status: 공개 설정 (private, unlisted, public)
                - scheduled_time: 예약 발행 시간 (ISO 8601 형식)

        Returns:
            업로드된 비디오 ID 또는 None
        """
        self._ensure_authenticated()

        if not os.path.exists(video_path):
            raise VideoFileNotFoundError(video_path)

        # 메타데이터 검증
        if not metadata.get("title"):
            raise YouTubeUploadError("비디오 제목이 필요합니다.")

        # 미인증 프로젝트 제한 검증
        privacy_status = metadata.get("privacy_status", "private")
        if (
            self.settings.is_unverified_project_restricted
            and privacy_status != "private"
        ):
            print("⚠️  미인증 프로젝트는 비공개 모드로만 업로드 가능합니다.")
            metadata["privacy_status"] = "private"

        # 업로드 메타데이터 구성
        body = self._build_upload_body(metadata)

        try:
            print(f"📤 비디오 업로드 시작: {video_path}")
            print(f"📝 제목: {metadata['title']}")

            # 미디어 파일 업로드 객체 생성 (청크 단위 업로드로 진행률 추적)
            chunk_size = FileConstants.DEFAULT_UPLOAD_CHUNK_SIZE
            media = MediaFileUpload(video_path, chunksize=chunk_size, resumable=True)

            # 업로드 요청 실행
            youtube_client = self._get_youtube_client()
            request = youtube_client.videos().insert(
                part=",".join(body.keys()), body=body, media_body=media
            )

            # 재개 가능한 업로드 실행 (진행률 추적)
            response = None
            status = None  # status 변수 초기화
            while response is None:
                try:
                    status, response = request.next_chunk()
                    if status:
                        progress_percent = int(status.progress() * 100)
                        print(f"📊 업로드 진행률: {progress_percent}%")
                except Exception as chunk_error:
                    error_str = str(chunk_error)

                    # YouTube API 할당량 초과 확인
                    if "quotaExceeded" in error_str or "quota" in error_str.lower():
                        raise YouTubeQuotaExceededError()

                    # 네트워크 관련 오류 처리
                    if any(
                        keyword in error_str.lower()
                        for keyword in ["network", "timeout", "connection"]
                    ):
                        print(f"🌐 네트워크 오류 발생: {chunk_error}")
                        # 작은 청크로 재시도
                        if chunk_size > FileConstants.CHUNK_SIZE_1MB:  # 1MB보다 큰 경우
                            chunk_size = chunk_size // 2
                            print(
                                (
                                    f"🔄 청크 크기를 "
                                    f"{chunk_size // FileConstants.BYTES_PER_MB}MB로 "
                                    f"줄여서 재시도..."
                                )
                            )
                            media = MediaFileUpload(
                                video_path, chunksize=chunk_size, resumable=True
                            )
                            youtube_client = self._get_youtube_client()
                            request = youtube_client.videos().insert(
                                part=",".join(body.keys()), body=body, media_body=media
                            )
                        else:
                            current_progress = (
                                int(status.progress() * 100) if status else 0
                            )
                            raise UploadProgressError(
                                f"네트워크 오류: {chunk_error}", current_progress
                            )
                    else:
                        # 기타 오류
                        current_progress = int(status.progress() * 100) if status else 0
                        raise UploadProgressError(
                            f"업로드 오류: {chunk_error}", current_progress
                        )
            video_id = response["id"]

            print(f"✅ 업로드 성공! 비디오 ID: {video_id}")
            print(f"🔗 비디오 URL: https://www.youtube.com/watch?v={video_id}")

            return video_id

        except Exception as e:
            raise YouTubeUploadError(f"비디오 업로드 실패: {e}")

    def get_video_info(self, video_id: str) -> Optional[dict]:
        """비디오 정보 조회

        Args:
            video_id: YouTube 비디오 ID

        Returns:
            비디오 정보 딕셔너리 또는 None
        """
        self._ensure_authenticated()

        try:
            youtube_client = self._get_youtube_client()
            request = youtube_client.videos().list(
                part="snippet,status,statistics", id=video_id
            )
            response = request.execute()

            if response["items"]:
                video = response["items"][0]
                return {
                    "id": video["id"],
                    "title": video["snippet"]["title"],
                    "description": video["snippet"]["description"],
                    "published_at": video["snippet"]["publishedAt"],
                    "privacy_status": video["status"]["privacyStatus"],
                    "upload_status": video["status"]["uploadStatus"],
                    "view_count": video["statistics"].get("viewCount", "0"),
                    "like_count": video["statistics"].get("likeCount", "0"),
                    "comment_count": video["statistics"].get("commentCount", "0"),
                }
            else:
                print(f"❌ 비디오를 찾을 수 없습니다: {video_id}")
                return None

        except Exception as e:
            print(f"❌ 비디오 정보 조회 실패: {e}")
            return None

    def update_video_metadata(self, video_id: str, metadata: Dict[str, Any]) -> bool:
        """비디오 메타데이터 업데이트"""
        self._ensure_authenticated()

        try:
            # 현재 비디오 정보 조회
            current_video = self.get_video_info(video_id)
            if not current_video:
                return False

            # 업데이트할 메타데이터 구성
            body: Dict[str, Any] = {
                "id": video_id,
                "snippet": {
                    "title": metadata.get("title", current_video["title"]),
                    "description": metadata.get(
                        "description", current_video["description"]
                    ),
                    "categoryId": str(metadata.get("category_id", 24)),
                },
            }

            # 태그 처리 (최대 500자 제한)
            tags = metadata.get("tags")
            if tags:
                if isinstance(tags, str):
                    # 태그 문자열 전체 길이 제한
                    if len(tags) > 500:
                        tags = tags[:500]
                    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
                elif isinstance(tags, list):
                    tag_list = tags
                else:
                    tag_list = []

                # snippet에 tags 할당
                body["snippet"]["tags"] = tag_list

            # 공개 설정 업데이트
            if metadata.get("privacy_status"):
                body["status"] = {"privacyStatus": metadata["privacy_status"]}

            youtube_client = self._get_youtube_client()
            request = youtube_client.videos().update(
                part=",".join(body.keys()), body=body
            )

            request.execute()
            print(f"✅ 비디오 메타데이터 업데이트 성공: {video_id}")
            return True

        except Exception as e:
            print(f"❌ 비디오 메타데이터 업데이트 실패: {e}")
            return False

    def _build_upload_body(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """업로드용 메타데이터 구성 (채널 기본 정보 자동 추가)"""
        # 원본 설명에 채널 기본 설명 추가
        original_description = metadata.get("description", "")
        combined_description = ChannelConstants.combine_description(
            original_description
        )

        # 원본 태그에 채널 기본 태그 추가
        original_tags = metadata.get("tags", "")
        combined_tags = ChannelConstants.combine_tags(original_tags)

        # 태그를 리스트로 변환 (YouTube API 요구사항)
        if isinstance(combined_tags, str):
            tags = [tag.strip() for tag in combined_tags.split(",") if tag.strip()]
        elif isinstance(combined_tags, list):
            tags = combined_tags
        else:
            tags = []

        body: Dict[str, Any] = {
            "snippet": {
                "title": metadata["title"][: YouTubeConstants.TITLE_MAX_LENGTH],
                "description": combined_description,
                "tags": tags,
                "categoryId": str(
                    metadata.get("category_id", YouTubeConstants.DEFAULT_CATEGORY_ID)
                ),
                "defaultLanguage": YouTubeConstants.DEFAULT_LANGUAGE,
                "defaultAudioLanguage": YouTubeConstants.DEFAULT_AUDIO_LANGUAGE,
            },
            "status": {
                "privacyStatus": metadata.get(
                    "privacy_status", YouTubeConstants.DEFAULT_PRIVACY_STATUS
                )
            },
        }

        # YouTube 네이티브 예약 발행 시간 설정
        publish_at_time = metadata.get("publish_at") or metadata.get("scheduled_time")
        if publish_at_time:
            body["status"]["publishAt"] = publish_at_time
            # 예약 발행시 privacy_status는 반드시 private이어야 함
            body["status"]["privacyStatus"] = "private"

        return body

    def get_quota_usage(self) -> dict:
        """API 할당량 사용량 정보 (추정치)

        Returns:
            할당량 사용량 추정 정보
        """
        # YouTube API는 직접적인 할당량 조회 기능을 제공하지 않음
        return {
            "note": "YouTube API는 직접적인 할당량 조회를 지원하지 않습니다.",
            "estimated_costs": {
                "channel_info": "1 unit per request",
                "video_upload": "1600 units per request",
                "video_info": "1 unit per request",
                "playlist_info": "1 unit per request",
            },
            "daily_quota_limit": "10,000 units (기본)",
            "recommendation": "Google Cloud Console에서 실제 사용량을 확인하세요.",
        }
