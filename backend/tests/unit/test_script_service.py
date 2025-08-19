"""
ScriptService 테스트
"""

import pytest
from datetime import datetime
from sqlalchemy.orm import Session

from app.services.script_service import ScriptService
from app.models.script import Script
from app.core.exceptions import ScriptNotFoundError, ScriptParsingError, DatabaseError


class TestScriptService:
    """ScriptService 테스트 클래스"""
    
    def test_create_script_from_file_success(self, test_db: Session, sample_script_content: str):
        """대본 파일에서 스크립트 생성 - 성공 케이스"""
        script_service = ScriptService(test_db)
        
        result = script_service.create_script_from_file(
            content=sample_script_content, 
            filename="test_script.txt"
        )
        
        assert result is not None
        assert result.id is not None
        assert result.title == "시니어의 지혜 이야기"
        assert result.status == "script_ready"
        assert result.content is not None
        assert result.created_at is not None
        
        # 데이터베이스에서 실제 저장 확인
        saved_script = test_db.query(Script).filter_by(id=result.id).first()
        assert saved_script is not None
        assert saved_script.title == result.title
    
    def test_create_script_from_invalid_file(self, test_db: Session):
        """잘못된 대본 파일 - 파싱 에러"""
        script_service = ScriptService(test_db)
        
        invalid_content = "잘못된 형식의 대본 파일"
        
        with pytest.raises(ScriptParsingError):
            script_service.create_script_from_file(
                content=invalid_content,
                filename="invalid_script.txt"
            )
    
    def test_get_script_by_id_success(self, test_db: Session, sample_script_content: str):
        """ID로 스크립트 조회 - 성공 케이스"""
        script_service = ScriptService(test_db)
        
        # 먼저 스크립트 생성
        created_script = script_service.create_script_from_file(
            content=sample_script_content,
            filename="test_script.txt"
        )
        
        # ID로 조회
        retrieved_script = script_service.get_script_by_id(created_script.id)
        
        assert retrieved_script.id == created_script.id
        assert retrieved_script.title == created_script.title
        assert retrieved_script.status == "script_ready"
    
    def test_get_script_by_id_not_found(self, test_db: Session):
        """존재하지 않는 ID로 스크립트 조회 - 에러"""
        script_service = ScriptService(test_db)
        
        with pytest.raises(ScriptNotFoundError):
            script_service.get_script_by_id(999)
    
    def test_get_scripts_all(self, test_db: Session, sample_script_content: str):
        """전체 스크립트 목록 조회"""
        script_service = ScriptService(test_db)
        
        # 여러 개 스크립트 생성
        for i in range(3):
            modified_content = sample_script_content.replace(
                "제목: 시니어의 지혜 이야기",
                f"제목: 테스트 스크립트 {i+1}"
            )
            script_service.create_script_from_file(
                content=modified_content,
                filename=f"test_script_{i+1}.txt"
            )
        
        result = script_service.get_scripts(skip=0, limit=10)
        
        assert result['total'] == 3
        assert len(result['scripts']) == 3
        assert result['skip'] == 0
        assert result['limit'] == 10
    
    def test_get_scripts_with_status_filter(self, test_db: Session, sample_script_content: str):
        """상태별 스크립트 목록 조회"""
        script_service = ScriptService(test_db)
        
        # 스크립트 생성
        created_script = script_service.create_script_from_file(
            content=sample_script_content,
            filename="test_script.txt"
        )
        
        # script_ready 상태로 필터링
        result = script_service.get_scripts(status="script_ready")
        
        assert result['total'] == 1
        assert len(result['scripts']) == 1
        assert result['scripts'][0]['status'] == "script_ready"
        
        # video_ready 상태로 필터링 (없어야 함)
        result = script_service.get_scripts(status="video_ready")
        
        assert result['total'] == 0
        assert len(result['scripts']) == 0
    
    def test_update_script_success(self, test_db: Session, sample_script_content: str):
        """스크립트 메타데이터 수정 - 성공"""
        script_service = ScriptService(test_db)
        
        # 스크립트 생성
        created_script = script_service.create_script_from_file(
            content=sample_script_content,
            filename="test_script.txt"
        )
        
        # 수정
        updated_script = script_service.update_script(
            script_id=created_script.id,
            title="수정된 제목",
            description="수정된 설명",
            tags="수정된, 태그"
        )
        
        assert updated_script.title == "수정된 제목"
        assert updated_script.description == "수정된 설명"
        assert updated_script.tags == "수정된, 태그"
        assert updated_script.updated_at is not None
        
        # 부분 수정 테스트
        partially_updated = script_service.update_script(
            script_id=created_script.id,
            title="다시 수정된 제목"
        )
        
        assert partially_updated.title == "다시 수정된 제목"
        assert partially_updated.description == "수정된 설명"  # 이전 값 유지
    
    def test_delete_script_success(self, test_db: Session, sample_script_content: str):
        """스크립트 삭제 - 성공"""
        script_service = ScriptService(test_db)
        
        # 스크립트 생성
        created_script = script_service.create_script_from_file(
            content=sample_script_content,
            filename="test_script.txt"
        )
        
        # 삭제
        result = script_service.delete_script(created_script.id)
        
        assert result['id'] == created_script.id
        assert result['title'] == created_script.title
        assert 'message' in result
        
        # 삭제 확인
        with pytest.raises(ScriptNotFoundError):
            script_service.get_script_by_id(created_script.id)
    
    def test_get_statistics(self, test_db: Session, sample_script_content: str):
        """스크립트 통계 조회"""
        script_service = ScriptService(test_db)
        
        # 여러 상태의 스크립트 생성
        script1 = script_service.create_script_from_file(
            content=sample_script_content,
            filename="script1.txt"
        )
        
        script2 = script_service.create_script_from_file(
            content=sample_script_content.replace("제목: 시니어의 지혜 이야기", "제목: 두 번째 스크립트"),
            filename="script2.txt"
        )
        
        # 하나는 video_ready 상태로 변경
        script_service.update_script_status(script2.id, "video_ready")
        
        stats = script_service.get_statistics()
        
        assert 'statistics' in stats
        assert stats['statistics']['total'] == 2
        assert stats['statistics']['script_ready'] == 1
        assert stats['statistics']['video_ready'] == 1
        assert 'recent_script' in stats
        assert stats['recent_script'] is not None
    
    def test_search_scripts(self, test_db: Session, sample_script_content: str):
        """제목으로 스크립트 검색"""
        script_service = ScriptService(test_db)
        
        # 다른 제목의 스크립트들 생성
        titles = ["시니어의 지혜", "젊은이의 도전", "시니어 커뮤니티"]
        
        for title in titles:
            modified_content = sample_script_content.replace(
                "제목: 시니어의 지혜 이야기",
                f"제목: {title}"
            )
            script_service.create_script_from_file(
                content=modified_content,
                filename=f"{title}.txt"
            )
        
        # "시니어" 검색
        results = script_service.search_scripts("시니어")
        
        assert len(results) == 2  # "시니어의 지혜", "시니어 커뮤니티"
        
        # "젊은이" 검색
        results = script_service.search_scripts("젊은이")
        
        assert len(results) == 1
        assert "젊은이" in results[0].title
    
    def test_update_script_status(self, test_db: Session, sample_script_content: str):
        """스크립트 상태 업데이트"""
        script_service = ScriptService(test_db)
        
        # 스크립트 생성
        created_script = script_service.create_script_from_file(
            content=sample_script_content,
            filename="test_script.txt"
        )
        
        assert created_script.status == "script_ready"
        
        # 상태 변경
        updated_script = script_service.update_script_status(
            created_script.id, 
            "video_ready"
        )
        
        assert updated_script.status == "video_ready"
        
        # 데이터베이스에서 확인
        db_script = test_db.query(Script).filter_by(id=created_script.id).first()
        assert db_script.status == "video_ready"
    
    def test_get_scripts_ready_for_video(self, test_db: Session, sample_script_content: str):
        """비디오 업로드 준비된 스크립트 조회"""
        script_service = ScriptService(test_db)
        
        # script_ready 상태 스크립트 생성
        script1 = script_service.create_script_from_file(
            content=sample_script_content,
            filename="script1.txt"
        )
        
        # video_ready 상태 스크립트 생성
        script2 = script_service.create_script_from_file(
            content=sample_script_content.replace("제목: 시니어의 지혜 이야기", "제목: 두 번째 스크립트"),
            filename="script2.txt"
        )
        script_service.update_script_status(script2.id, "video_ready")
        
        # script_ready 상태만 조회되어야 함
        ready_scripts = script_service.get_scripts_ready_for_video()
        
        assert len(ready_scripts) == 1
        assert ready_scripts[0].id == script1.id
        assert ready_scripts[0].status == "script_ready"
    
    def test_get_scripts_ready_for_youtube(self, test_db: Session, sample_script_content: str):
        """YouTube 업로드 준비된 스크립트 조회"""
        script_service = ScriptService(test_db)
        
        # video_ready 상태 스크립트 생성
        script = script_service.create_script_from_file(
            content=sample_script_content,
            filename="script.txt"
        )
        script_service.update_script_status(script.id, "video_ready")
        
        # video_ready 상태 조회
        ready_scripts = script_service.get_scripts_ready_for_youtube()
        
        assert len(ready_scripts) == 1
        assert ready_scripts[0].id == script.id
        assert ready_scripts[0].status == "video_ready"