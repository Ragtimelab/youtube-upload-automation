# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

**YouTube Upload Automation for Korean Seniors** - A comprehensive system with FastAPI backend, Streamlit web interface, and CLI tools that automates YouTube content upload for senior Korean content creators, focusing on simplicity and complete automation.

## 🏗️ Complete System Architecture

This system consists of **three main interfaces** with shared backend:

```
youtube-upload-automation/
├── backend/app/              # FastAPI API server + WebSocket
├── streamlit_app/           # Streamlit web interface
├── cli/                     # Command-line interface
└── frontend/               # React frontend (deprecated/legacy)
```

### Backend Architecture (Clean Architecture)
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
```

### Streamlit Application Architecture
```
streamlit_app/
├── main.py               # Streamlit app entry point with CSS styling
├── api/
│   └── client.py         # Complete API client for backend integration
├── pages/                # Multi-page Streamlit app
│   ├── dashboard.py      # Main dashboard with stats and charts
│   ├── scripts.py        # Script management (upload, edit, delete)
│   ├── uploads.py        # Video/YouTube upload management
│   ├── monitoring.py     # System monitoring and logs
│   └── settings.py       # System configuration
└── components/           # Reusable components
```

### CLI Architecture
```
cli/
├── main.py               # CLI entry point
├── commands/             # Command modules
│   ├── script.py         # Script management commands
│   ├── video.py          # Video upload commands
│   ├── youtube.py        # YouTube upload commands
│   └── status.py         # Status checking commands
└── utils/                # CLI utilities
    ├── api_client.py     # CLI-specific API client
    ├── config.py         # CLI configuration
    └── validators.py     # Input validation
```

### 🎨 Architecture Patterns

**Backend:**
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Dependency Injection**: FastAPI Depends for testable code
- **Custom Exceptions**: Structured error handling
- **Structured Logging**: Component-based logging with daily rotation

**Streamlit App:**
- **Multi-page Architecture**: Page-based navigation with st.navigation
- **Unified API Client**: Single client class for all backend communication
- **Component Isolation**: Each page handles specific functionality
- **CSS Customization**: Compact, professional styling optimized for productivity
- **Real-time Updates**: Integration with backend WebSocket for live monitoring

**CLI:**
- **Command Pattern**: Structured command organization
- **Rich Console Output**: Beautiful terminal interface with progress bars
- **Configuration Management**: YAML/JSON config file support

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

### Streamlit Application
```bash
# Run Streamlit app (from project root)
streamlit run streamlit_app/main.py

# Run on custom port
streamlit run streamlit_app/main.py --server.port 8501

# Run with development options
streamlit run streamlit_app/main.py --browser.gatherUsageStats false
```

### CLI Usage
```bash
# Direct execution (recommended)
python cli/main.py --help

# Executable script (automatic Poetry detection)
./youtube-cli --help

# Module execution
python -m cli.main --help

# Quick commands (executable scripts in root)
./quick-script          # Quick script upload
./quick-upload          # Quick video upload
```

### Environment Configuration
```bash
# Backend server config
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
```

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

### 2. Streamlit API Integration
**Location**: `streamlit_app/api/client.py`

```python
class YouTubeAutomationAPI:
    # Complete API client supporting all backend endpoints
    def health_check(self) -> Dict[str, Any]
    def get_scripts(self, skip: int = 0, limit: int = 100, status: str = None) -> Dict
    def upload_script(self, file_content: io.BytesIO, filename: str) -> Dict
    def upload_video_file(self, script_id: int, file_content: io.BytesIO, filename: str) -> Dict
    def upload_to_youtube(self, script_id: int, **kwargs) -> Dict
    def get_websocket_stats(self) -> Dict
```

### 3. WebSocket Real-time System
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
- **FastAPI 0.116.0+**: Web framework
- **SQLAlchemy 2.0+**: ORM
- **Alembic 1.12+**: Database migrations
- **Pydantic 2.5+**: Data validation
- **Uvicorn**: ASGI server
- **WebSockets 15.0+**: Real-time communication

### Streamlit Dependencies
- **Streamlit 1.48.1+**: Web interface framework
- **Plotly 6.3.0+**: Interactive charts and visualizations
- **Pandas 2.3.1+**: Data manipulation for statistics
- **Requests**: HTTP client for API communication

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

## 🔄 Development Workflow

### Standard Development Process
1. **Start backend server** (`make run` from backend/)
2. **Start interface** (Streamlit: `streamlit run streamlit_app/main.py`)
3. **Create data model** (backend/models/)
4. **Implement repository** (backend/repositories/)
5. **Add service logic** (backend/services/)
6. **Create API endpoints** (backend/routers/)
7. **Update Streamlit pages** (streamlit_app/pages/)
8. **Write tests** (backend/tests/)
9. **Check API documentation** (/docs)

### Code Quality Process
```bash
# Backend (from backend/)
make format                        # Format Python code
make lint                         # Check Python code quality
make test-cov                     # Test with coverage

# Full system check
poetry run pytest                 # Run all tests
```

### Database Management
```bash
# Model changes workflow (from backend/)
make migrate-auto                 # Generate migration
make migrate                      # Apply migration
```

### Streamlit Development Tips
- **Auto-reload**: Streamlit automatically reloads on file changes
- **CSS Debugging**: Use browser dev tools to inspect custom CSS
- **Session State**: Use `st.session_state` for cross-page data persistence
- **Error Handling**: Wrap API calls in try-catch for user-friendly errors

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

## 🔧 Interface-Specific Patterns

### Adding New Streamlit Page
1. **Create page file**: `streamlit_app/pages/new_page.py`
2. **Follow naming pattern**: `show_page_name()` function
3. **Use API client**: Import and use `get_api_client()`
4. **Add navigation**: Update main.py navigation structure
5. **Apply consistent styling**: Follow existing CSS patterns

### Adding CLI Command
1. **Create command file**: `cli/commands/new_command.py`
2. **Follow Click patterns**: Use decorators for options/arguments
3. **Use Rich output**: For beautiful terminal formatting
4. **Add to main CLI**: Register in `cli/main.py`

### Extending API
1. **Backend**: Add router → service → repository
2. **Streamlit**: Add method to `YouTubeAutomationAPI` class
3. **CLI**: Add command using new API endpoint
4. **Test**: Add integration tests

## 🐛 Common Troubleshooting

### Backend Issues
- **Database Lock**: SQLite concurrent access → consider PostgreSQL
- **File Upload Limit**: Check `MAX_VIDEO_SIZE_MB` setting
- **YouTube API Quota**: Daily 10,000 units limit (업로드당 1,600 units)
- **Token Expiry**: OAuth token refresh required
- **미인증 프로젝트**: public/unlisted 업로드 불가 (private만 가능)
- **필드 제한**: 제목 100자, 설명 5000바이트, 태그 500자

### Streamlit Issues
- **Port Conflicts**: Use `--server.port` to specify different port
- **API Connection**: Check backend server is running on correct port
- **CSS Not Applied**: Clear browser cache or use incognito mode
- **Session State Issues**: Use unique keys for widgets
- **Memory Issues**: Restart Streamlit if data gets corrupted

### CLI Issues
- **Permissions**: Make sure scripts are executable (`chmod +x`)
- **Python Path**: Ensure virtual environment is activated
- **API Connectivity**: Check backend server status

### Debug Log Access
```bash
# Backend logs
tail -f logs/app-$(date +%Y-%m-%d).log
tail -f logs/error-$(date +%Y-%m-%d).log

# Streamlit debugging
# Check terminal output where Streamlit is running
# Use st.write() for debugging in Streamlit app
```

## 🔄 WebSocket Real-time Features (Completed)

### 구현된 실시간 기능
- ✅ **WebSocket 연결 관리**: 자동 재연결, 하트비트, 연결 풀링
- ✅ **실시간 알림 시스템**: 업로드 상태 변화, 성공/실패 알림
- ✅ **업로드 진행률 추적**: 실시간 진행률 브로드캐스트
- ✅ **스크립트 구독 시스템**: 특정 스크립트 업데이트 구독
- ✅ **Streamlit 통합**: 모니터링 페이지에서 실시간 상태 확인
- ✅ **오류 처리**: WebSocket 연결 실패시 재연결 로직

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

**Important Note**: This system is designed specifically for **Korean seniors** using **simplified automation** processes. The **Streamlit interface** is the primary production interface, while CLI provides power-user functionality. Keep interfaces **simple** and **intuitive** while maintaining **robust** backend functionality including **real-time progress tracking** and **instant notifications**.