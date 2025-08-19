"""
핵심 상수 정의

하드코딩된 값들을 중앙화하여 유지보수성과 일관성을 개선합니다.
"""

from typing import List


class YouTubeConstants:
    """YouTube API 관련 상수"""
    
    # 콘텐츠 제한 (YouTube API 공식 제한)
    TITLE_MAX_LENGTH = 100
    DESCRIPTION_MAX_BYTES = 5000
    TAGS_MAX_LENGTH = 500
    
    # 공개 설정 옵션
    PRIVACY_STATUSES = ['private', 'unlisted', 'public']
    PRIVACY_PRIVATE = 'private'
    PRIVACY_UNLISTED = 'unlisted'
    PRIVACY_PUBLIC = 'public'
    
    # 기본 설정값
    DEFAULT_CATEGORY_ID = 24  # Entertainment
    DEFAULT_PRIVACY_STATUS = 'private'
    DEFAULT_LANGUAGE = 'ko'
    DEFAULT_AUDIO_LANGUAGE = 'ko'
    
    # API 할당량 정보
    DAILY_QUOTA_LIMIT = 10000  # units
    VIDEO_UPLOAD_COST = 1600   # units per upload
    VIDEO_LIST_COST = 1        # units per request
    CHANNEL_INFO_COST = 1      # units per request


class FileConstants:
    """파일 처리 관련 상수"""
    
    # 파일 크기 (바이트 단위)
    BYTES_PER_KB = 1024
    BYTES_PER_MB = 1024 * 1024
    BYTES_PER_GB = 1024 * 1024 * 1024
    
    # 청크 크기
    CHUNK_SIZE_1MB = 1 * BYTES_PER_MB
    CHUNK_SIZE_10MB = 10 * BYTES_PER_MB
    DEFAULT_UPLOAD_CHUNK_SIZE = CHUNK_SIZE_10MB
    
    # 파일 크기 제한
    MAX_VIDEO_SIZE_MB = 8192  # 8GB
    MAX_SCRIPT_SIZE_MB = 10   # 10MB
    
    # 허용 파일 확장자
    ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.flv']
    ALLOWED_SCRIPT_EXTENSIONS = ['.txt', '.md']
    
    # 권장 설정 (YouTube FHD 최적화)
    RECOMMENDED_VIDEO_BITRATE_MBPS = 8
    RECOMMENDED_AUDIO_BITRATE_KBPS = 128
    MAX_VIDEO_DURATION_HOURS = 12


class NetworkConstants:
    """네트워크 및 API 관련 상수"""
    
    # 재시도 설정
    DEFAULT_RETRY_ATTEMPTS = 3
    MAX_RETRY_ATTEMPTS = 5
    DEFAULT_RETRY_DELAY_SECONDS = 2
    MAX_RETRY_DELAY_SECONDS = 5
    
    # 타임아웃 설정
    DEFAULT_API_TIMEOUT = 30  # seconds
    UPLOAD_TIMEOUT = 3600     # 1 hour for large uploads
    
    # HTTP 상태 코드
    RETRIABLE_STATUS_CODES = [500, 502, 503, 504]
    
    # 기본 URL 설정
    DEFAULT_API_BASE_URL = 'http://localhost:8000'
    DEFAULT_API_HOST = '0.0.0.0'
    DEFAULT_API_PORT = 8000


class PathConstants:
    """경로 관련 상수"""
    
    # 기본 디렉토리
    DEFAULT_UPLOAD_DIR = 'uploads/videos'
    DEFAULT_LOGS_DIR = 'logs'
    DEFAULT_SECRETS_DIR = '.secrets'
    
    # 로그 파일 패턴
    APP_LOG_PATTERN = 'app-{date}.log'
    ERROR_LOG_PATTERN = 'error-{date}.log'
    
    # 인증 파일명
    YOUTUBE_CREDENTIALS_FILENAME = 'youtube-oauth2.json'
    YOUTUBE_TOKEN_FILENAME = 'youtube-token.pickle'
    
    # 상대 경로 템플릿
    CREDENTIALS_RELATIVE_PATH = f'{DEFAULT_SECRETS_DIR}/{YOUTUBE_CREDENTIALS_FILENAME}'
    TOKEN_RELATIVE_PATH = f'{DEFAULT_SECRETS_DIR}/{YOUTUBE_TOKEN_FILENAME}'


class MessageConstants:
    """사용자 메시지 관련 상수"""
    
    # 성공 메시지
    UPLOAD_SUCCESS = "✅ 업로드가 성공적으로 완료되었습니다!"
    SYSTEM_HEALTHY = "✅ 시스템 정상!"
    
    # 오류 메시지
    API_CONNECTION_ERROR = "❌ API 연결 실패"
    FILE_NOT_FOUND_ERROR = "❌ 파일을 찾을 수 없습니다"
    INVALID_FILE_FORMAT = "❌ 지원하지 않는 파일 형식입니다"
    
    # 정보 메시지
    CHECKING_SYSTEM_STATUS = "🔍 시스템 상태 확인 중..."
    UPLOAD_IN_PROGRESS = "📤 업로드 진행 중..."
    
    # 도움말 메시지
    CHECK_CREDENTIALS_HELP = "💡 credentials.json 파일을 확인하세요."
    CHECK_SERVER_HELP = f"💡 백엔드 서버가 실행 중인지 확인하세요 ({NetworkConstants.DEFAULT_API_BASE_URL})"


class ValidationConstants:
    """검증 관련 상수"""
    
    # 날짜 형식
    DATE_FORMAT_YYYYMMDD = r'^\d{8}$'
    DATE_PATTERN_REGEX = r'^(\d{8})_(\d{1,2})_(.+)\.(txt|md|mp4)$'
    
    # 진행률 관련
    PROGRESS_MIN = 0
    PROGRESS_MAX = 100
    PROGRESS_COMPLETE = 100
    
    # 새로고침 간격 (초)
    DEFAULT_REFRESH_INTERVAL = 3
    FAST_REFRESH_INTERVAL = 1
    SLOW_REFRESH_INTERVAL = 5


# 하위 호환성을 위한 별칭 (필요시)
YOUTUBE_TITLE_MAX_LENGTH = YouTubeConstants.TITLE_MAX_LENGTH
YOUTUBE_DESCRIPTION_MAX_BYTES = YouTubeConstants.DESCRIPTION_MAX_BYTES
YOUTUBE_TAGS_MAX_LENGTH = YouTubeConstants.TAGS_MAX_LENGTH
YOUTUBE_PRIVACY_STATUSES = YouTubeConstants.PRIVACY_STATUSES