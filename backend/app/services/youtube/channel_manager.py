"""
YouTube 채널 관리자
"""

from typing import Optional

from googleapiclient.discovery import Resource, build

from ...core.exceptions import YouTubeAuthenticationError
from .auth_manager import YouTubeAuthManager


class YouTubeChannelManager:
    """YouTube 채널 관리"""

    def __init__(self, auth_manager: YouTubeAuthManager):
        self.auth_manager = auth_manager
        self.youtube: Optional[Resource] = None

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

    def get_channel_info(self) -> Optional[dict]:
        """현재 인증된 채널 정보 조회

        Returns:
            채널 정보 딕셔너리 또는 None
        """
        self._ensure_authenticated()

        try:
            youtube_client = self._get_youtube_client()
            request = youtube_client.channels().list(
                part="snippet,contentDetails,statistics", mine=True
            )
            response = request.execute()

            if response["items"]:
                channel = response["items"][0]
                return {
                    "id": channel["id"],
                    "title": channel["snippet"]["title"],
                    "description": channel["snippet"].get("description", ""),
                    "subscriber_count": channel["statistics"].get(
                        "subscriberCount", "비공개"
                    ),
                    "video_count": channel["statistics"].get("videoCount", "0"),
                    "view_count": channel["statistics"].get("viewCount", "0"),
                    "thumbnail_url": channel["snippet"]["thumbnails"]["default"]["url"],
                }
            else:
                print("❌ 채널 정보를 찾을 수 없습니다.")
                return None

        except Exception as e:
            print(f"❌ 채널 정보 조회 실패: {e}")
            return None

    def get_playlists(self, max_results: int = 25) -> list:
        """채널의 플레이리스트 목록 조회"""
        self._ensure_authenticated()

        try:
            youtube_client = self._get_youtube_client()
            request = youtube_client.playlists().list(
                part="snippet,contentDetails", mine=True, maxResults=max_results
            )
            response = request.execute()

            playlists = []
            for playlist in response.get("items", []):
                playlists.append(
                    {
                        "id": playlist["id"],
                        "title": playlist["snippet"]["title"],
                        "description": playlist["snippet"].get("description", ""),
                        "item_count": playlist["contentDetails"]["itemCount"],
                        "published_at": playlist["snippet"]["publishedAt"],
                    }
                )

            return playlists

        except Exception as e:
            print(f"❌ 플레이리스트 조회 실패: {e}")
            return []

    def get_recent_videos(self, max_results: int = 25) -> list:
        """최근 업로드된 비디오 목록 조회"""
        self._ensure_authenticated()

        try:
            # 채널의 업로드 플레이리스트 ID 조회
            youtube_client = self._get_youtube_client()
            channel_response = (
                youtube_client.channels()
                .list(part="contentDetails", mine=True)
                .execute()
            )

            if not channel_response["items"]:
                return []

            uploads_playlist_id = channel_response["items"][0]["contentDetails"][
                "relatedPlaylists"
            ]["uploads"]

            # 업로드 플레이리스트에서 비디오 목록 조회
            playlist_response = (
                youtube_client.playlistItems()
                .list(
                    part="snippet",
                    playlistId=uploads_playlist_id,
                    maxResults=max_results,
                )
                .execute()
            )

            videos = []
            for item in playlist_response.get("items", []):
                videos.append(
                    {
                        "video_id": item["snippet"]["resourceId"]["videoId"],
                        "title": item["snippet"]["title"],
                        "description": item["snippet"]["description"],
                        "published_at": item["snippet"]["publishedAt"],
                        "thumbnail_url": item["snippet"]["thumbnails"]["default"][
                            "url"
                        ],
                    }
                )

            return videos

        except Exception as e:
            print(f"❌ 최근 비디오 조회 실패: {e}")
            return []
