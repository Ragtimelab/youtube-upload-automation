"""
Script 엔티티에 대한 Repository 구현체
"""

from typing import List, Optional

from sqlalchemy.orm import Session

from ..models.script import Script
from .base import BaseSQLAlchemyRepository


class ScriptRepository(BaseSQLAlchemyRepository[Script]):
    """Script Repository"""

    def __init__(self, db: Session):
        super().__init__(db, Script)

    def get_by_status(
        self, status: str, skip: int = 0, limit: int = 100
    ) -> List[Script]:
        """상태별 대본 조회"""
        return (
            self.db.query(self.model)
            .filter(self.model.status == status)
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_youtube_id(self, youtube_video_id: str) -> Optional[Script]:
        """YouTube 비디오 ID로 대본 조회"""
        return (
            self.db.query(self.model)
            .filter(self.model.youtube_video_id == youtube_video_id)
            .first()
        )

    def get_ready_for_video_upload(
        self, skip: int = 0, limit: int = 100
    ) -> List[Script]:
        """비디오 업로드 준비된 대본들 조회"""
        return (
            self.db.query(self.model)
            .filter(self.model.status == "script_ready")
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_ready_for_youtube_upload(
        self, skip: int = 0, limit: int = 100
    ) -> List[Script]:
        """YouTube 업로드 준비된 대본들 조회"""
        return (
            self.db.query(self.model)
            .filter(self.model.status == "video_ready")
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_uploaded_scripts(self, skip: int = 0, limit: int = 100) -> List[Script]:
        """업로드 완료된 대본들 조회"""
        return (
            self.db.query(self.model)
            .filter(self.model.status.in_(["uploaded", "scheduled"]))
            .order_by(self.model.updated_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_error_scripts(self, skip: int = 0, limit: int = 100) -> List[Script]:
        """에러 상태 대본들 조회"""
        return (
            self.db.query(self.model)
            .filter(self.model.status == "error")
            .order_by(self.model.updated_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_status(self, status: str) -> int:
        """상태별 대본 개수"""
        return self.db.query(self.model).filter(self.model.status == status).count()

    def get_statistics(self) -> dict:
        """대본 통계 조회"""
        total = self.count()

        stats = {
            "total": total,
            "script_ready": self.count_by_status("script_ready"),
            "video_ready": self.count_by_status("video_ready"),
            "uploaded": self.count_by_status("uploaded"),
            "scheduled": self.count_by_status("scheduled"),
            "error": self.count_by_status("error"),
        }

        # 최근 생성된 대본
        recent_script = (
            self.db.query(self.model).order_by(self.model.created_at.desc()).first()
        )

        return {
            "statistics": stats,
            "recent_script": (
                {
                    "id": recent_script.id if recent_script else None,
                    "title": recent_script.title if recent_script else None,
                    "created_at": recent_script.created_at if recent_script else None,
                }
                if recent_script
                else None
            ),
        }

    def search_by_title(
        self, title_query: str, skip: int = 0, limit: int = 100
    ) -> List[Script]:
        """제목으로 대본 검색"""
        return (
            self.db.query(self.model)
            .filter(self.model.title.contains(title_query))
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def has_video_file(self, script_id: int) -> bool:
        """비디오 파일 존재 여부 확인"""
        script = self.get_by_id(script_id)
        return bool(script and script.video_file_path is not None)

    def update_status(self, script_id: int, new_status: str) -> Optional[Script]:
        """대본 상태 업데이트"""
        script = self.get_by_id(script_id)
        if script:
            script.status = new_status
            return self.update(script)
        return None

    def find_by_title_and_content(self, title: str, content: str) -> List[Script]:
        """제목과 내용이 동일한 스크립트 찾기 (중복 검사용)"""
        return (
            self.db.query(self.model)
            .filter(self.model.title == title)
            .filter(self.model.content == content)
            .all()
        )
