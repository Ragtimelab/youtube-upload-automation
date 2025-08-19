"""
테스트 공통 설정
"""

import pytest
import tempfile
import shutil
from fastapi.testclient import TestClient

from app.config import Settings
from app.database import get_db
from .test_app import create_test_app, setup_test_database


@pytest.fixture
def test_db():
    """테스트용 인메모리 데이터베이스 (단위 테스트용)"""
    engine, TestingSessionLocal, override_get_db = setup_test_database()
    
    # 세션 반환
    yield TestingSessionLocal()


@pytest.fixture(scope="function")
def test_client():
    """테스트용 FastAPI 클라이언트 (통합 테스트용)"""
    # 테스트용 앱 생성
    app = create_test_app()
    
    # 테스트용 데이터베이스 설정
    engine, TestingSessionLocal, override_get_db = setup_test_database()
    
    # 의존성 재정의
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        # TestClient 생성
        client = TestClient(app)
        yield client
    finally:
        # 의존성 재정의 정리
        app.dependency_overrides.clear()


@pytest.fixture
def temp_upload_dir():
    """임시 업로드 디렉토리"""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)


@pytest.fixture
def test_settings(temp_upload_dir):
    """테스트용 설정"""
    return Settings(
        upload_dir=temp_upload_dir,
        database_url="sqlite:///:memory:",
        debug=True,
        backend_reload=False
    )


@pytest.fixture
def sample_script_content():
    """샘플 대본 내용"""
    return """=== 대본 ===
안녕하세요, 오늘은 특별한 이야기를 들려드리겠습니다.
시니어 세대의 지혜와 경험을 나누는 시간입니다.

=== 메타데이터 ===
제목: 시니어의 지혜 이야기
설명: 인생 경험을 통해 얻은 소중한 교훈들을 나누는 이야기
태그: 시니어, 지혜, 인생, 경험

=== 썸네일 제작 ===
텍스트: 인생의 지혜
ImageFX 프롬프트: elderly korean person sharing wisdom, warm lighting, friendly atmosphere
"""


@pytest.fixture
def sample_video_file():
    """샘플 비디오 파일"""
    import tempfile
    
    # 임시 비디오 파일 생성 (실제 비디오 데이터는 아니지만 테스트용)
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        f.write(b"fake video content for testing")
        return f.name


@pytest.fixture
def client():
    """테스트용 YouTube 클라이언트 (통합 테스트용)"""
    from app.services.youtube_client import YouTubeClient
    return YouTubeClient()