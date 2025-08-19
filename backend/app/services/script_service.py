"""
대본 관련 비즈니스 로직을 처리하는 Service
"""

import os
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from ..core.exceptions import (
    DatabaseError,
    FileUploadError,
    InvalidScriptStatusError,
    ScriptNotFoundError,
)
from ..models.script import Script
from ..repositories.script_repository import ScriptRepository
from .script_parser import ScriptParser, ScriptParsingError


class ScriptService:
    """대본 관리 서비스"""

    def __init__(self, db: Session):
        self.db = db
        self.repository = ScriptRepository(db)
        self.parser = ScriptParser()

    def create_script_from_file(self, content: str, filename: str) -> Script:
        """파일에서 대본 생성"""
        try:
            # 대본 파싱
            parsed_data = self.parser.parse_script_file(content)

            # 데이터 유효성 검증
            if not self.parser.validate_parsed_data(parsed_data):
                raise ScriptParsingError("파싱된 데이터가 유효하지 않습니다.")

            # Script 엔티티 생성
            script = Script(
                title=parsed_data["title"],
                content=parsed_data["content"],
                description=parsed_data.get("description", ""),
                tags=parsed_data.get("tags", ""),
                thumbnail_text=parsed_data.get("thumbnail_text", ""),
                imagefx_prompt=parsed_data.get("imagefx_prompt", ""),
                status="script_ready",
                created_at=datetime.now(timezone.utc),
            )

            return self.repository.create(script)

        except ScriptParsingError:
            raise
        except Exception as e:
            raise DatabaseError(f"대본 생성 중 오류 발생: {str(e)}")

    def get_script_by_id(self, script_id: int) -> Script:
        """대본 ID로 조회"""
        script = self.repository.get_by_id(script_id)
        if not script:
            raise ScriptNotFoundError(script_id)
        return script

    def get_scripts(
        self, skip: int = 0, limit: int = 100, status: Optional[str] = None
    ) -> dict:
        """대본 목록 조회"""
        try:
            if status:
                scripts = self.repository.get_by_status(status, skip, limit)
                total = self.repository.count_by_status(status)
            else:
                scripts = self.repository.get_all(skip, limit)
                total = self.repository.count()

            return {
                "scripts": scripts,
                "total": total,
                "skip": skip,
                "limit": limit,
                "status_filter": status,
            }
        except Exception as e:
            raise DatabaseError(f"대본 목록 조회 중 오류 발생: {str(e)}")

    def update_script(
        self,
        script_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[str] = None,
        thumbnail_text: Optional[str] = None,
        imagefx_prompt: Optional[str] = None,
    ) -> Script:
        """대본 정보 수정"""
        script = self.get_script_by_id(script_id)

        try:
            # 수정 가능한 필드 업데이트
            if title is not None:
                script.title = title
            if description is not None:
                script.description = description
            if tags is not None:
                script.tags = tags
            if thumbnail_text is not None:
                script.thumbnail_text = thumbnail_text
            if imagefx_prompt is not None:
                script.imagefx_prompt = imagefx_prompt

            script.updated_at = datetime.now(timezone.utc)

            return self.repository.update(script)

        except Exception as e:
            raise DatabaseError(f"대본 수정 중 오류 발생: {str(e)}")

    def delete_script(self, script_id: int) -> dict:
        """대본 삭제"""
        script = self.get_script_by_id(script_id)

        # 업로드된 상태의 대본은 삭제 불가
        if script.status == "uploaded":
            raise InvalidScriptStatusError(script.status, "삭제 불가능")

        try:
            # 연관된 파일도 삭제
            if script.video_file_path and os.path.exists(script.video_file_path):
                os.remove(script.video_file_path)

            success = self.repository.delete(script_id)
            if not success:
                raise DatabaseError("대본 삭제 실패")

            return {"id": script_id, "title": script.title, "message": "대본 삭제 완료"}

        except Exception as e:
            raise DatabaseError(f"대본 삭제 중 오류 발생: {str(e)}")

    def get_statistics(self) -> dict:
        """대본 통계 조회"""
        try:
            return self.repository.get_statistics()
        except Exception as e:
            raise DatabaseError(f"통계 조회 중 오류 발생: {str(e)}")

    def search_scripts(
        self, title_query: str, skip: int = 0, limit: int = 100
    ) -> List[Script]:
        """제목으로 대본 검색"""
        try:
            return self.repository.search_by_title(title_query, skip, limit)
        except Exception as e:
            raise DatabaseError(f"대본 검색 중 오류 발생: {str(e)}")

    def update_script_status(self, script_id: int, new_status: str) -> Script:
        """대본 상태 업데이트"""
        try:
            updated_script = self.repository.update_status(script_id, new_status)
            if not updated_script:
                raise ScriptNotFoundError(script_id)
            return updated_script
        except Exception as e:
            raise DatabaseError(f"대본 상태 업데이트 중 오류 발생: {str(e)}")

    def get_scripts_ready_for_video(
        self, skip: int = 0, limit: int = 100
    ) -> List[Script]:
        """비디오 업로드 준비된 대본들 조회"""
        try:
            return self.repository.get_ready_for_video_upload(skip, limit)
        except Exception as e:
            raise DatabaseError(f"비디오 준비 대본 조회 중 오류 발생: {str(e)}")

    def get_scripts_ready_for_youtube(
        self, skip: int = 0, limit: int = 100
    ) -> List[Script]:
        """YouTube 업로드 준비된 대본들 조회"""
        try:
            return self.repository.get_ready_for_youtube_upload(skip, limit)
        except Exception as e:
            raise DatabaseError(f"YouTube 준비 대본 조회 중 오류 발생: {str(e)}")
