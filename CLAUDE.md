# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

**YouTube Upload Automation for Korean Seniors** - A FastAPI backend system that automates YouTube content upload for senior Korean content creators, with a focus on simplicity and complete automation.

## 🏗️ Clean Architecture Implementation

This system follows **Clean Architecture** principles with a well-structured FastAPI application:

```
backend/app/
├── main.py                 # FastAPI application entry point
├── config.py              # Pydantic Settings configuration
├── database.py            # SQLAlchemy database setup
├── core/                  # Core utilities
│   ├── exceptions.py      # Custom exception hierarchy
│   ├── logging.py         # Structured logging system
│   └── validators.py      # Validation logic
├── models/                # SQLAlchemy data models
│   └── script.py          # Script entity model
├── repositories/          # Repository pattern implementation
│   ├── base.py           # Generic Repository interface
│   └── script_repository.py # Script-specific Repository
├── services/              # Business logic layer
│   ├── script_service.py  # Script management business logic
│   ├── script_parser.py   # Script parsing logic
│   ├── upload_service.py  # Upload business logic
│   ├── websocket_manager.py # WebSocket 연결 및 알림 관리
│   └── youtube/          # YouTube API service managers
├── routers/              # FastAPI routers (API endpoints)
│   ├── scripts.py        # Script management API
│   ├── upload.py         # Upload API
│   └── websocket.py      # WebSocket 실시간 통신 API
└── middleware/           # Custom middleware
    └── error_handler.py  # Global error handling

frontend/src/
├── main.tsx               # React app entry point
├── App.tsx               # Root React component
├── components/           # React components
│   ├── layout/          # Layout components
│   │   ├── Layout.tsx   # Main app layout with sidebar/header
│   │   ├── Sidebar.tsx  # Navigation sidebar (glassmorphism)
│   │   └── Header.tsx   # Page header with search/profile
│   ├── WebSocketProvider.tsx  # WebSocket 연결 상태 관리
│   ├── NotificationPanel.tsx  # 실시간 알림 UI
│   ├── ConnectionStatus.tsx   # WebSocket 연결 상태 표시
│   └── ui/              # Reusable UI components (shadcn/ui)
│       ├── Button.tsx   # Button component
│       ├── Card.tsx     # Card container component
│       └── Input.tsx    # Input form component
├── pages/               # Page components
│   ├── Dashboard.tsx    # Main dashboard with stats
│   ├── ScriptUpload.tsx # Script file upload page
│   ├── ManagePage.tsx   # Content management page
│   └── SettingsPage.tsx # System settings page
├── services/            # API service layer
│   ├── scripts.ts       # Script API calls
│   ├── uploads.ts       # Upload API calls
│   └── websocket.ts     # WebSocket 메시지 처리 서비스
├── hooks/               # Custom React hooks
│   ├── useScripts.ts    # Script data management
│   ├── useUploads.ts    # Upload state management
│   └── useWebSocket.ts  # WebSocket 연결 및 실시간 통신
├── types/               # TypeScript type definitions
│   └── index.ts         # All shared types
├── utils/               # Utility functions
│   └── api.ts           # API client with error handling
└── routes.tsx           # React Router configuration
```

### 🎨 Architecture Patterns

**Backend:**
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Dependency Injection**: FastAPI Depends for testable code
- **Custom Exceptions**: Structured error handling
- **Structured Logging**: Component-based logging with daily rotation

**Frontend:**
- **Component-Based Architecture**: Modular React components
- **Service Layer Pattern**: API abstraction in services/
- **Custom Hooks Pattern**: Reusable state logic
- **WebSocket Real-time**: 실시간 통신 및 알림 시스템
- **TypeScript Strict Mode**: Type safety throughout
- **Modern CSS Architecture**: Tailwind + shadcn/ui components

## 🛠️ Essential Development Commands

### Backend (Poetry Environment Management)
```bash
# Install dependencies
poetry install

# Install with development dependencies
poetry install --with dev,test

# Activate virtual environment
poetry shell
```

### Backend Commands (Makefile based)
```bash
# Server management
make run                # uvicorn app.main:app --reload
make run-prod          # Production server

# Code quality
make format            # black + isort
make lint              # flake8 + mypy
make test              # pytest
make test-cov          # Coverage testing

# Database operations
make migrate           # alembic upgrade head
make migrate-auto      # Auto-generate migration
```

### Frontend Development
```bash
# Install dependencies
cd frontend && npm install

# Development server
npm run dev            # Vite dev server (http://localhost:5173)

# Build and deployment
npm run build          # TypeScript compilation + Vite build
npm run preview        # Preview production build

# Code quality
npm run lint           # ESLint TypeScript checking
```

### Environment Configuration (.env)
```bash
# Server config
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
BACKEND_RELOAD=true

# File paths
UPLOAD_DIR=uploads/videos
CREDENTIALS_PATH=credentials.json
TOKEN_PATH=token.pickle

# YouTube API
DEFAULT_PRIVACY_STATUS=private
DEFAULT_CATEGORY_ID=22
YOUTUBE_PROJECT_VERIFIED=true
YOUTUBE_PROJECT_CREATED_AFTER_2020_07_28=false

# Logging
DEBUG=true
LOG_LEVEL=INFO

# Frontend (development)
VITE_API_BASE_URL=http://localhost:8000   # Backend API URL for frontend
VITE_WS_URL=ws://localhost:8000/ws        # WebSocket URL for real-time features
```

### Frontend Configuration
- **Vite Config**: `vite.config.ts` with path aliases (`@` -> `./src`)
- **TypeScript**: Strict mode enabled with project references
- **Tailwind**: Modern v4 with custom color variables and animations
- **PostCSS**: Configured for Tailwind processing
- **WebSocket**: Real-time communication for notifications and progress tracking

## 📊 Core Data Models

### Script Entity
```python
class Script(Base):
    id: int                    # Primary Key
    title: str                 # Video title (최대 100자)
    content: str               # Script content
    description: str           # Video description (최대 5000 바이트)
    tags: str                  # Tags (최대 500자)
    thumbnail_text: str        # Thumbnail text
    imagefx_prompt: str        # ImageFX prompt
    status: str                # Current status
    video_file_path: str       # Video file path
    youtube_video_id: str      # YouTube video ID
    scheduled_time: datetime   # Scheduled upload time
    created_at: datetime
    updated_at: datetime
```

### Status Workflow
```
script_ready → video_ready → uploaded/scheduled → error
```

## 🔧 Core Business Logic

### 1. Script Parsing (ScriptParser)
**Location**: `app/services/script_parser.py`

```python
# Script file format
=== 제목 ===
[Video Title]

=== 메타데이터 ===
설명: [Description]
태그: [tag1, tag2, ...]

=== 썸네일 정보 ===
텍스트: [Thumbnail text]
ImageFX 프롬프트: [AI generation prompt]
```

- Regex-based section parsing
- Metadata extraction and validation
- Error handling for malformed scripts

### 2. Repository Pattern
**Location**: `app/repositories/script_repository.py`

```python
class ScriptRepository(BaseSQLAlchemyRepository[Script]):
    # Basic CRUD plus domain-specific queries
    def get_by_status(self, status: str) -> List[Script]
    def get_ready_for_video_upload(self) -> List[Script]
    def get_statistics(self) -> dict
    def search_by_title(self, title_query: str) -> List[Script]
```

### 3. Service Layer
**Location**: `app/services/script_service.py`

```python
class ScriptService:
    def create_script_from_file(self, content: str, filename: str) -> Script
    def get_scripts(self, skip: int, limit: int, status: str) -> dict
    def update_script_status(self, script_id: int, new_status: str) -> Script
    def get_statistics(self) -> dict
```

### 4. WebSocket Real-time System
**Location**: `app/services/websocket_manager.py`

```python
class ConnectionManager:
    # WebSocket 연결 풀링 및 사용자/스크립트 구독 관리
    def connect(self, websocket: WebSocket, user_id: str) -> str
    def disconnect(self, connection_id: str, user_id: str)
    def subscribe_to_script(self, connection_id: str, script_id: int)
    def broadcast_upload_progress(self, script_id: int, progress_data: dict)

class WebSocketNotificationService:
    # 실시간 알림 브로드캐스트
    def notify_video_uploaded(self, script_id: int, script_data: dict)
    def notify_youtube_upload_completed(self, script_id: int, script_data: dict, youtube_url: str)
    def notify_upload_error(self, script_id: int, error_message: str, script_data: dict)
```

## 🌐 API Endpoints

### Script Management API
```
POST   /api/scripts/upload           # Script file upload
GET    /api/scripts/                 # List scripts
GET    /api/scripts/{id}             # Get single script
PUT    /api/scripts/{id}             # Update script
DELETE /api/scripts/{id}             # Delete script
GET    /api/scripts/stats/summary    # Statistics
```

### Upload API
```
POST   /api/upload/video/{script_id} # Video file upload
POST   /api/upload/youtube/{script_id} # YouTube upload
GET    /api/upload/status/{script_id}   # Upload status
GET    /api/upload/progress/{script_id} # Upload progress (real-time)
DELETE /api/upload/video/{script_id}    # Delete video file
```

### WebSocket API
```
WS     /ws                          # WebSocket connection endpoint
GET    /ws/stats                    # WebSocket connection statistics
POST   /ws/broadcast                # Admin broadcast API
POST   /ws/notify/script/{script_id} # Script-specific notification API
```

### System API
```
GET    /                            # API status check
GET    /health                      # Health check
GET    /docs                        # Swagger documentation
```

## 🚨 Custom Exception System

### Exception Hierarchy
**Location**: `app/core/exceptions.py`

```python
BaseAppException                     # Base custom exception
├── ScriptNotFoundError (404)        # Script not found
├── ScriptParsingError (400)         # Script parsing failure
├── FileValidationError (400)        # File validation failure
├── InvalidScriptStatusError (400)   # Invalid status transition
├── YouTubeAuthenticationError (401) # YouTube auth failure
├── YouTubeUploadError (500)         # YouTube upload failure
├── DatabaseError (500)              # Database operation failure
└── ValidationError (400)            # Data validation failure
```

### Global Error Handler
**Location**: `app/middleware/error_handler.py`
- Converts all exceptions to consistent JSON responses
- Logs errors with request context

## 📝 Structured Logging System

### Component-specific Loggers
**Location**: `app/core/logging.py`

```python
# Logger types
get_logger("main")                   # Application main
get_service_logger("script_service") # Service loggers
get_repository_logger("script")      # Repository loggers
get_router_logger("scripts")         # Router loggers
```

### Log File Structure
```
logs/
├── app-2025-08-16.log              # All logs (daily rotation)
└── error-2025-08-16.log            # Error logs (daily rotation)
```

## 🧪 Testing Structure

```
tests/
├── conftest.py                     # Test configuration
├── unit/                          # Unit tests
│   └── test_script_parser.py      # Script parser tests
└── integration/                   # Integration tests
    ├── test_youtube_auth.py       # YouTube authentication tests
    └── test_youtube_client.py     # YouTube API tests
```

## ⚙️ Development Tools Configuration

### Code Quality Tools
```toml
[tool.black]                       # Code formatting
line-length = 88
target-version = ['py313']

[tool.isort]                       # Import sorting
profile = "black"

[tool.mypy]                        # Type checking
python_version = "3.13"
disallow_untyped_defs = true
```

### Pre-commit Hooks
```bash
poetry run pre-commit install      # Setup
poetry run pre-commit run --all-files  # Manual run
```

## 📦 Core Dependencies

### Backend Dependencies
- **FastAPI 0.104.1+**: Web framework
- **SQLAlchemy 2.0+**: ORM
- **Alembic 1.12+**: Database migrations
- **Pydantic 2.5+**: Data validation
- **Uvicorn**: ASGI server

### Frontend Dependencies
- **React 19.1.1+**: Modern React with concurrent features
- **TypeScript 5.8+**: Type safety and modern JS features
- **Vite 7.1.2+**: Fast build tool and dev server
- **Tailwind CSS 4.1.12+**: Utility-first CSS framework
- **@tanstack/react-query 5.85+**: Server state management
- **React Router DOM 7.8+**: Client-side routing
- **Lucide React**: Modern icon library
- **shadcn/ui**: High-quality component library

### YouTube Integration
- **google-api-python-client**: YouTube Data API v3
- **google-auth**: OAuth 2.0 authentication
- **google-auth-oauthlib**: OAuth flow
- **API 할당량**: 일일 10,000 units (비디오 업로드 1,600 units)
- **미인증 프로젝트**: 2020년 7월 28일 이후 생성시 private 모드만 가능

### Development Tools
- **pytest**: Testing framework
- **black**: Code formatting
- **isort**: Import sorting
- **flake8**: Linting
- **mypy**: Type checking
- **ESLint**: TypeScript/React linting
- **TypeScript ESLint**: Advanced TS analysis

## 🔄 Development Workflow

### Standard Development Process
1. **Create data model** (backend/models/)
2. **Implement repository** (backend/repositories/)
3. **Add service logic** (backend/services/)
4. **Create API endpoints** (backend/routers/)
5. **Add frontend types** (frontend/src/types/)
6. **Create frontend service** (frontend/src/services/)
7. **Build React components** (frontend/src/components/)
8. **Write tests** (backend/tests/ + frontend/)
9. **Check API documentation** (/docs)

### Code Quality Process
```bash
# Backend
make format                        # Format Python code
make lint                         # Check Python code quality
make test-cov                     # Test with coverage

# Frontend
cd frontend
npm run lint                      # ESLint TypeScript checking
npm run build                     # Type checking + build
```

### Database Management
```bash
# Model changes workflow
make migrate-auto                 # Generate migration
make migrate                      # Apply migration
```

### Frontend Styling Architecture
- **Base Styles**: Direct CSS properties for core styling (background, colors)
- **Component Styles**: Inline React styles for glassmorphism effects
- **Tailwind Classes**: Utility classes where Tailwind is properly configured
- **Design System**: Dark theme with modern gradients and animations

## 🚀 Production Deployment

### Docker Support
```bash
make docker-build                 # Build image
make docker-run                   # Run container
```

### Environment Configuration
- **Development**: DEBUG=true, LOG_LEVEL=DEBUG
- **Production**: DEBUG=false, LOG_LEVEL=WARNING

### Monitoring Points
- API response times
- YouTube API quota usage
- Upload success/failure rates
- Database connection health

## 🔧 Extension Patterns

### Adding New Entity
1. **Data Model**: `models/new_entity.py`
2. **Repository**: `repositories/new_entity_repository.py`
3. **Service**: `services/new_entity_service.py`
4. **API Router**: `routers/new_entity.py`
5. **Migration**: `make migrate-auto`

### Adding External Service Integration
1. **Service Manager**: `services/external_service/`
2. **Auth/Client**: `auth_manager.py`, `api_client.py`
3. **Configuration**: Add to `config.py`
4. **Custom Exceptions**: Add to `core/exceptions.py`

## 🐛 Common Troubleshooting

### Backend Issues
- **Database Lock**: SQLite concurrent access → consider PostgreSQL
- **File Upload Limit**: Check `MAX_VIDEO_SIZE_MB` setting
- **YouTube API Quota**: Daily 10,000 units limit (업로드당 1,600 units)
- **Token Expiry**: OAuth token refresh required
- **미인증 프로젝트**: public/unlisted 업로드 불가 (private만 가능)
- **필드 제한**: 제목 100자, 설명 5000바이트, 태그 500자

### Frontend Issues
- **Tailwind CSS Not Working**: Use inline styles as fallback for critical styling
- **API Connection Issues**: Check VITE_API_BASE_URL environment variable
- **WebSocket Connection Issues**: Check VITE_WS_URL environment variable and WebSocket server status
- **Build Errors**: Run `npm run lint` to check TypeScript errors
- **Styling Problems**: Ensure Tailwind config matches component usage
- **Development Server**: Use `npm run dev -- --host 0.0.0.0 --port 3000` for custom host/port
- **Real-time Features Not Working**: Check WebSocket connection status and browser console for errors

### Debug Log Access
```bash
# Backend logs
tail -f logs/app-$(date +%Y-%m-%d).log
tail -f logs/error-$(date +%Y-%m-%d).log

# Frontend development
# Check browser console for React/TypeScript errors
# Use React DevTools for component debugging
```

## 🔄 Week 7: WebSocket 실시간 기능 (완료)

### 구현된 실시간 기능
- ✅ **WebSocket 연결 관리**: 자동 재연결, 하트비트, 연결 풀링
- ✅ **실시간 알림 시스템**: 업로드 상태 변화, 성공/실패 알림
- ✅ **업로드 진행률 추적**: 실시간 진행률 브로드캐스트
- ✅ **스크립트 구독 시스템**: 특정 스크립트 업데이트 구독
- ✅ **사용자 인터페이스**: 알림 패널, 연결 상태 표시
- ✅ **오류 처리**: WebSocket 연결 실패시 재연결 로직

### 실시간 알림 타입
```typescript
- system_notification: 시스템 전체 알림
- script_update: 스크립트 상태 변경 알림  
- upload_progress: 업로드 진행률 알림
- script_status: 스크립트 상태 조회 응답
- connection_established: 연결 설정 확인
- subscription_confirmed: 구독 확인
```

### WebSocket 메시지 프로토콜
```typescript
// 클라이언트 → 서버
{
  type: 'subscribe_script' | 'unsubscribe_script' | 'get_script_status' | 'ping',
  script_id?: number,
  timestamp?: string
}

// 서버 → 클라이언트  
{
  type: string,
  script_id?: number,
  data?: any,
  timestamp: string
}
```

---

**Important Note**: This system is designed specifically for **Korean seniors** using **simplified automation** processes. Keep the user interface **simple** and **intuitive** while maintaining **robust** backend functionality including **real-time progress tracking** and **instant notifications**.