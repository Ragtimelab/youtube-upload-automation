"""
커스텀 예외 클래스들
"""


class BaseAppException(Exception):
    """애플리케이션 기본 예외"""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ScriptNotFoundError(BaseAppException):
    """대본을 찾을 수 없을 때 발생하는 예외"""

    def __init__(self, script_id: int):
        super().__init__(f"대본을 찾을 수 없습니다. ID: {script_id}", 404)


class ScriptParsingError(BaseAppException):
    """대본 파싱 실패시 발생하는 예외"""

    def __init__(self, message: str):
        super().__init__(f"대본 파싱 실패: {message}", 400)


class FileValidationError(BaseAppException):
    """파일 검증 실패시 발생하는 예외"""

    def __init__(self, message: str):
        super().__init__(f"파일 검증 실패: {message}", 400)


class FileUploadError(BaseAppException):
    """파일 업로드 실패시 발생하는 예외"""

    def __init__(self, message: str):
        super().__init__(f"파일 업로드 실패: {message}", 500)


class InvalidScriptStatusError(BaseAppException):
    """잘못된 대본 상태로 인한 예외"""

    def __init__(self, current_status: str, required_status: str):
        message = f"현재 상태({current_status})에서는 해당 작업을 수행할 수 없습니다. 필요 상태: {required_status}"
        super().__init__(message, 400)


class YouTubeAuthenticationError(BaseAppException):
    """YouTube API 인증 실패시 발생하는 예외"""

    def __init__(self, message: str = "YouTube API 인증에 실패했습니다"):
        super().__init__(message, 401)


class YouTubeUploadError(BaseAppException):
    """YouTube 업로드 실패시 발생하는 예외"""

    def __init__(self, message: str):
        super().__init__(f"YouTube 업로드 실패: {message}", 500)


class VideoFileNotFoundError(BaseAppException):
    """비디오 파일을 찾을 수 없을 때 발생하는 예외"""

    def __init__(self, file_path: str):
        super().__init__(f"비디오 파일을 찾을 수 없습니다: {file_path}", 404)


class DatabaseError(BaseAppException):
    """데이터베이스 작업 실패시 발생하는 예외"""

    def __init__(self, message: str):
        super().__init__(f"데이터베이스 오류: {message}", 500)


class ValidationError(BaseAppException):
    """데이터 검증 실패시 발생하는 예외"""

    def __init__(self, message: str):
        super().__init__(f"검증 실패: {message}", 400)


class UnverifiedProjectRestrictionError(BaseAppException):
    """미인증 프로젝트 업로드 제한 오류"""

    def __init__(
        self,
        message: str = "미인증 API 프로젝트는 비공개(private) 모드로만 업로드할 수 있습니다.",
    ):
        super().__init__(message, 403)


class UploadProgressError(BaseAppException):
    """업로드 진행 중 오류"""

    def __init__(self, message: str, progress_percentage: int = 0):
        self.progress_percentage = progress_percentage
        super().__init__(
            f"업로드 진행 중 오류 ({progress_percentage}%): {message}", 500
        )


class YouTubeQuotaExceededError(BaseAppException):
    """YouTube API 할당량 초과 오류"""

    def __init__(
        self,
        message: str = "YouTube API 할당량이 초과되었습니다. 내일 다시 시도해주세요.",
    ):
        super().__init__(message, 429)
