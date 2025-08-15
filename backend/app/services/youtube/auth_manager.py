"""
YouTube API 인증 관리자
"""

import os
import pickle

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

from ...config import get_settings
from ...core.exceptions import YouTubeAuthenticationError


class YouTubeAuthManager:
    """YouTube API 인증 관리"""

    def __init__(self):
        self.settings = get_settings()
        self.credentials = None

    def authenticate(self) -> bool:
        """OAuth 2.0 인증 수행

        Returns:
            인증 성공 여부
        """
        creds = None
        token_path = str(self.settings.token_file_path)

        # 기존 토큰이 있으면 로드
        if os.path.exists(token_path):
            with open(token_path, "rb") as token:
                creds = pickle.load(token)

        # 유효한 자격증명이 없으면 새로 인증
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                print("🔄 기존 토큰 갱신 중...")
                try:
                    creds.refresh(Request())
                    print("✅ 토큰 갱신 성공")
                except Exception as e:
                    print(f"❌ 토큰 갱신 실패: {e}")
                    creds = None

            if not creds:
                creds = self._perform_oauth_flow()

            # 토큰 저장
            self._save_credentials(creds, token_path)

        self.credentials = creds
        return True

    def _perform_oauth_flow(self) -> Credentials:
        """OAuth 플로우 수행"""
        print("🔐 새로운 OAuth 인증 시작...")

        credentials_path = str(self.settings.credentials_file_path)
        if not os.path.exists(credentials_path):
            raise YouTubeAuthenticationError(
                f"credentials.json 파일을 찾을 수 없습니다: {credentials_path}"
            )

        try:
            flow = InstalledAppFlow.from_client_secrets_file(
                credentials_path, self.settings.youtube_api_scopes
            )
            creds = flow.run_local_server(port=0)
            print("✅ OAuth 인증 완료")
            return creds
        except Exception as e:
            raise YouTubeAuthenticationError(f"OAuth 인증 실패: {e}")

    def _save_credentials(self, creds: Credentials, token_path: str) -> None:
        """인증 정보 저장"""
        try:
            with open(token_path, "wb") as token:
                pickle.dump(creds, token)
            print(f"💾 토큰 저장 완료: {token_path}")
        except Exception as e:
            print(f"⚠️  토큰 저장 실패: {e}")

    def get_credentials(self) -> Credentials:
        """인증된 자격증명 반환"""
        if not self.credentials:
            raise YouTubeAuthenticationError(
                "인증이 필요합니다. authenticate()를 먼저 호출하세요."
            )
        return self.credentials

    def is_authenticated(self) -> bool:
        """인증 상태 확인"""
        return self.credentials is not None
