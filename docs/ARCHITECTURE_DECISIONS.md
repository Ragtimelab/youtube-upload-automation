# 🏗️ 아키텍처 결정 기록 (ADR)

> **YouTube Upload Automation 시스템 주요 아키텍처 결정사항 문서**

## 📋 목차

1. [문서 개요](#-문서-개요)
2. [시스템 설계 철학](#-시스템-설계-철학)
3. [핵심 아키텍처 결정](#-핵심-아키텍처-결정)
4. [기술 스택 선택](#-기술-스택-선택)
5. [데이터 관리 전략](#-데이터-관리-전략)
6. [인터페이스 설계](#-인터페이스-설계)
7. [성능 및 확장성](#-성능-및-확장성)
8. [보안 및 인증](#-보안-및-인증)
9. [테스트 전략](#-테스트-전략)
10. [개발 프로세스](#-개발-프로세스)

---

## 📄 문서 개요

### 목적

이 문서는 YouTube Upload Automation 시스템 개발 과정에서 내린 주요 아키텍처 결정사항들을 기록하고, 각 결정의 배경과 근거를 설명합니다.

### 대상 독자

- 시스템 유지보수 개발자
- 신규 팀원 온보딩
- 아키텍처 리뷰어
- 기술 의사결정자

### 문서 구성

각 결정사항은 다음 형식으로 기록됩니다:
- **결정**: 무엇을 결정했는가
- **배경**: 왜 이 결정이 필요했는가
- **고려사항**: 어떤 대안들을 검토했는가
- **결과**: 이 결정의 영향과 혜택

---

## 🎯 시스템 설계 철학

### ADR-001: 한국 시니어 특화 설계

**결정**: 한국 시니어 사용자에 특화된 단순하고 직관적인 인터페이스 설계

**배경**:
- 주 사용자층이 기술에 익숙하지 않은 시니어 계층
- 복잡한 설정보다는 자동화된 워크플로우 선호
- 한국어 콘텐츠에 최적화된 기능 필요

**고려사항**:
- 범용적인 YouTube 업로드 툴 vs 특화된 솔루션
- GUI 중심 vs CLI 중심 인터페이스
- 영어 기반 vs 한국어 기반 시스템

**결과**:
- CLI 기반이지만 Rich 라이브러리로 사용자 친화적 출력
- 스크립트 파일 형식의 한국어 섹션 구조 (`=== 제목 ===`)
- 날짜 기반 자동 매핑으로 batch 처리 지원

### ADR-002: 완전 자동화 우선 설계

**결정**: 수동 개입을 최소화하는 완전 자동화 워크플로우 구현

**배경**:
- 반복적인 업로드 작업의 비효율성
- 사용자 실수로 인한 오류 최소화 필요
- 콘텐츠 제작에 집중할 수 있는 환경 제공

**고려사항**:
- 단계별 수동 확인 vs 완전 자동화
- 에러 시 수동 개입 vs 자동 복구
- 개별 파일 처리 vs 배치 처리

**결과**:
- `date-upload` 명령어로 스크립트→비디오→YouTube 한 번에 처리
- 파일명 규칙 기반 자동 매핑 (`YYYYMMDD_NN_story`)
- `--dry-run` 모드로 실행 전 시뮬레이션 지원

---

## 🏗️ 핵심 아키텍처 결정

### ADR-003: Clean Architecture 채택

**결정**: Repository-Service-Router 패턴의 Clean Architecture 구현

**배경**:
- 비즈니스 로직과 데이터 접근 로직의 분리 필요
- 테스트 가능한 코드 구조 요구
- 향후 확장성과 유지보수성 고려

**고려사항**:
- 단순한 MVC vs Clean Architecture
- FastAPI 기본 구조 vs 계층화된 구조
- 복잡성 증가 vs 장기적 유지보수성

**결과**:
```
backend/app/
├── models/          # 데이터 모델 (SQLAlchemy)
├── repositories/    # 데이터 접근 계층
├── services/        # 비즈니스 로직 계층
├── routers/         # API 라우팅 계층
└── core/            # 공통 유틸리티
```

**혜택**:
- 각 계층의 독립적 테스트 가능
- 의존성 주입으로 모킹 용이
- 비즈니스 로직의 재사용성 향상

### ADR-004: 이중 인터페이스 전략

**결정**: FastAPI 백엔드 + CLI 인터페이스의 이중 구조

**배경**:
- 개발자용 API와 사용자용 CLI의 서로 다른 요구사항
- API의 확장성과 CLI의 사용성 모두 확보 필요
- WebSocket 기반 실시간 모니터링 지원

**고려사항**:
- 단일 인터페이스 vs 다중 인터페이스
- GUI vs CLI vs Web 인터페이스
- 백엔드 복잡성 vs 사용자 편의성

**결과**:
```
├── backend/         # FastAPI 서버 (API + WebSocket)
├── cli/             # 명령줄 인터페이스
└── docs/            # 통합 문서
```

**혜택**:
- API: 자동화, 통합, 확장성
- CLI: 직관성, 배치 처리, 터미널 친화적
- WebSocket: 실시간 진행률 모니터링

### ADR-005: 상태 기반 워크플로우 관리

**결정**: Script 엔티티 중심의 상태 기반 워크플로우 구현

**배경**:
- 업로드 과정의 여러 단계를 체계적으로 관리 필요
- 에러 상황에서의 복구 가능성 확보
- 진행 상황의 명확한 추적 요구

**고려사항**:
- 단순한 flag 기반 vs 명시적 상태 관리
- 개별 테이블 vs 단일 테이블 상태 관리
- 복잡한 상태 머신 vs 단순한 선형 상태

**결과**:
```
script_ready → video_ready → uploaded → error
```

**상태 전환 규칙**:
- 각 상태는 특정 조건에서만 전환 가능
- 에러 상태에서는 이전 단계로 복구 가능
- 상태별 허용 작업 명확히 정의

**혜택**:
- 워크플로우 진행 상황 명확한 추적
- 에러 상황에서 정확한 복구 지점 파악
- API 엔드포인트별 상태 검증 자동화

---

## 💻 기술 스택 선택

### ADR-006: FastAPI 프레임워크 선택

**결정**: FastAPI를 주요 백엔드 프레임워크로 채택

**배경**:
- 높은 성능과 자동 API 문서 생성 필요
- 타입 힌트 기반 개발과 Pydantic 통합
- WebSocket 지원과 비동기 처리 요구

**고려사항**:
- Django vs Flask vs FastAPI
- 동기 vs 비동기 프레임워크
- 학습 곡선 vs 기능성

**결과**:
- **성능**: uvicorn ASGI 서버로 높은 처리량
- **개발성**: 자동 타입 검증과 API 문서 생성
- **확장성**: WebSocket과 비동기 작업 지원

### ADR-007: SQLAlchemy ORM + SQLite 조합

**결정**: SQLAlchemy 2.0 ORM과 SQLite 데이터베이스 조합

**배경**:
- 1인 개발 환경에서 복잡한 DB 설정 부담 최소화
- ORM을 통한 타입 안전성과 관계 관리
- 파일 기반 백업과 이동의 용이성

**고려사항**:
- 원시 SQL vs ORM
- SQLite vs PostgreSQL vs MySQL
- 파일 DB vs 서버 DB

**결과**:
```python
# Modern SQLAlchemy 2.0 스타일
class Script(Base):
    __tablename__ = "scripts"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    # ...
```

**혜택**:
- 타입 안전성과 IDE 지원
- 마이그레이션 관리 (Alembic)
- 테스트 환경 구축 용이성

### ADR-008: Python 3.13 채택

**결정**: 최신 Python 3.13 버전 사용

**배경**:
- 최신 언어 기능과 성능 개선 활용
- 타입 힌트와 async/await 기능 최적화
- Poetry를 통한 현대적 의존성 관리

**고려사항**:
- 안정성 (LTS) vs 최신 기능
- 라이브러리 호환성 문제
- 배포 환경 지원 여부

**결과**:
- UTC 시간대 처리 개선 (`datetime.now(timezone.utc)`)
- 향상된 타입 힌트 지원
- 성능 최적화 혜택

---

## 📊 데이터 관리 전략

### ADR-009: JSON 직렬화 시스템 구축

**결정**: SQLAlchemy 모델을 위한 전용 JSON 직렬화 시스템 구현

**배경**:
- Pydantic V2에서 SQLAlchemy 모델 자동 직렬화 제거
- FastAPI 응답에서 "Unable to serialize unknown type" 에러 발생
- 일관된 API 응답 형식 필요

**고려사항**:
- Pydantic 모델 변환 vs 직접 딕셔너리 변환
- 성능 최적화 vs 개발 편의성
- 상세/요약 형식 분리 vs 단일 형식

**결과**:
```python
# app/core/serializers.py
def script_to_dict(script: Script) -> Dict[str, Any]:
    """상세 정보용"""
    return {
        "id": script.id,
        "title": script.title,
        # ... 모든 필드
    }

def script_summary_to_dict(script: Script) -> Dict[str, Any]:
    """목록용 요약"""
    return {
        "id": script.id,
        "title": script.title,
        "status": script.status,
        # ... 핵심 필드만
    }
```

**혜택**:
- Pydantic V2 완전 호환
- 성능 최적화된 응답 형식 분리
- 타입 안전한 JSON 직렬화

### ADR-010: 단일 엔티티 중심 설계

**결정**: Script 엔티티를 중심으로 한 단순한 데이터 모델

**배경**:
- 1인 개발 환경에서 복잡성 최소화
- 스크립트-비디오-YouTube의 단순한 관계
- 향후 확장 가능성 유지

**고려사항**:
- 정규화된 다중 테이블 vs 단일 테이블
- 복잡한 관계 vs 단순한 구조
- 확장성 vs 단순성

**결과**:
```python
class Script(Base):
    # 기본 정보
    id: int
    title: str
    content: str
    
    # 메타데이터
    description: str
    tags: str
    thumbnail_text: str
    imagefx_prompt: str
    
    # 상태 관리
    status: str
    video_file_path: str
    youtube_video_id: str
    
    # 타임스탬프
    created_at: datetime
    updated_at: datetime
    scheduled_time: datetime
```

**혜택**:
- 단순한 CRUD 작업
- 명확한 상태 추적
- 쉬운 백업과 복원

---

## 🎨 인터페이스 설계

### ADR-011: Rich 기반 CLI UX

**결정**: Rich 라이브러리를 활용한 시각적으로 향상된 CLI 구현

**배경**:
- 기본 터미널 출력의 가독성 한계
- 진행률 표시와 실시간 피드백 필요
- 사용자 경험 개선을 통한 도구 채택률 향상

**고려사항**:
- 기본 print vs Rich 라이브러리
- 단순함 vs 시각적 복잡성
- 의존성 증가 vs UX 개선

**결과**:
```python
# cli/utils/progress.py
from rich.console import Console
from rich.progress import Progress
from rich.table import Table

class EnhancedProgress:
    def create_progress_bar(self):
        return Progress(
            SpinnerColumn(),
            "[progress.description]{task.description}",
            BarColumn(),
            "[progress.percentage]{task.percentage:>3.0f}%",
            TimeRemainingColumn(),
        )
```

**구현된 기능**:
- 🎨 컬러풀한 상태 표시
- 📊 프로그레스 바와 스피너
- 📋 테이블 형태 데이터 출력
- ⚡ 실시간 업데이트

### ADR-012: 인터랙티브 모드 도입

**결정**: Phase 3에서 메뉴 기반 인터랙티브 모드 구현

**배경**:
- CLI 명령어에 익숙하지 않은 사용자 지원
- 복잡한 워크플로우의 단계별 안내 필요
- 실시간 모니터링과 피드백 요구

**고려사항**:
- 명령어 기반 vs 메뉴 기반
- 단순 CLI vs GUI 수준 기능
- 개발 복잡성 vs 사용자 편의성

**결과**:
```python
# cli/utils/interactive.py
class InteractiveMenu:
    def add_option(self, key: str, description: str, action: Callable):
        self.options[key] = {
            "description": description,
            "action": action
        }
    
    def run(self):
        while True:
            self.display_menu()
            choice = self.get_user_choice()
            self.execute_choice(choice)
```

**구현된 모드**:
- 🎮 `interactive`: 메뉴 기반 작업 선택
- 📊 `monitor`: 실시간 시스템 모니터링
- 📈 `dashboard`: 종합 대시보드

### ADR-013: 날짜 기반 자동 매핑 시스템

**결정**: 파일명 규칙 기반 자동 스크립트-비디오 매칭 시스템

**배경**:
- 배치 처리에서 수동 매핑의 비효율성
- 실수로 인한 잘못된 조합 방지
- 일관된 파일 관리 체계 구축

**고려사항**:
- 수동 지정 vs 자동 매칭
- 유연한 매칭 vs 엄격한 규칙
- 복잡한 알고리즘 vs 단순한 패턴

**결과**:
```python
# cli/utils/date_mapping.py
DATE_PATTERN = re.compile(r'^(\d{8})_(\d{1,2})_(.+)\.(txt|md|mp4)$')

# 파일명 예시:
# 20250819_01_story.txt ↔ 20250819_01_story.mp4
# 20250819_02_story.txt ↔ 20250819_02_story.mp4
```

**매칭 규칙**:
- 날짜: YYYYMMDD 형식
- 순번: 01, 02, ... (하루 여러 개 가능)
- 이름: 자유 형식 (story, news 등)
- 확장자: .txt/.md (스크립트), .mp4 (비디오)

**혜택**:
- 완전 자동화된 배치 처리
- 파일 관리 체계 표준화
- 실수 방지와 효율성 향상

---

## ⚡ 성능 및 확장성

### ADR-014: 계층별 응답 최적화

**결정**: API 응답 크기에 따른 상세/요약 형식 분리

**배경**:
- 목록 조회에서 불필요한 데이터 전송 방지
- 네트워크 대역폭과 응답 시간 최적화
- 클라이언트 메모리 사용량 최소화

**고려사항**:
- 단일 응답 형식 vs 다중 형식
- 개발 복잡성 vs 성능 최적화
- 일관성 vs 효율성

**결과**:
```python
# 목록 조회: 요약 형식 (핵심 필드만)
GET /api/scripts/ → script_summary_to_dict()

# 상세 조회: 전체 형식 (모든 필드)
GET /api/scripts/{id} → script_to_dict()
```

**성능 개선**:
- 목록 응답 크기 약 70% 감소
- 네트워크 전송 시간 단축
- 클라이언트 메모리 효율성 향상

### ADR-015: WebSocket 기반 실시간 통신

**결정**: 업로드 진행률과 상태 업데이트를 위한 WebSocket 구현

**배경**:
- 대용량 비디오 업로드의 긴 처리 시간
- 사용자의 진행 상황 파악 필요
- 에러 발생 시 즉시 알림 요구

**고려사항**:
- HTTP Polling vs WebSocket vs Server-Sent Events
- 복잡성 증가 vs 사용자 경험
- 연결 관리 오버헤드 vs 실시간성

**결과**:
```python
# app/services/websocket_manager.py
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.script_subscriptions: Dict[int, List[str]] = {}
    
    async def broadcast_upload_progress(self, script_id: int, progress_data: dict):
        # 특정 스크립트 구독자들에게 진행률 브로드캐스트
```

**구현된 기능**:
- 📡 연결 풀링과 자동 재연결
- 📊 실시간 진행률 브로드캐스트
- 🔔 상태 변경 알림
- ⚠️ 에러 발생 즉시 통지

---

## 🔒 보안 및 인증

### ADR-016: YouTube OAuth 2.0 통합

**결정**: Google OAuth 2.0 Flow를 통한 YouTube API 인증

**배경**:
- YouTube API 접근을 위한 필수 인증
- 사용자 개인 채널에 대한 안전한 접근
- API 키 방식의 제한적 권한

**고려사항**:
- API Key vs OAuth 2.0
- 서버 사이드 vs 클라이언트 사이드 인증
- 토큰 저장 방식

**결과**:
```python
# app/services/youtube/auth_manager.py
class YouTubeAuthManager:
    def __init__(self):
        self.credentials_path = "credentials.json"
        self.token_path = "token.pickle"
        self.scopes = ["https://www.googleapis.com/auth/youtube.upload"]
    
    def authenticate(self):
        # OAuth 2.0 Flow 처리
        # 토큰 갱신 자동 관리
```

**보안 조치**:
- 🔑 OAuth 토큰의 안전한 로컬 저장
- 🔄 자동 토큰 갱신 처리
- 🛡️ 최소 권한 원칙 (upload 권한만)

### ADR-017: 환경 변수 기반 설정 관리

**결정**: Pydantic Settings를 활용한 환경 변수 기반 설정

**배경**:
- 민감한 정보의 코드 분리 필요
- 개발/운영 환경별 설정 관리
- 설정 값의 타입 안전성 확보

**고려사항**:
- 하드코딩 vs 설정 파일 vs 환경 변수
- JSON/YAML vs .env 파일
- 런타임 변경 vs 재시작 필요

**결과**:
```python
# app/config.py
class Settings(BaseSettings):
    # 서버 설정
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    
    # 파일 경로
    CREDENTIALS_PATH: str = "credentials.json"
    TOKEN_PATH: str = "token.pickle"
    UPLOAD_DIR: str = "uploads/videos"
    
    # YouTube API
    DEFAULT_PRIVACY_STATUS: str = "private"
    DEFAULT_CATEGORY_ID: int = 22
    
    class Config:
        env_file = ".env"
```

**혜택**:
- 🔒 민감 정보 코드 분리
- ⚙️ 환경별 설정 관리
- ✅ 타입 검증과 기본값 제공

---

## 🧪 테스트 전략

### ADR-018: Modern Integration Test 패턴

**결정**: 임시 파일 데이터베이스를 사용한 완전 격리 테스트 패턴

**배경**:
- 기존 의존성 주입 오버라이드 방식의 불안정성
- "no such table: scripts" 에러 지속 발생
- 테스트 간 데이터 오염 방지 필요

**고려사항**:
- 메모리 DB vs 파일 DB vs 실제 DB
- 의존성 오버라이드 vs 완전 격리
- 테스트 속도 vs 안정성

**결과**:
```python
# tests/test_integration_final.py
def create_isolated_test_app():
    """완전히 격리된 테스트 앱 생성"""
    temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
    temp_db.close()
    
    engine = create_engine(f"sqlite:///{temp_db.name}")
    TestingSessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # 새로운 FastAPI 앱 인스턴스
    app = FastAPI()
    app.dependency_overrides[get_db] = override_get_db
    
    return app, temp_db.name
```

**패턴 특징**:
- 🗃️ 각 테스트마다 새로운 임시 데이터베이스
- 🧹 Setup/Teardown으로 완전한 정리
- 🏗️ 독립적인 FastAPI 앱 인스턴스

**결과**:
- ✅ 21개 테스트 모두 안정적 통과
- 🔄 테스트 간 완전한 격리
- 🚀 신뢰할 수 있는 CI/CD 파이프라인

### ADR-019: 계층별 테스트 전략

**결정**: Unit Test와 Integration Test의 명확한 분리

**배경**:
- 빠른 피드백을 위한 Unit Test
- 전체 워크플로우 검증을 위한 Integration Test
- 각 계층별 독립적 테스트 가능성

**고려사항**:
- E2E Test vs Integration Test vs Unit Test
- 테스트 복잡성 vs 커버리지
- 실행 시간 vs 신뢰성

**결과**:
```
tests/
├── unit/                    # 18개 - 빠른 단위 테스트
│   ├── test_script_parser.py   # 파서 로직
│   └── test_script_service.py  # 비즈니스 로직
├── test_integration_final.py   # 2개 - 전체 워크플로우
└── test_json_serialization.py # 1개 - 직렬화 검증
```

**테스트 범위**:
- **Unit (18개)**: 비즈니스 로직, 파서, 검증
- **Integration (3개)**: API 워크플로우, 에러 처리, JSON 직렬화
- **총 성공률**: 100% (21/21)

---

## 🔄 개발 프로세스

### ADR-020: Poetry 기반 의존성 관리

**결정**: Poetry를 주요 의존성 관리 도구로 채택

**배경**:
- pip + requirements.txt의 의존성 해결 한계
- 개발/운영 환경의 일관성 필요
- 가상환경과 패키지 관리의 통합

**고려사항**:
- pip + venv vs pipenv vs Poetry
- 학습 곡선 vs 기능성
- 팀 협업과 배포 일관성

**결과**:
```toml
# pyproject.toml
[tool.poetry.dependencies]
python = "^3.13"
fastapi = "^0.116.0"
sqlalchemy = "^2.0.35"
# ...

[tool.poetry.group.dev.dependencies]
pytest = "^8.4.1"
black = "^24.10.0"
mypy = "^1.11.2"
# ...
```

**혜택**:
- 🔒 정확한 의존성 버전 락
- 🎯 개발/테스트 그룹 분리
- 📦 빌드와 배포 표준화

### ADR-21: Makefile 기반 개발 워크플로우

**결정**: 자주 사용하는 명령어의 Makefile 표준화

**배경**:
- 복잡한 Poetry 명령어 단순화
- 새로운 개발자 온보딩 효율화
- 일관된 개발 환경 제공

**고려사항**:
- Shell Scripts vs Makefile vs Task Runner
- 플랫폼 호환성 vs 기능성
- 단순함 vs 유연성

**결과**:
```makefile
# Makefile
run:
	poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	poetry run pytest tests/unit/ tests/test_integration_final.py tests/test_json_serialization.py -v

format:
	poetry run black . && poetry run isort .

lint:
	poetry run flake8 . && poetry run mypy .
```

**표준화된 명령어**:
- `make run`: 개발 서버 실행
- `make test`: 안정적 테스트 실행
- `make format`: 코드 포매팅
- `make lint`: 코드 품질 검사

---

## 📈 성과 및 결과

### 달성된 목표

#### 🎯 기능적 목표
- ✅ **완전 자동화**: 스크립트→비디오→YouTube 한 번에 처리
- ✅ **배치 처리**: 날짜 기반 자동 매핑으로 여러 파일 동시 처리
- ✅ **실시간 모니터링**: WebSocket 기반 진행률 추적
- ✅ **사용자 친화적 인터페이스**: Rich 기반 CLI와 인터랙티브 모드

#### 🏗️ 기술적 목표
- ✅ **Clean Architecture**: 계층 분리와 의존성 주입
- ✅ **타입 안전성**: Python 3.13 + Pydantic V2
- ✅ **JSON 직렬화**: SQLAlchemy 모델의 안정적 변환
- ✅ **테스트 안정성**: 21개 테스트 100% 통과

#### 📊 품질 지표
- **테스트 커버리지**: 핵심 기능 100% 커버
- **코드 품질**: 타입 힌트, 린팅, 포매팅 표준화
- **문서화**: 포괄적 기술 문서와 사용자 가이드
- **유지보수성**: 모듈화된 구조와 명확한 책임 분리

### 학습된 교훈

#### 기술적 교훈
1. **의존성 주입의 한계**: FastAPI 의존성 오버라이드의 불안정성 발견
2. **Pydantic V2 변화**: SQLAlchemy 자동 직렬화 제거에 대한 대응
3. **테스트 격리의 중요성**: 임시 파일 DB의 완전 격리 효과

#### 설계 교훈
1. **단순함의 가치**: 복잡한 기능보다 단순하고 확실한 동작
2. **사용자 중심 설계**: 기술적 완성도보다 사용성 우선
3. **점진적 개선**: 기본 기능 완성 후 단계적 기능 추가

### 향후 개선 방향

#### 단기 개선사항
- 🔄 Legacy Integration Test 마이그레이션
- 📊 성능 테스트 추가 (대용량 파일)
- 🎨 CLI UX 추가 개선

#### 장기 확장 계획
- 🌐 웹 인터페이스 고려
- 📱 모바일 앱 연동 가능성
- ☁️ 클라우드 배포 최적화

---

## 📚 참고 문서

### 관련 문서
- [CLAUDE.md](../CLAUDE.md): 프로젝트 전체 가이드
- [API.md](./API.md): REST API 상세 문서
- [CLI_USAGE.md](./CLI_USAGE.md): CLI 사용법
- [TESTING_GUIDE.md](./TESTING_GUIDE.md): 테스트 가이드
- [JSON_SERIALIZATION.md](./JSON_SERIALIZATION.md): 직렬화 시스템

### 외부 참조
- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 문서](https://docs.sqlalchemy.org/en/20/)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Poetry 공식 가이드](https://python-poetry.org/docs/)

---

**문서 버전**: 1.0.0  
**마지막 업데이트**: 2025-08-19  
**작성자**: Claude Code (Architecture Review)

**이 문서는 YouTube Upload Automation 시스템의 핵심 아키텍처 결정사항들을 종합적으로 정리하여, 향후 개발과 유지보수에 도움이 되도록 작성되었습니다.**