"""
핵심 상수 정의

하드코딩된 값들을 중앙화하여 유지보수성과 일관성을 개선합니다.
"""


class ChannelConstants:
    """시니어 채널 기본 설정"""

    # 채널 기본 설명글 (영상 설명에 자동 추가)
    DESCRIPTION_FOOTER = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎭 마음을 담아 전하는 우리 세대 이야기

시청자분이 용기 내어 보내주신 소중한 경험담을 바탕으로
정성껏 각색하여 준비한 이야기입니다.

그 시절을 함께 걸어온 우리이기에 알 수 있는 아픔과 기쁨,
말로 다 표현할 수 없는 그 미묘한 감정들까지
빠뜨리지 않으려 애쓰며 만들었습니다.

📢 창작물 보호 안내
이 영상의 대본과 모든 내용은 저작권 보호를 받습니다.
무단 복제나 상업적 이용은 정중히 사양합니다.

🤝 진심으로 나누고 싶은 이야기들

혹시 보시면서 "아, 나도 그랬는데..." 하고 고개를 끄덕이셨나요?
아니면 "저 마음 정말 이해해..." 하며 마음이 먹먹해지셨나요?

그런 순간들이 바로 제가 이 영상을 만드는 이유입니다.
우리는 혼자가 아니에요. 비슷한 길을 걸어온 분들이 이렇게 많이 계시니까요.

💝 **구독**해 주시면 → 계속해서 이런 진솔한 이야기들을 들려드릴 수 있어요
👍 **좋아요** 하나가 → 다른 분들께도 이 따뜻한 공감을 전해드릴 수 있답니다
💬 **댓글**이 정말 힘이 돼요 → "맞아요", "공감돼요" 이런 짧은 말 한마디도 큰 위로가 됩니다
🔔 **알림**을 켜두시면 → 새로운 이야기가 올라올 때마다 함께하실 수 있어요

만약 이 이야기가 마음에 닿으셨다면,
아마 이런 분이실 거예요:

• 인생의 쓴맛과 단맛을 모두 아시는 분
• 진짜 이야기, 진짜 감정을 소중히 여기시는 분
• 때로는 웃고, 때로는 눈시울이 붉어져도 괜찮다고 생각하시는 분
• 나이를 먹는다는 게 외롭지 않다는 걸 함께 느끼고 싶으신 분

앞으로도 마음을 다해 정성스럽게 준비하겠습니다.
함께해 주셔서 고맙습니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"""  # noqa: E501

    # 채널 기본 태그
    DEFAULT_TAGS = [
        "우리세대",
        "진솔한이야기",
        "인생이야기",
        "마음공감",
        "정성스런이야기",
        "어르신",
        "세대공감",
        "진심담백",
        "인생경험",
        "함께하는이야기",
        "따뜻한소통",
        "한국시니어",
        "마음나누기",
        "진정성",
        "삶의이야기",
    ]

    @classmethod
    def combine_description(cls, original_description: str) -> str:
        """원본 설명과 채널 기본 설명 결합

        Args:
            original_description: 대본에서 추출한 원본 설명

        Returns:
            결합된 설명 (YouTube 5000바이트 제한 고려)
        """
        # 원본 설명이 비어있으면 채널 푸터만 반환
        if not original_description.strip():
            return cls.DESCRIPTION_FOOTER.strip()

        # 원본 설명 + 채널 푸터 결합
        combined_description = (
            f"{original_description.strip()}\n{cls.DESCRIPTION_FOOTER}"
        )

        # YouTube API 5000바이트 제한 확인
        description_bytes = combined_description.encode("utf-8")
        if len(description_bytes) <= YouTubeConstants.DESCRIPTION_MAX_BYTES:
            return combined_description

        # 제한 초과 시 원본 설명 우선 보존, 푸터 조정
        original_bytes = len(original_description.encode("utf-8"))
        available_bytes = (
            YouTubeConstants.DESCRIPTION_MAX_BYTES - original_bytes - 10
        )  # 여유분 10바이트

        if available_bytes > 100:  # 푸터를 위한 최소 공간 확보
            truncated_footer = cls.DESCRIPTION_FOOTER.encode("utf-8")[
                :available_bytes
            ].decode("utf-8", errors="ignore")
            return f"{original_description.strip()}\n{truncated_footer}"
        else:
            # 공간이 부족하면 원본 설명만 반환
            return original_description.strip()

    @classmethod
    def combine_tags(cls, original_tags: str) -> str:
        """원본 태그와 채널 기본 태그 결합 (중복 제거)

        Args:
            original_tags: 대본에서 추출한 원본 태그

        Returns:
            결합된 태그 (YouTube 500자 제한 고려, 중복 제거됨)
        """
        # 원본 태그를 리스트로 변환
        if original_tags.strip():
            original_tag_list = [
                tag.strip() for tag in original_tags.split(",") if tag.strip()
            ]
        else:
            original_tag_list = []

        # 채널 기본 태그 리스트
        channel_tag_list = cls.DEFAULT_TAGS.copy()

        # 중복 제거하면서 결합 (원본 태그 우선)
        combined_tag_list = original_tag_list.copy()

        for channel_tag in channel_tag_list:
            # 대소문자 구분 없이 중복 체크
            if not any(tag.lower() == channel_tag.lower() for tag in combined_tag_list):
                combined_tag_list.append(channel_tag)

        # 문자열로 결합
        combined_tags = ", ".join(combined_tag_list)

        # YouTube 500자 제한 적용
        if len(combined_tags) <= YouTubeConstants.TAGS_MAX_LENGTH:
            return combined_tags
        else:
            # 제한 초과 시 태그를 하나씩 제거하면서 조정 (채널 태그부터 제거)
            while len(combined_tags) > YouTubeConstants.TAGS_MAX_LENGTH and len(
                combined_tag_list
            ) > len(original_tag_list):
                combined_tag_list.pop()  # 마지막 태그(채널 태그) 제거
                combined_tags = ", ".join(combined_tag_list)

            # 여전히 초과하면 전체를 자름 (원본 태그 보존 우선)
            if len(combined_tags) > YouTubeConstants.TAGS_MAX_LENGTH:
                combined_tags = combined_tags[: YouTubeConstants.TAGS_MAX_LENGTH]

            return combined_tags


class YouTubeConstants:
    """YouTube API 관련 상수"""

    # 콘텐츠 제한 (YouTube API 공식 제한)
    TITLE_MAX_LENGTH = 100
    DESCRIPTION_MAX_BYTES = 5000
    TAGS_MAX_LENGTH = 500

    # 공개 설정 옵션
    PRIVACY_STATUSES = ["private", "unlisted", "public"]
    PRIVACY_PRIVATE = "private"
    PRIVACY_UNLISTED = "unlisted"
    PRIVACY_PUBLIC = "public"

    # 기본 설정값
    DEFAULT_CATEGORY_ID = 24  # Entertainment
    DEFAULT_PRIVACY_STATUS = "private"
    DEFAULT_LANGUAGE = "ko"
    DEFAULT_AUDIO_LANGUAGE = "ko"

    # API 할당량 정보
    DAILY_QUOTA_LIMIT = 10000  # units
    VIDEO_UPLOAD_COST = 1600  # units per upload
    VIDEO_LIST_COST = 1  # units per request
    CHANNEL_INFO_COST = 1  # units per request


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
    MAX_SCRIPT_SIZE_MB = 10  # 10MB

    # 허용 파일 확장자
    ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".avi", ".mov", ".mkv", ".flv"]
    ALLOWED_SCRIPT_EXTENSIONS = [".md"]  # 마크다운 전용

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
    UPLOAD_TIMEOUT = 3600  # 1 hour for large uploads

    # HTTP 상태 코드
    RETRIABLE_STATUS_CODES = [500, 502, 503, 504]

    # 기본 URL 설정
    DEFAULT_API_BASE_URL = "http://localhost:8000"
    DEFAULT_API_HOST = "0.0.0.0"
    DEFAULT_API_PORT = 8000


class PathConstants:
    """경로 관련 상수"""

    # 기본 디렉토리
    DEFAULT_UPLOAD_DIR = "uploads/videos"
    DEFAULT_LOGS_DIR = "logs"
    DEFAULT_SECRETS_DIR = ".secrets"

    # 로그 파일 패턴
    APP_LOG_PATTERN = "app-{date}.log"
    ERROR_LOG_PATTERN = "error-{date}.log"

    # 인증 파일명
    YOUTUBE_CREDENTIALS_FILENAME = "youtube-oauth2.json"
    YOUTUBE_TOKEN_FILENAME = "youtube-token.pickle"

    # 상대 경로 템플릿
    CREDENTIALS_RELATIVE_PATH = f"{DEFAULT_SECRETS_DIR}/{YOUTUBE_CREDENTIALS_FILENAME}"
    TOKEN_RELATIVE_PATH = f"{DEFAULT_SECRETS_DIR}/{YOUTUBE_TOKEN_FILENAME}"


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
    DATE_FORMAT_YYYYMMDD = r"^\d{8}$"
    DATE_PATTERN_REGEX = r"^(\d{8})_(\d{1,2})_(.+)\.(md|mp4)$"

    # 진행률 관련
    PROGRESS_MIN = 0
    PROGRESS_MAX = 100
    PROGRESS_COMPLETE = 100

    # 새로고침 간격 (초)
    DEFAULT_REFRESH_INTERVAL = 3
    FAST_REFRESH_INTERVAL = 1
    SLOW_REFRESH_INTERVAL = 5


class LoggingConstants:
    """로깅 설정 관련 상수"""

    # 로그 파일 크기 및 백업
    LOG_FILE_MAX_BYTES = 10485760  # 10MB
    LOG_BACKUP_COUNT = 5

    # 로그 레벨
    DEFAULT_LOG_LEVEL = "INFO"
    DEBUG_LOG_LEVEL = "DEBUG"
    ERROR_LOG_LEVEL = "ERROR"


class PaginationConstants:
    """페이지네이션 관련 상수"""

    # 기본 페이지 크기
    DEFAULT_PAGE_LIMIT = 100
    SMALL_PAGE_LIMIT = 20
    LARGE_PAGE_LIMIT = 50
    MAX_PAGE_LIMIT = 1000

    # CLI 전용 기본값
    CLI_DEFAULT_LIST_LIMIT = 20
    CLI_SMALL_LIST_LIMIT = 10
    CLI_PIPELINE_LIMIT = 1000


class TimeConstants:
    """시간 관련 상수"""

    # 모니터링 시간 (초)
    DEFAULT_MONITOR_DURATION = 60
    EXTENDED_MONITOR_DURATION = 300

    # 새로고침 간격 (초)
    REALTIME_REFRESH_INTERVAL = 2.0
    STATUS_REFRESH_INTERVAL = 5.0
    FAST_REFRESH_INTERVAL = 1.0

    # 타임아웃 설정 (초)
    THREAD_JOIN_TIMEOUT = 3.0
    PROGRESS_MONITOR_TIMEOUT = 1.0


# 하위 호환성을 위한 별칭 (필요시)
YOUTUBE_TITLE_MAX_LENGTH = YouTubeConstants.TITLE_MAX_LENGTH
YOUTUBE_DESCRIPTION_MAX_BYTES = YouTubeConstants.DESCRIPTION_MAX_BYTES
YOUTUBE_TAGS_MAX_LENGTH = YouTubeConstants.TAGS_MAX_LENGTH
YOUTUBE_PRIVACY_STATUSES = YouTubeConstants.PRIVACY_STATUSES
