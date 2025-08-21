"""
YAML 기반 채널 설정 로더

채널 브랜딩 정보를 config/channels.yaml에서 로드하여 제공합니다.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, cast

import yaml


class ChannelConfigLoader:
    """채널 설정을 YAML에서 로드하는 유틸리티 클래스"""

    _instance: Optional["ChannelConfigLoader"] = None
    _config: Optional[Dict[str, Any]] = None

    def __new__(cls) -> "ChannelConfigLoader":
        """싱글톤 패턴으로 인스턴스 생성"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        """초기화 - 한 번만 실행됨"""
        if self._config is None:
            self._load_config()

    def _get_config_path(self) -> Path:
        """설정 파일 경로 반환"""
        # 프로젝트 루트 디렉토리 찾기
        current_dir = Path(__file__).resolve()

        # backend/app/core/yaml_loader.py에서 프로젝트 루트까지 3단계 위로
        project_root = current_dir.parent.parent.parent.parent

        config_path = project_root / "config" / "channels.yaml"

        if not config_path.exists():
            raise FileNotFoundError(
                f"채널 설정 파일이 존재하지 않습니다: {config_path}"
            )

        return config_path

    def _load_config(self) -> None:
        """YAML 설정 파일 로드"""
        try:
            config_path = self._get_config_path()

            with open(config_path, "r", encoding="utf-8") as file:
                self._config = yaml.safe_load(file)

            if not self._config or "channels" not in self._config:
                raise ValueError("올바른 채널 설정 형식이 아닙니다")

        except Exception as e:
            # 로드 실패 시 기본값으로 폴백
            self._config = {
                "channels": {
                    "maeum-seorab": {
                        "name": "마음서랍",
                        "about_description": "🌸 마음을 담아 전하는 우리 세대 이야기",
                        "video_footer": "🗂️ 마음서랍에서 꺼내드리는 진솔한 이야기",
                        "default_tags": ["마음서랍", "진솔한이야기", "인생이야기"],
                        "youtube_settings": {
                            "category_id": 24,
                            "default_privacy": "private",
                        },
                    }
                }
            }
            print(f"⚠️ YAML 로드 실패, 기본값 사용: {e}")

    def get_channel_config(self, channel_key: str = "maeum-seorab") -> Dict[str, Any]:
        """지정된 채널의 설정 반환

        Args:
            channel_key: 채널 키 (기본값: "maeum-seorab")

        Returns:
            채널 설정 딕셔너리
        """
        if not self._config or "channels" not in self._config:
            self._load_config()

        if self._config is None:
            raise RuntimeError("설정을 로드할 수 없습니다")

        channels = self._config.get("channels", {})

        if channel_key not in channels:
            raise ValueError(f"채널 '{channel_key}'를 찾을 수 없습니다")

        return cast(Dict[str, Any], channels[channel_key])

    def get_channel_name(self, channel_key: str = "maeum-seorab") -> str:
        """채널명 반환"""
        config = self.get_channel_config(channel_key)
        return cast(str, config.get("name", "마음서랍"))

    def get_about_description(self, channel_key: str = "maeum-seorab") -> str:
        """채널 소개글 반환 (YouTube 채널 페이지용)"""
        config = self.get_channel_config(channel_key)
        return cast(str, config.get("about_description", ""))

    def get_video_footer(self, channel_key: str = "maeum-seorab") -> str:
        """영상 푸터 반환 (영상 설명 자동 추가용)"""
        config = self.get_channel_config(channel_key)
        return cast(str, config.get("video_footer", ""))

    def get_default_tags(self, channel_key: str = "maeum-seorab") -> List[str]:
        """기본 태그 목록 반환"""
        config = self.get_channel_config(channel_key)
        return cast(List[str], config.get("default_tags", []))

    def get_youtube_settings(self, channel_key: str = "maeum-seorab") -> Dict[str, Any]:
        """YouTube API 설정 반환"""
        config = self.get_channel_config(channel_key)
        return cast(
            Dict[str, Any],
            config.get(
                "youtube_settings", {"category_id": 24, "default_privacy": "private"}
            ),
        )

    def reload_config(self) -> None:
        """설정 파일 다시 로드 (개발/테스트용)"""
        self._config = None
        self._load_config()

    def get_available_channels(self) -> List[str]:
        """사용 가능한 채널 목록 반환"""
        if not self._config or "channels" not in self._config:
            self._load_config()

        if self._config is None:
            return []

        return list(self._config.get("channels", {}).keys())


# 전역 인스턴스 (싱글톤)
channel_loader = ChannelConfigLoader()


# 편의 함수들 (기존 Constants API와 호환성 유지)
def get_channel_name(channel_key: str = "maeum-seorab") -> str:
    """채널명 반환"""
    return channel_loader.get_channel_name(channel_key)


def get_about_description(channel_key: str = "maeum-seorab") -> str:
    """채널 소개글 반환"""
    return channel_loader.get_about_description(channel_key)


def get_video_footer(channel_key: str = "maeum-seorab") -> str:
    """영상 푸터 반환"""
    return channel_loader.get_video_footer(channel_key)


def get_default_tags(channel_key: str = "maeum-seorab") -> List[str]:
    """기본 태그 목록 반환"""
    return channel_loader.get_default_tags(channel_key)


def get_youtube_settings(channel_key: str = "maeum-seorab") -> Dict[str, Any]:
    """YouTube 설정 반환"""
    return channel_loader.get_youtube_settings(channel_key)
