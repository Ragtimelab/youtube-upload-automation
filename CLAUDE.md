# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

**YouTube Upload Automation for Korean Seniors** - A comprehensive system with FastAPI backend and CLI tools that automates YouTube content upload for senior Korean content creators, focusing on simplicity and complete automation.

## 🏗️ Complete System Architecture

This system consists of **two main interfaces** with shared backend:

```
youtube-upload-automation/
├── backend/app/              # FastAPI API server + WebSocket
├── cli/                     # Command-line interface (primary)
└── docs/                    # Comprehensive documentation
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

### CLI Architecture
```
cli/
├── main.py               # CLI entry point with date-upload command
├── commands/             # Command modules
│   ├── script.py         # Script management commands
│   ├── video.py          # Video upload + auto-mapping commands
│   ├── youtube.py        # YouTube upload commands
│   └── status.py         # Status checking commands
└── utils/                # CLI utilities
    ├── api_client.py     # CLI-specific API client
    ├── config.py         # CLI configuration
    ├── validators.py     # Input validation + date file validation
    └── date_mapping.py   # Date-based auto-mapping system
```

### 🎨 Architecture Patterns

**Backend:**
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Dependency Injection**: FastAPI Depends for testable code
- **Custom Exceptions**: Structured error handling
- **Structured Logging**: Component-based logging with daily rotation

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

### Backend Commands (Makefile based - Run from backend/ directory)
```bash
# Server management (essential for development)
make run                # uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
make run-prod          # Production server without reload

# Code quality (run before commits)
make format            # black + isort (Python formatting)
make lint              # flake8 + mypy (linting + type checking)
make test              # pytest tests/ -v
make test-cov          # pytest --cov=app tests/ --cov-report=html

# Database operations
make migrate           # alembic upgrade head
make migrate-auto      # alembic revision --autogenerate -m "Auto migration"

# Development workflow
make clean             # Remove cache and temp files
```

### CLI Usage
```bash
# Direct execution (recommended)
python cli/main.py --help

# Executable script (automatic Poetry detection)
./youtube-cli --help

# Module execution  
python -m cli.main --help

# Date-based auto-mapping (PRIMARY WORKFLOW)
python cli/main.py video auto-mapping scripts/ videos/
python cli/main.py date-upload scripts/ videos/ --date $(date +%Y%m%d)
python cli/main.py date-upload scripts/ videos/ --dry-run

# Quick commands (executable scripts in root)
./quick-script script.txt           # Quick script upload
./quick-upload                      # Interactive quick video upload

# Common workflows
python cli/main.py health           # System health check
python cli/main.py ls --status video_ready  # List scripts by status
python cli/main.py examples         # Show usage examples
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

### 1. Date-Based Auto-Mapping System
**Location**: `cli/utils/date_mapping.py`

```python
# File naming convention: YYYYMMDD_NN_story.txt/mp4
class DateBasedMapper:
    DATE_PATTERN = re.compile(r'^(\d{8})_(\d{1,2})_(.+)\.(txt|md|mp4)$')
    
    def match_script_video_files(self, script_dir: str, video_dir: str, 
                                target_date: str = None) -> List[Tuple[DateFile, DateFile]]
    def parse_filename(self, filename: str) -> Optional[DateFile]
    def generate_next_filename(self, directory: str, date: str, name: str = "story") -> str
```

- **Automatic file matching**: Pairs script and video files based on date, sequence, and name
- **Date validation**: Ensures YYYYMMDD format compliance
- **Sequence management**: Handles multiple files per day (01, 02, 03...)
- **Complete workflow automation**: Script upload → Video mapping → YouTube upload
- **Rich console output**: Uses Rich library for beautiful terminal interface when available

### 2. Script Parsing (ScriptParser)
**Location**: `app/services/script_parser.py`

```python
# Script file format (supports both 썸네일 제작 and 썸네일 정보)
=== 제목 ===
[Video Title]

=== 메타데이터 ===
설명: [Description]
태그: [tag1, tag2, ...]

=== 썸네일 정보 ===
텍스트: [Thumbnail text]
ImageFX 프롬프트: [AI generation prompt]

=== 대본 ===
[Script content]
```

- **Flexible section parsing**: Supports both legacy and new format
- **Regex-based extraction**: Uses `_extract_section()` with multiple end patterns
- **Metadata validation**: YouTube field limits (title 100chars, description 5000bytes)
- **Error handling**: Custom ScriptParsingError with detailed messages
- **Required field validation**: Ensures title and content exist

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
GET    /api/scripts/                 # List scripts with pagination
GET    /api/scripts/{id}             # Get single script
PUT    /api/scripts/{id}             # Update script
DELETE /api/scripts/{id}             # Delete script
GET    /api/scripts/stats/summary    # Statistics summary
GET    /api/scripts/ready-for-video  # Scripts ready for video upload
GET    /api/scripts/ready-for-youtube # Scripts ready for YouTube upload
```

### Upload API
```
POST   /api/upload/video/{script_id} # Video file upload (supports large files)
POST   /api/upload/youtube/{script_id} # YouTube upload with privacy/category
GET    /api/upload/status/{script_id}   # Upload status
GET    /api/upload/progress/{script_id} # Upload progress (real-time)
DELETE /api/upload/video/{script_id}    # Delete video file
GET    /api/upload/health            # Upload service health
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
GET    /health                      # Health check with DB connection test
GET    /docs                        # Swagger API documentation
GET    /redoc                       # ReDoc API documentation
```

### CLI Commands (Date-Based Features)
```bash
# Date-based auto-mapping
video auto-mapping scripts/ videos/                    # Auto-match today's files
video auto-mapping scripts/ videos/ --date 20250819    # Auto-match specific date
video auto-mapping scripts/ videos/ --dry-run          # Simulation mode

# Complete workflow automation
date-upload scripts/ videos/                           # Full automation (today)
date-upload scripts/ videos/ --date 20250819          # Full automation (specific date)
date-upload scripts/ videos/ --privacy unlisted       # With privacy setting
date-upload scripts/ videos/ --dry-run                # Simulation mode
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

### Running Tests
```bash
# From backend/ directory
make test              # Basic test run
make test-cov          # With coverage report
poetry run pytest tests/unit/test_script_parser.py -v  # Single test file
poetry run pytest tests/ -k "test_parse" -v           # Specific test pattern
```

### Testing Patterns
- **Script Parser Tests**: Test all script formats including edge cases
- **YouTube Integration**: Mock YouTube API responses for reliable testing  
- **FastAPI Testing**: Use TestClient with dependency overrides
- **SQLAlchemy Testing**: Use in-memory SQLite for fast database tests

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
- **Python 3.13**: Latest Python version

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
2. **Use CLI interface** (`./youtube-cli` or `python cli/main.py`)
3. **Create data model** (backend/models/)
4. **Implement repository** (backend/repositories/)
5. **Add service logic** (backend/services/)
6. **Create API endpoints** (backend/routers/)
7. **Write tests** (backend/tests/)
8. **Check API documentation** (/docs)

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

### Common Debugging Workflows

#### Backend API Issues
```bash
# 1. Check if backend is running
curl http://localhost:8000/health

# 2. Check logs
tail -f backend/logs/app-$(date +%Y-%m-%d).log

# 3. Test specific endpoint
curl -X POST http://localhost:8000/api/scripts/upload \
  -F "file=@test_script.txt"

# 4. API documentation
open http://localhost:8000/docs
```

#### CLI Date-Mapping Debug
```bash
# Test file parsing without upload
python cli/main.py video auto-mapping scripts/ videos/ --dry-run

# Check file naming patterns
python -c "from cli.utils.date_mapping import date_mapper; print(date_mapper.parse_filename('20250819_01_story.txt'))"

# Validate date format
python cli/main.py date-upload scripts/ videos/ --date 20250819 --dry-run
```

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

### Adding CLI Command
1. **Create command file**: `cli/commands/new_command.py`
2. **Follow Click patterns**: Use decorators for options/arguments
3. **Use Rich output**: For beautiful terminal formatting
4. **Add to main CLI**: Register in `cli/main.py`

### Extending API
1. **Backend**: Add router → service → repository
2. **CLI**: Add command using new API endpoint
3. **Test**: Add integration tests

## 🐛 Common Troubleshooting

### Backend Issues
- **Database Lock**: SQLite concurrent access → consider PostgreSQL
- **File Upload Limit**: Check `MAX_VIDEO_SIZE_MB` setting
- **YouTube API Quota**: Daily 10,000 units limit (업로드당 1,600 units)
- **Token Expiry**: OAuth token refresh required
- **미인증 프로젝트**: public/unlisted 업로드 불가 (private만 가능)
- **필드 제한**: 제목 100자, 설명 5000바이트, 태그 500자

### CLI Issues
- **Permissions**: Make sure scripts are executable (`chmod +x`)
- **Python Path**: Ensure virtual environment is activated
- **API Connectivity**: Check backend server status
- **Date File Naming**: Files must follow YYYYMMDD_NN_story.txt/mp4 pattern
- **Auto-Mapping No Matches**: Check file naming convention and date format
- **Import Errors**: Use absolute paths and verify sys.path configuration

### Debug Log Access
```bash
# Backend logs
tail -f logs/app-$(date +%Y-%m-%d).log
tail -f logs/error-$(date +%Y-%m-%d).log
```

## 🔄 WebSocket Real-time Features (Completed)

### 구현된 실시간 기능
- ✅ **WebSocket 연결 관리**: 자동 재연결, 하트비트, 연결 풀링
- ✅ **실시간 알림 시스템**: 업로드 상태 변화, 성공/실패 알림
- ✅ **업로드 진행률 추적**: 실시간 진행률 브로드캐스트
- ✅ **스크립트 구독 시스템**: 특정 스크립트 업데이트 구독
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

## 🔍 Key Architectural Insights

### Design Philosophy
- **Korean Senior-Focused**: CLI interface prioritizes simplicity and intuitive workflows
- **Two-Interface Strategy**: CLI (primary), API (automation)
- **Complete Automation**: Script → Video → YouTube with minimal manual intervention
- **Real-time Feedback**: WebSocket integration provides immediate status updates

### Critical Implementation Details

#### 1. Script Status Workflow
```
script_ready → video_ready → uploaded → error
```
- Status transitions are enforced at the service layer
- Each status has specific API endpoints for next valid actions
- Failed uploads transition to 'error' status with detailed error messages

#### 2. File Naming Convention (CLI)
```
YYYYMMDD_NN_story.txt    # Script files
YYYYMMDD_NN_story.mp4    # Video files
```
- Date validation prevents invalid file processing
- Sequence numbers (NN) allow multiple files per day
- Name matching ensures script-video pairs are correctly associated

#### 3. YouTube API Integration Constraints
- **Daily quota**: 10,000 units (upload = 1,600 units)
- **Unverified projects**: Limited to private uploads only
- **Field limits**: Title 100 chars, description 5000 bytes, tags 500 chars
- **Error handling**: Comprehensive retry logic with exponential backoff

#### 4. Database Architecture
- **Single SQLite database**: Simplifies deployment and backup
- **Script-centric design**: All operations revolve around Script entity
- **Status-driven workflows**: Database constraints prevent invalid state transitions
- **Audit timestamps**: created_at/updated_at for all entities

### Integration Points
- **FastAPI ↔ CLI**: HTTP API with Rich terminal formatting
- **WebSocket ↔ Backend**: Real-time progress updates and notifications
- **YouTube API ↔ Services**: OAuth flow with token persistence

**Important Note**: This system is designed specifically for **Korean seniors** using **simplified automation** processes. The **CLI interface** is the primary production interface providing **date-based auto-mapping** for batch processing. Keep interfaces **simple** and **intuitive** while maintaining **robust** backend functionality including **real-time progress tracking**, **instant notifications**, and **intelligent file matching**.

## 📋 Key Development Practices

### Adding New CLI Commands
1. Create command module in `cli/commands/`
2. Use Click decorators for consistent CLI interface
3. Integrate with Rich for beautiful terminal output
4. Add error handling with structured logging
5. Register in `cli/main.py` main group

### Backend Service Development
1. Follow Clean Architecture: Repository → Service → Router pattern
2. Use dependency injection with FastAPI Depends()
3. Implement custom exceptions in `app/core/exceptions.py`
4. Add structured logging with component-specific loggers
5. Write tests for both unit and integration levels

### Database Changes
1. Always use Alembic for migrations: `make migrate-auto`
2. Review generated migrations before applying
3. Test migrations with sample data
4. Update repository and service layers accordingly

### WebSocket Integration
1. Use `WebSocketManager` for connection handling
2. Implement proper error handling and reconnection
3. Use structured message protocol for client-server communication
4. Test with multiple concurrent connections