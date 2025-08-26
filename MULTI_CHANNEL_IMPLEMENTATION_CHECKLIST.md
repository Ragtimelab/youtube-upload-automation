# 🚀 다중 채널 시스템 구현 체크리스트

> **목표**: Google Cloud 프로젝트별 독립적인 YouTube API 할당량을 활용하여 업로드 용량을 N배 확장  
> **작성일**: 2025-08-26  
> **현재 목표**: 4개 프로젝트 × 10,000 units = 40,000 units/일 = 24개 업로드/일  

**핵심 개념**: 1개 Google Cloud 프로젝트 = 1개 독립적인 YouTube API 할당량 (10,000 units/일)

---

## 📊 **프로젝트 현황**

### ✅ **기반 시스템 분석 완료**
- [x] **현재 아키텍처 파악**: 단일 채널 구조 확인 완료
- [x] **데이터베이스 구조 분석**: Script 모델에 channel_id 없음 확인
- [x] **인증 시스템 분석**: 단일 credentials/token 파일 구조 확인
- [x] **channels.yaml 구조**: 다중 채널 고려된 구조 확인
- [x] **마이그레이션 시스템**: SQLAlchemy + Alembic 활용 가능 확인

### 🎯 **목표 시스템 설계**
- [ ] **할당량 확장**: 현재 6개/일 → 24개/일 (4배 증가)
- [ ] **자동 프로젝트 선택**: 할당량 기반 지능적 분배
- [ ] **통합 관리**: 단일 시스템에서 모든 프로젝트 관리
- [ ] **실시간 모니터링**: 프로젝트별 할당량 추적

---

## 📋 **Phase 1: Google Cloud 프로젝트 설정 및 기초 구조 (Week 1)**

### 🔧 **1.1 Google Cloud Console 설정**

#### Google Cloud 프로젝트 생성
- [ ] **프로젝트 1**: `maeum-seorab-youtube-001` 생성
  - [ ] YouTube Data API v3 활성화
  - [ ] OAuth 동의 화면 구성 (외부 사용자)
  - [ ] OAuth 2.0 클라이언트 ID 생성 (데스크톱 앱)
  - [ ] credentials-001.json 다운로드

- [ ] **프로젝트 2**: `maeum-seorab-youtube-002` 생성
  - [ ] YouTube Data API v3 활성화
  - [ ] OAuth 동의 화면 구성
  - [ ] OAuth 2.0 클라이언트 ID 생성
  - [ ] credentials-002.json 다운로드

- [ ] **프로젝트 3**: `maeum-seorab-youtube-003` 생성
  - [ ] YouTube Data API v3 활성화
  - [ ] OAuth 동의 화면 구성
  - [ ] OAuth 2.0 클라이언트 ID 생성
  - [ ] credentials-003.json 다운로드

- [ ] **프로젝트 4**: `maeum-seorab-youtube-004` 생성
  - [ ] YouTube Data API v3 활성화
  - [ ] OAuth 동의 화면 구성
  - [ ] OAuth 2.0 클라이언트 ID 생성
  - [ ] credentials-004.json 다운로드

#### 인증 파일 구조 설정
- [ ] `.secrets/youtube-projects/` 디렉토리 생성
- [ ] `.secrets/youtube-projects/project-001/` 디렉토리 생성
  - [ ] `credentials.json` 파일 배치
  - [ ] `token.pickle` 파일 준비 (인증 후 생성됨)
- [ ] `.secrets/youtube-projects/project-002/` 디렉토리 생성 및 파일 배치
- [ ] `.secrets/youtube-projects/project-003/` 디렉토리 생성 및 파일 배치
- [ ] `.secrets/youtube-projects/project-004/` 디렉토리 생성 및 파일 배치
- [ ] `.gitignore`에 `.secrets/youtube-projects/` 추가 확인

### 🗃️ **1.2 데이터베이스 스키마 설계**

#### 새로운 테이블 설계
- [ ] **youtube_projects 테이블 설계**
  ```sql
  CREATE TABLE youtube_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_key VARCHAR(50) UNIQUE NOT NULL,        -- 'project-001'
      project_name VARCHAR(100) NOT NULL,              -- 'maeum-seorab-youtube-001'
      google_cloud_project_id VARCHAR(100) NOT NULL,   -- Google Cloud 프로젝트 ID
      credentials_file_path VARCHAR(500) NOT NULL,     -- credentials.json 경로
      token_file_path VARCHAR(500) NOT NULL,           -- token.pickle 경로
      daily_quota_limit INTEGER DEFAULT 10000,         -- 일일 할당량
      daily_quota_used INTEGER DEFAULT 0,              -- 일일 사용량
      last_reset_date DATE,                            -- 할당량 리셋 날짜
      is_active BOOLEAN DEFAULT TRUE,
      is_authenticated BOOLEAN DEFAULT FALSE,
      priority INTEGER DEFAULT 1,                     -- 우선순위
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [ ] **channels 테이블 설계**
  ```sql
  CREATE TABLE channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_key VARCHAR(50) UNIQUE NOT NULL,        -- 'maeum-seorab'
      channel_name VARCHAR(100) NOT NULL,             -- '마음서랍'
      youtube_channel_id VARCHAR(100),                -- YouTube 채널 ID
      default_project_id INTEGER REFERENCES youtube_projects(id),
      channels_yaml_key VARCHAR(50),                  -- channels.yaml의 키
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [ ] **upload_history 테이블 설계**
  ```sql
  CREATE TABLE upload_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      script_id INTEGER REFERENCES scripts(id),
      channel_id INTEGER REFERENCES channels(id),
      youtube_project_id INTEGER REFERENCES youtube_projects(id),
      youtube_video_id VARCHAR(50),
      quota_cost INTEGER DEFAULT 1600,
      upload_status VARCHAR(20),                      -- 'success', 'failed', 'quota_exceeded'
      upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      project_quota_before INTEGER,
      project_quota_after INTEGER,
      error_message TEXT
  );
  ```

#### 기존 테이블 수정
- [ ] **scripts 테이블에 컬럼 추가**
  ```sql
  ALTER TABLE scripts ADD COLUMN channel_id INTEGER REFERENCES channels(id);
  ALTER TABLE scripts ADD COLUMN youtube_project_id INTEGER REFERENCES youtube_projects(id);
  ```

#### Alembic 마이그레이션 생성
- [ ] `alembic revision --autogenerate -m "Add multi-project support tables"`
- [ ] 마이그레이션 파일 검토 및 수정
- [ ] `alembic upgrade head` 실행
- [ ] 데이터베이스 스키마 변경 확인

### 📁 **1.3 모델 파일 생성**

#### SQLAlchemy 모델 생성
- [ ] `backend/app/models/youtube_project.py` 생성
  ```python
  class YouTubeProject(Base):
      __tablename__ = "youtube_projects"
      # 필드 정의
      # 관계 정의
      # 메서드 정의
  ```

- [ ] `backend/app/models/channel.py` 생성
  ```python
  class Channel(Base):
      __tablename__ = "channels"
      # 필드 정의
      # 관계 정의
  ```

- [ ] `backend/app/models/upload_history.py` 생성
  ```python
  class UploadHistory(Base):
      __tablename__ = "upload_history"
      # 필드 정의
      # 관계 정의
  ```

- [ ] `backend/app/models/__init__.py` 업데이트
  - [ ] 새로운 모델들 import 추가
  - [ ] `__all__` 리스트 업데이트

#### 기존 모델 업데이트
- [ ] `backend/app/models/script.py` 수정
  - [ ] `channel_id` 필드 추가
  - [ ] `youtube_project_id` 필드 추가
  - [ ] 관계 정의 추가

---

## 📋 **Phase 2: Backend 서비스 계층 구현 (Week 2)**

### 🔧 **2.1 YouTube 프로젝트 관리 서비스**

#### ProjectManager 서비스 생성
- [ ] `backend/app/services/project_manager.py` 생성
  - [ ] `YouTubeProjectManager` 클래스 정의
  - [ ] `create_project()` - 프로젝트 등록
  - [ ] `get_project()` - 프로젝트 조회
  - [ ] `update_project()` - 프로젝트 수정
  - [ ] `delete_project()` - 프로젝트 삭제
  - [ ] `list_projects()` - 프로젝트 목록
  - [ ] `authenticate_project()` - 프로젝트 인증
  - [ ] `test_project_connection()` - 연결 테스트

#### QuotaManager 서비스 생성
- [ ] `backend/app/services/quota_manager.py` 생성
  - [ ] `QuotaManager` 클래스 정의
  - [ ] `get_available_project()` - 사용 가능한 프로젝트 선택
  - [ ] `consume_quota()` - 할당량 차감
  - [ ] `reset_daily_quotas()` - 일일 할당량 리셋
  - [ ] `get_quota_summary()` - 전체 할당량 현황
  - [ ] `check_project_quota()` - 프로젝트별 할당량 확인
  - [ ] `calculate_remaining_uploads()` - 잔여 업로드 수 계산

#### ProjectSelector 서비스 생성
- [ ] `backend/app/services/project_selector.py` 생성
  - [ ] `ProjectSelector` 클래스 정의
  - [ ] `select_upload_project()` - 업로드용 프로젝트 자동 선택
  - [ ] `select_by_round_robin()` - Round-robin 방식 선택
  - [ ] `select_by_priority()` - 우선순위 기반 선택
  - [ ] `select_by_quota_balance()` - 할당량 균형 기반 선택
  - [ ] `get_project_recommendations()` - 프로젝트 추천

### 🔐 **2.2 다중 프로젝트 인증 시스템**

#### MultiProjectAuth 서비스 생성
- [ ] `backend/app/services/youtube/multi_project_auth.py` 생성
  - [ ] `MultiProjectAuthManager` 클래스 정의
  - [ ] `authenticate_project()` - 프로젝트별 인증
  - [ ] `get_project_credentials()` - 프로젝트별 인증 정보 반환
  - [ ] `is_project_authenticated()` - 프로젝트 인증 상태 확인
  - [ ] `refresh_project_token()` - 프로젝트 토큰 갱신
  - [ ] `load_project_credentials()` - 프로젝트 인증 정보 로드

#### ProjectClient 서비스 생성
- [ ] `backend/app/services/youtube/project_client.py` 생성
  - [ ] `ProjectYouTubeClient` 클래스 정의
  - [ ] `get_authenticated_client()` - 인증된 YouTube 클라이언트 반환
  - [ ] `upload_video_with_project()` - 프로젝트 지정 업로드
  - [ ] `get_channel_info_with_project()` - 프로젝트별 채널 정보
  - [ ] `check_project_api_health()` - 프로젝트 API 상태 확인

#### 기존 서비스 업데이트
- [ ] `backend/app/services/youtube/upload_manager.py` 수정
  - [ ] 프로젝트별 업로드 지원 추가
  - [ ] `upload_with_project()` 메서드 추가
  - [ ] 할당량 추적 로직 통합

### 🛤️ **2.3 API 라우터 구현**

#### YouTube Projects API 생성
- [ ] `backend/app/routers/youtube_projects.py` 생성
  ```python
  # 프로젝트 관리
  POST   /api/youtube-projects/                    # 프로젝트 등록
  GET    /api/youtube-projects/                    # 프로젝트 목록
  GET    /api/youtube-projects/{project_id}        # 프로젝트 상세
  PUT    /api/youtube-projects/{project_id}        # 프로젝트 수정
  DELETE /api/youtube-projects/{project_id}        # 프로젝트 삭제
  
  # 프로젝트 인증 및 상태
  POST   /api/youtube-projects/{project_id}/auth   # 프로젝트 인증
  GET    /api/youtube-projects/{project_id}/status # 프로젝트 상태
  GET    /api/youtube-projects/{project_id}/quota  # 프로젝트 할당량
  POST   /api/youtube-projects/{project_id}/test   # 연결 테스트
  ```

#### Channels API 생성
- [ ] `backend/app/routers/channels.py` 생성
  ```python
  # 채널 관리
  POST   /api/channels/                           # 채널 등록
  GET    /api/channels/                           # 채널 목록
  GET    /api/channels/{channel_id}               # 채널 상세
  PUT    /api/channels/{channel_id}               # 채널 수정
  DELETE /api/channels/{channel_id}               # 채널 삭제
  ```

#### Quota API 생성
- [ ] `backend/app/routers/quota.py` 생성
  ```python
  # 전체 할당량 관리
  GET    /api/quota/summary                       # 전체 할당량 현황
  GET    /api/quota/projects                      # 프로젝트별 할당량
  GET    /api/quota/available-projects            # 사용 가능한 프로젝트
  POST   /api/quota/reset-daily                   # 일일 할당량 리셋
  GET    /api/quota/upload-capacity               # 업로드 가능 용량
  ```

#### 기존 API 수정
- [ ] `backend/app/routers/upload.py` 수정
  ```python
  # 업로드 API에 프로젝트 선택 기능 추가
  POST /api/upload/youtube/{script_id}?project_id={id}        # 프로젝트 지정
  POST /api/upload/youtube/{script_id}?auto_select=true       # 자동 선택
  GET  /api/upload/youtube/{script_id}/suggest-project        # 추천 프로젝트
  POST /api/upload/youtube/batch?auto_distribute=true         # 배치 분배 업로드
  ```

- [ ] `backend/app/routers/scripts.py` 수정
  - [ ] 채널 선택 기능 추가
  - [ ] 프로젝트 연결 기능 추가

#### 라우터 등록
- [ ] `backend/app/main.py` 수정
  - [ ] 새로운 라우터들 import 및 등록
  - [ ] API 문서에 새로운 엔드포인트 반영

---

## 📋 **Phase 3: Frontend UI 구현 (Week 3)**

### 🎨 **3.1 새로운 UI 컴포넌트**

#### ProjectSelector 컴포넌트
- [ ] `frontend/src/components/projects/ProjectSelector.tsx` 생성
  - [ ] 프로젝트 선택 드롭다운
  - [ ] 프로젝트별 할당량 표시
  - [ ] 인증 상태 인디케이터
  - [ ] 추천 프로젝트 하이라이트
  - [ ] TypeScript 타입 정의

#### ProjectQuotaMonitor 컴포넌트
- [ ] `frontend/src/components/projects/ProjectQuotaMonitor.tsx` 생성
  - [ ] 실시간 할당량 모니터링
  - [ ] 프로젝트별 사용량 프로그레스 바
  - [ ] 전체 시스템 할당량 요약
  - [ ] 일일 리셋 카운트다운
  - [ ] 예상 가능 업로드 수 표시

#### ProjectStatusCard 컴포넌트
- [ ] `frontend/src/components/projects/ProjectStatusCard.tsx` 생성
  - [ ] 프로젝트별 상태 카드
  - [ ] 인증 상태, 할당량, 활성화 상태
  - [ ] 빠른 액션 버튼 (인증, 테스트 등)
  - [ ] 프로젝트 우선순위 표시

#### ChannelSelector 컴포넌트
- [ ] `frontend/src/components/channels/ChannelSelector.tsx` 생성
  - [ ] 채널 선택 드롭다운
  - [ ] 채널별 기본 프로젝트 표시
  - [ ] 채널 상태 인디케이터

### 📄 **3.2 새로운 페이지**

#### ProjectManagementPage
- [ ] `frontend/src/pages/ProjectManagementPage.tsx` 생성
  - [ ] 프로젝트 목록 테이블
  - [ ] 프로젝트 등록 폼
  - [ ] 프로젝트 인증 관리
  - [ ] 할당량 현황 대시보드
  - [ ] 프로젝트 상태 모니터링
  - [ ] 연결 테스트 기능

### 🔄 **3.3 기존 페이지 수정**

#### ScriptsPage 수정
- [ ] `frontend/src/pages/ScriptsPage.tsx` 수정
  - [ ] ChannelSelector 컴포넌트 추가
  - [ ] 채널별 스크립트 필터링
  - [ ] 스크립트 업로드 시 채널 선택

#### UploadPage 수정
- [ ] `frontend/src/pages/UploadPage.tsx` 수정
  - [ ] ProjectSelector 컴포넌트 추가
  - [ ] 자동 프로젝트 선택 옵션
  - [ ] 프로젝트별 업로드 진행률
  - [ ] 할당량 확인 및 경고

#### YouTubePage 수정
- [ ] `frontend/src/pages/YouTubePage.tsx` 수정
  - [ ] 프로젝트별 업로드 이력 필터링
  - [ ] 프로젝트별 통계 표시
  - [ ] 배치 업로드 프로젝트 분배 기능

#### DashboardPage 수정
- [ ] `frontend/src/pages/DashboardPage.tsx` 수정
  - [ ] ProjectQuotaMonitor 컴포넌트 추가
  - [ ] 전체 프로젝트 현황 카드
  - [ ] 시스템 전체 업로드 용량 표시
  - [ ] 프로젝트별 활성화 상태

### 🔌 **3.4 API 서비스 통합**

#### Project API 클라이언트
- [ ] `frontend/src/services/projectApi.ts` 생성
  - [ ] 프로젝트 CRUD 함수
  - [ ] 프로젝트 인증 함수
  - [ ] 할당량 조회 함수
  - [ ] 상태 확인 함수

#### Quota API 클라이언트
- [ ] `frontend/src/services/quotaApi.ts` 생성
  - [ ] 전체 할당량 조회
  - [ ] 프로젝트별 할당량 조회
  - [ ] 업로드 가능 용량 계산

#### 타입 정의 업데이트
- [ ] `frontend/src/types/project.ts` 생성
  ```typescript
  interface YouTubeProject {
    id: number;
    project_key: string;
    project_name: string;
    google_cloud_project_id: string;
    daily_quota_limit: number;
    daily_quota_used: number;
    is_active: boolean;
    is_authenticated: boolean;
    priority: number;
  }
  
  interface Channel {
    id: number;
    channel_key: string;
    channel_name: string;
    youtube_channel_id?: string;
    default_project_id?: number;
  }
  
  interface QuotaSummary {
    total_quota: number;
    total_used: number;
    available_uploads: number;
    projects: ProjectQuota[];
  }
  ```

#### React Query 훅 생성
- [ ] `frontend/src/hooks/useProjects.ts` 생성
  - [ ] useProjects 훅
  - [ ] useProjectAuth 훅
  - [ ] useQuotaSummary 훅
  - [ ] useProjectRecommendation 훅

---

## 📋 **Phase 4: CLI 도구 확장 (Week 4)**

### ⌨️ **4.1 새로운 CLI 명령어 구현**

#### Project 명령어 그룹
- [ ] `cli/commands/project.py` 생성
  ```python
  # 프로젝트 관리 명령어
  @click.group()
  def project():
      """YouTube 프로젝트 관리"""
  
  @project.command()
  def list():
      """프로젝트 목록 조회"""
  
  @project.command()
  @click.argument('project_key')
  @click.argument('credentials_path')
  def add(project_key, credentials_path):
      """프로젝트 등록"""
  
  @project.command()
  @click.argument('project_key')
  def auth(project_key):
      """프로젝트 인증"""
  
  @project.command()
  def status():
      """전체 프로젝트 상태"""
      
  @project.command()
  @click.argument('project_key')
  def test(project_key):
      """프로젝트 연결 테스트"""
  ```

#### Quota 명령어 그룹
- [ ] `cli/commands/quota.py` 생성
  ```python
  # 할당량 관리 명령어
  @click.group()
  def quota():
      """할당량 관리"""
  
  @quota.command()
  def summary():
      """전체 할당량 현황"""
  
  @quota.command()
  @click.argument('project_key')
  def project(project_key):
      """프로젝트별 할당량"""
      
  @quota.command()
  def available():
      """사용 가능한 프로젝트"""
      
  @quota.command()
  def reset():
      """일일 할당량 리셋"""
  ```

### 🔧 **4.2 기존 명령어 수정**

#### YouTube 명령어 확장
- [ ] `cli/commands/youtube.py` 수정
  - [ ] `--project` 옵션 추가
  - [ ] `--auto-select` 옵션 추가  
  - [ ] `--suggest` 옵션 추가
  - [ ] 배치 업로드 프로젝트 분배 기능

#### Script 명령어 확장
- [ ] `cli/commands/script.py` 수정
  - [ ] `--channel` 옵션 추가
  - [ ] 채널별 스크립트 필터링

### 🛠️ **4.3 CLI 유틸리티 확장**

#### Project 클라이언트
- [ ] `cli/utils/project_client.py` 생성
  - [ ] ProjectAPIClient 클래스
  - [ ] 프로젝트 관리 API 호출 함수들
  - [ ] 인증 플로우 처리

#### Quota 유틸리티
- [ ] `cli/utils/quota_utils.py` 생성
  - [ ] 할당량 계산 유틸리티
  - [ ] 프로젝트 선택 로직
  - [ ] 할당량 표시 포매터

### 📋 **4.4 CLI 메인 모듈 업데이트**

- [ ] `cli/main.py` 수정
  - [ ] 새로운 명령어 그룹 등록
  - [ ] 도움말 업데이트
  - [ ] 예시 명령어 추가

---

## 📋 **Phase 5: 설정 및 통합 (Week 5)**

### 📝 **5.1 설정 파일 확장**

#### channels.yaml 확장
- [ ] `config/channels.yaml` 수정
  ```yaml
  # YouTube Projects 메타데이터 추가
  youtube_projects:
    project-001:
      google_cloud_project_id: "maeum-seorab-youtube-001"
      description: "마음서랍 채널 - 기본 프로젝트"
      priority: 1
    project-002:
      google_cloud_project_id: "maeum-seorab-youtube-002"
      description: "마음서랍 채널 - 백업 프로젝트 1"
      priority: 2
  
  # 채널별 프로젝트 설정 추가
  channels:
    maeum-seorab:
      # 기존 설정 유지
      youtube_projects:
        primary: "project-001"
        backup: ["project-002", "project-003", "project-004"]
      quota_settings:
        max_daily_uploads: 20
        quota_buffer: 1000
        auto_project_switch: true
  ```

#### 환경 설정 업데이트
- [ ] `backend/app/config.py` 수정
  - [ ] 다중 프로젝트 설정 추가
  - [ ] 기본 프로젝트 설정
  - [ ] 할당량 관련 설정

### 🔄 **5.2 스케줄링 및 자동화**

#### 할당량 리셋 스케줄러
- [ ] 일일 할당량 리셋 스케줄러 구현
  - [ ] PST 기준 자정 리셋 로직
  - [ ] 백그라운드 태스크로 구현
  - [ ] 로깅 및 모니터링

#### 프로젝트 상태 모니터링
- [ ] 프로젝트 상태 자동 확인 시스템
  - [ ] 인증 상태 주기적 확인
  - [ ] API 연결 상태 모니터링
  - [ ] 이상 상태 알림 시스템

---

## 📋 **Phase 6: 테스트 및 검증 (Week 6)**

### 🧪 **6.1 단위 테스트**

#### Backend 서비스 테스트
- [ ] `backend/tests/unit/test_project_manager.py` 생성
- [ ] `backend/tests/unit/test_quota_manager.py` 생성
- [ ] `backend/tests/unit/test_project_selector.py` 생성
- [ ] `backend/tests/unit/test_multi_project_auth.py` 생성

#### API 엔드포인트 테스트
- [ ] `backend/tests/integration/test_youtube_projects_api.py` 생성
- [ ] `backend/tests/integration/test_channels_api.py` 생성
- [ ] `backend/tests/integration/test_quota_api.py` 생성

### 🔄 **6.2 통합 테스트**

#### 다중 프로젝트 업로드 테스트
- [ ] 프로젝트별 업로드 플로우 테스트
- [ ] 자동 프로젝트 선택 로직 테스트
- [ ] 할당량 초과 시 자동 전환 테스트
- [ ] 배치 업로드 프로젝트 분배 테스트

#### Frontend 컴포넌트 테스트
- [ ] ProjectSelector 컴포넌트 테스트
- [ ] ProjectQuotaMonitor 컴포넌트 테스트
- [ ] ProjectManagementPage 테스트

#### CLI 명령어 테스트
- [ ] 프로젝트 관리 명령어 테스트
- [ ] 할당량 관리 명령어 테스트
- [ ] 업로드 명령어 확장 기능 테스트

### 🎯 **6.3 시스템 검증**

#### 성능 테스트
- [ ] 다중 프로젝트 동시 업로드 성능 테스트
- [ ] 할당량 추적 성능 테스트
- [ ] 대시보드 실시간 업데이트 성능 테스트

#### 안정성 테스트
- [ ] 프로젝트 인증 실패 시 복구 테스트
- [ ] 할당량 초과 상황 처리 테스트
- [ ] 네트워크 오류 상황 복구 테스트

---

## 📋 **Phase 7: 문서화 및 배포 준비 (Week 7)**

### 📖 **7.1 문서 작성**

#### 사용자 가이드
- [ ] `MULTI_CHANNEL_USER_GUIDE.md` 작성
  - [ ] Google Cloud 프로젝트 설정 가이드
  - [ ] 다중 프로젝트 인증 가이드
  - [ ] 할당량 관리 가이드
  - [ ] 자동 업로드 분배 사용법

#### 개발자 가이드
- [ ] `MULTI_CHANNEL_DEVELOPMENT_GUIDE.md` 작성
  - [ ] 아키텍처 개요
  - [ ] 새로운 API 엔드포인트 문서
  - [ ] 데이터베이스 스키마 변경사항
  - [ ] 확장 및 커스터마이징 가이드

#### API 문서 업데이트
- [ ] `docs/API.md` 업데이트
  - [ ] YouTube Projects API 문서 추가
  - [ ] Channels API 문서 추가
  - [ ] Quota API 문서 추가

#### CLI 사용법 업데이트
- [ ] `docs/CLI_USAGE.md` 업데이트
  - [ ] 새로운 명령어 그룹 문서
  - [ ] 프로젝트 관리 명령어 예시
  - [ ] 할당량 관리 명령어 예시

### 🚀 **7.2 배포 준비**

#### 마이그레이션 스크립트
- [ ] 기존 데이터 마이그레이션 스크립트 작성
- [ ] 단일 프로젝트 → 다중 프로젝트 변환 도구
- [ ] 백업 및 복구 절차 문서화

#### 환경 설정 템플릿
- [ ] `.env.multi-channel.example` 생성
- [ ] `channels.yaml` 템플릿 업데이트
- [ ] 배포 체크리스트 작성

---

## 🎯 **최종 검증 체크리스트**

### ✅ **시스템 동작 확인**
- [ ] **4개 프로젝트 정상 인증**: 모든 프로젝트 OAuth 인증 완료
- [ ] **할당량 추적 정확성**: 실제 API 사용량과 추적 결과 일치
- [ ] **자동 프로젝트 선택**: 할당량 기반 지능적 선택 동작
- [ ] **Frontend 실시간 모니터링**: WebSocket 기반 할당량 업데이트
- [ ] **CLI 명령어 호환성**: 모든 새로운 명령어 정상 동작

### 🎊 **목표 달성 확인**
- [ ] **업로드 용량 확장**: 6개/일 → 24개/일 (4배 증가) 달성
- [ ] **할당량 초과 방지**: 자동 프로젝트 전환으로 중단 없는 업로드
- [ ] **통합 관리**: 단일 시스템에서 모든 프로젝트 관리 가능
- [ ] **실시간 모니터링**: 전체 시스템 할당량 현황 실시간 추적

### 🔄 **하위 호환성 확인**
- [ ] **기존 단일 채널 기능**: 기존 사용자 워크플로우 정상 동작
- [ ] **API 하위 호환성**: 기존 API 엔드포인트 정상 동작
- [ ] **CLI 하위 호환성**: 기존 CLI 명령어 정상 동작
- [ ] **데이터 마이그레이션**: 기존 데이터 무손실 마이그레이션

---

## 📊 **성과 지표**

### 🎯 **정량적 목표**
- **할당량 확장**: 10,000 units/일 → 40,000 units/일 (400% 증가)
- **업로드 용량**: 6개/일 → 24개/일 (400% 증가)
- **시스템 가용성**: 할당량 초과로 인한 중단 0%
- **응답 시간**: 프로젝트 선택 로직 < 100ms

### 📈 **정성적 목표**
- **사용자 경험**: 복잡성 증가 없이 기능 확장
- **관리 편의성**: 통합 대시보드로 간편한 모니터링
- **확장성**: 추가 프로젝트 쉬운 등록 및 관리
- **안정성**: 프로젝트 장애 시 자동 복구

---

## 🚨 **위험 요소 및 대응 방안**

### ⚠️ **기술적 위험**
- **Google Cloud 정책 변경**: → 정기적 정책 모니터링 및 대응 계획 수립
- **YouTube API 할당량 정책 변경**: → 다양한 할당량 시나리오 대응 로직 구현
- **다중 인증 복잡성**: → 상세한 인증 플로우 문서 및 자동화 도구 제공

### 🔧 **운영 위험**
- **프로젝트 인증 실패**: → 자동 재인증 로직 및 알림 시스템 구현
- **할당량 추적 오류**: → 실시간 검증 로직 및 수동 동기화 도구 제공
- **시스템 복잡도 증가**: → 포괄적인 문서화 및 사용자 교육 자료 제공

---

**🎉 다중 채널 시스템 구현으로 YouTube 업로드 용량을 4배 확장하고, 할당량 제한을 극복하여 안정적이고 확장 가능한 콘텐츠 자동화 시스템을 구축하겠습니다!**

---

**체크리스트 작성일**: 2025-08-26  
**예상 완료일**: 2025-10-07 (7주 계획)  
**최종 목표**: 40,000 units/일 = 24개 업로드/일 달성