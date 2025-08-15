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
│   └── youtube/          # YouTube API service managers
├── routers/              # FastAPI routers (API endpoints)
│   ├── scripts.py        # Script management API
│   └── upload.py         # Upload API
└── middleware/           # Custom middleware
    └── error_handler.py  # Global error handling
```

### 🎨 Architecture Patterns
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Dependency Injection**: FastAPI Depends for testable code
- **Custom Exceptions**: Structured error handling
- **Structured Logging**: Component-based logging with daily rotation

## 🛠️ Essential Development Commands

### Poetry Environment Management
```bash
# Install dependencies
poetry install

# Install with development dependencies
poetry install --with dev,test

# Activate virtual environment
poetry shell
```

### Development Commands (Makefile based)
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
DELETE /api/upload/video/{script_id}    # Delete video file
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

### Core Dependencies
- **FastAPI 0.104.1+**: Web framework
- **SQLAlchemy 2.0+**: ORM
- **Alembic 1.12+**: Database migrations
- **Pydantic 2.5+**: Data validation
- **Uvicorn**: ASGI server

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
1. **Create data model** (models/)
2. **Implement repository** (repositories/)
3. **Add service logic** (services/)
4. **Create API endpoints** (routers/)
5. **Write tests** (tests/)
6. **Check API documentation** (/docs)

### Code Quality Process
```bash
make format                        # Format code
make lint                         # Check code quality
make test-cov                     # Test with coverage
```

### Database Management
```bash
# Model changes workflow
make migrate-auto                 # Generate migration
make migrate                      # Apply migration
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

### Frequent Issues
- **Database Lock**: SQLite concurrent access → consider PostgreSQL
- **File Upload Limit**: Check `MAX_VIDEO_SIZE_MB` setting
- **YouTube API Quota**: Daily 10,000 units limit (업로드당 1,600 units)
- **Token Expiry**: OAuth token refresh required
- **미인증 프로젝트**: public/unlisted 업로드 불가 (private만 가능)
- **필드 제한**: 제목 100자, 설명 5000바이트, 태그 500자

### Debug Log Access
```bash
# Today's logs
tail -f logs/app-$(date +%Y-%m-%d).log

# Error logs only
tail -f logs/error-$(date +%Y-%m-%d).log
```

---

**Important Note**: This system is designed specifically for **Korean seniors** using **simplified automation** processes. Keep the user interface **simple** and **intuitive** while maintaining **robust** backend functionality.