"""
Gradio App Configuration
"""

# UI 스타일 상수
class UIStyles:
    """UI 스타일 상수"""
    
    # 색상 팔레트
    PRIMARY_BLUE = "#3b82f6"
    SUCCESS_GREEN = "#22c55e"
    WARNING_YELLOW = "#f59e0b"
    ERROR_RED = "#ef4444"
    GRAY_LIGHT = "#6b7280"
    GRAY_DARK = "#1f2937"
    
    # 배경색
    BG_PRIMARY = "#f8fafc"
    BG_SUCCESS = "#f0fdf4"
    BG_WARNING = "#fef3c7"
    BG_ERROR = "#fee2e2"
    BG_INFO = "#f0f9ff"
    
    # 기본 스타일 템플릿
    CARD_STYLE = "padding: 20px; border-radius: 12px; margin: 10px 0;"
    GRID_STYLE = "display: grid; gap: 12px;"
    BUTTON_STYLE = "padding: 8px 16px; border-radius: 6px;"

class Messages:
    """사용자 메시지 상수"""
    
    # 오류 메시지
    ERROR_NO_FILE = "❌ 파일을 선택해주세요."
    ERROR_NO_SCRIPT = "❌ 유효한 스크립트를 선택해주세요."
    ERROR_CONNECTION = "❌ 연결 실패: 백엔드 서버가 실행 중인지 확인해주세요."
    
    # 성공 메시지
    SUCCESS_UPLOAD = "✅ 업로드 성공!"
    SUCCESS_DELETE = "✅ 삭제 완료!"
    SUCCESS_UPDATE = "✅ 수정 완료!"
    
    # 정보 메시지
    INFO_NO_DATA = "📭 데이터가 없습니다."
    INFO_SELECT_SCRIPT = "📄 스크립트를 선택하고 버튼을 클릭해주세요."

class HTMLTemplates:
    """HTML 템플릿 경로"""
    
    TEMPLATE_DIR = "gradio_app/templates"
    
    # 템플릿 파일명
    SCRIPT_DETAIL = "script_detail.html"
    SCRIPT_STATS = "script_stats.html"
    VIDEO_STATUS = "video_status.html"
    PIPELINE_DASHBOARD = "pipeline_dashboard.html"
    REAL_TIME_MONITOR = "real_time_monitor.html"
    ERROR_MESSAGE = "error_message.html"
    SUCCESS_MESSAGE = "success_message.html"

class APIConfig:
    """API 관련 설정"""
    
    # 재시도 설정
    MAX_RETRIES = 3
    RETRY_DELAY = 1.0
    
    # 타임아웃 설정
    REQUEST_TIMEOUT = 30
    
    # 배치 처리 제한
    MAX_BATCH_SIZE = 5