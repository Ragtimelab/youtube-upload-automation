from typing import Optional

from .youtube.auth_manager import YouTubeAuthManager
from .youtube.channel_manager import YouTubeChannelManager
from .youtube.upload_manager import YouTubeUploadManager


class YouTubeClient:
    """YouTube Data API v3 클라이언트

    리팩토링된 YouTube 클라이언트로 인증, 채널 관리, 업로드 기능을
    각각의 매니저를 통해 제공합니다.
    """

    def __init__(self, credentials_path: Optional[str] = None):
        """YouTube 클라이언트 초기화

        Args:
            credentials_path: Google Cloud Console에서 다운로드한 credentials.json 경로 (선택사항)
        """
        self.auth_manager = YouTubeAuthManager()
        self.channel_manager = YouTubeChannelManager(self.auth_manager)
        self.upload_manager = YouTubeUploadManager(self.auth_manager)

    def authenticate(self) -> bool:
        """OAuth 2.0 인증 수행

        Returns:
            인증 성공 여부
        """
        return self.auth_manager.authenticate()

    def get_channel_info(self) -> Optional[dict]:
        """현재 인증된 채널 정보 조회

        Returns:
            채널 정보 딕셔너리 또는 None
        """
        return self.channel_manager.get_channel_info()

    def upload_video(self, video_path: str, metadata: dict) -> Optional[str]:
        """YouTube에 비디오 업로드

        Args:
            video_path: 업로드할 비디오 파일 경로
            metadata: 비디오 메타데이터
                - title: 제목 (필수)
                - description: 설명
                - tags: 태그 (문자열 또는 리스트)
                - category_id: 카테고리 ID (기본: 22 - People & Blogs)
                - privacy_status: 공개 설정 (private, unlisted, public)
                - scheduled_time: 예약 발행 시간 (ISO 8601 형식)

        Returns:
            업로드된 비디오 ID 또는 None
        """
        return self.upload_manager.upload_video(video_path, metadata)

    def get_video_info(self, video_id: str) -> Optional[dict]:
        """비디오 정보 조회

        Args:
            video_id: YouTube 비디오 ID

        Returns:
            비디오 정보 딕셔너리 또는 None
        """
        return self.upload_manager.get_video_info(video_id)

    def is_authenticated(self) -> bool:
        """인증 상태 확인

        Returns:
            인증 여부
        """
        return self.auth_manager.is_authenticated()

    def get_quota_usage(self) -> dict:
        """API 할당량 사용량 정보 (추정치)

        Returns:
            할당량 사용량 추정 정보
        """
        return self.upload_manager.get_quota_usage()
