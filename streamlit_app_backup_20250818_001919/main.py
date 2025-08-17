"""
🎬 YouTube 업로드 자동화 - Streamlit 웹 인터페이스

완전한 웹 기반 관리 시스템으로 CLI와 동등한 모든 기능을 제공합니다.
"""

import streamlit as st
from pathlib import Path
import sys

# Streamlit 앱 루트 디렉토리를 Python path에 추가
app_root = Path(__file__).parent
if str(app_root) not in sys.path:
    sys.path.insert(0, str(app_root))

# 페이지 설정
st.set_page_config(
    page_title="YouTube 자동화 시스템",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        'About': "YouTube 업로드 자동화 시스템 v2.0"
    }
)

# 적당히 컴팩트한 프로페셔널 UI CSS
st.markdown("""
<style>
    /* 전역 폰트 크기 적당히 조정 */
    html, body, [class*="css"] {
        font-size: 14px !important;
        color: #1f2937 !important;
    }
    
    /* 메인 컨테이너 패딩 적당히 조정 */
    .main .block-container {
        padding-top: 1rem !important;
        padding-bottom: 1rem !important;
        padding-left: 1rem !important;
        padding-right: 1rem !important;
        max-width: 100% !important;
    }
    
    /* 상단 배너 적당한 크기 */
    .main-header {
        background: linear-gradient(90deg, #1f2937 0%, #374151 100%);
        padding: 0.5rem 1rem;
        border-radius: 4px;
        color: white;
        text-align: center;
        margin-bottom: 1rem;
        height: 50px !important;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .main-header h1 {
        font-size: 18px !important;
        margin: 0 !important;
        font-weight: 600;
        line-height: 1.2 !important;
    }
    
    /* 헤더 크기 적당히 조정 */
    h1, .css-10trblm {
        font-size: 20px !important;
        margin: 0.5rem 0 !important;
        line-height: 1.2 !important;
        color: #1f2937 !important;
    }
    
    h2, .css-1629p8f {
        font-size: 18px !important;
        margin: 0.4rem 0 !important;
        line-height: 1.2 !important;
        color: #1f2937 !important;
    }
    
    h3, .css-2trqyj {
        font-size: 16px !important;
        margin: 0.3rem 0 !important;
        line-height: 1.1 !important;
        color: #1f2937 !important;
    }
    
    /* 사이드바 적당한 크기 */
    .css-1d391kg, .css-1lcbmhc {
        padding: 0.75rem !important;
        font-size: 13px !important;
    }
    
    .sidebar .sidebar-content {
        background: #f8fafc;
        padding: 0.5rem !important;
    }
    
    /* 사이드바 텍스트 적당한 크기 */
    section[data-testid="stSidebar"] * {
        font-size: 13px !important;
        line-height: 1.3 !important;
        color: #374151 !important;
    }
    
    section[data-testid="stSidebar"] h3 {
        font-size: 15px !important;
        margin: 0.3rem 0 !important;
    }
    
    /* 버튼 적당한 크기 */
    .stButton > button {
        width: 100%;
        height: 36px !important;
        padding: 0.4rem 0.8rem !important;
        border-radius: 4px;
        border: 1px solid #d1d5db;
        background: #ffffff;
        color: #374151;
        font-size: 13px !important;
        font-weight: 500;
        margin-bottom: 0.3rem !important;
    }
    
    .stButton > button:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
        transform: none;
        box-shadow: none;
    }
    
    .stButton > button[data-testid="primary"] {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
    }
    
    .stButton > button[data-testid="primary"]:hover {
        background: #2563eb;
        border-color: #2563eb;
    }
    
    /* 메트릭 적당한 크기 */
    [data-testid="metric-container"] {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        padding: 0.5rem !important;
        border-radius: 4px;
        margin-bottom: 0.5rem !important;
    }
    
    [data-testid="metric-container"] > div {
        margin: 0 !important;
        font-size: 13px !important;
    }
    
    [data-testid="metric-container"] [data-testid="metric-label"] {
        font-size: 12px !important;
    }
    
    [data-testid="metric-container"] [data-testid="metric-value"] {
        font-size: 16px !important;
        font-weight: 600;
    }
    
    /* 탭 적당한 크기 */
    .stTabs [data-baseweb="tab-list"] {
        gap: 0;
        margin-bottom: 0.5rem !important;
    }
    
    .stTabs [data-baseweb="tab"] {
        height: 36px !important;
        padding: 0 1rem !important;
        font-size: 13px !important;
    }
    
    /* 셀렉트박스 적당한 크기 */
    .stSelectbox > div > div {
        height: 36px !important;
        min-height: 36px !important;
        font-size: 13px !important;
        color: #374151 !important;
    }
    
    .stSelectbox label {
        font-size: 13px !important;
        margin-bottom: 0.3rem !important;
        color: #374151 !important;
    }
    
    /* 데이터프레임 폰트 적당한 크기 */
    .dataframe {
        font-size: 12px !important;
        color: #374151 !important;
    }
    
    .dataframe th, .dataframe td {
        padding: 0.3rem !important;
        font-size: 12px !important;
        color: #374151 !important;
    }
    
    /* 익스팬더 적당한 크기 */
    .streamlit-expanderHeader {
        font-size: 13px !important;
        padding: 0.4rem 0 !important;
        color: #374151 !important;
    }
    
    .streamlit-expanderContent {
        padding: 0.4rem 0 !important;
        color: #374151 !important;
    }
    
    /* 파일 업로더 적당한 크기 */
    .stFileUploader {
        font-size: 13px !important;
    }
    
    .stFileUploader label {
        font-size: 13px !important;
    }
    
    /* 체크박스 적당한 크기 */
    .stCheckbox {
        font-size: 13px !important;
        color: #374151 !important;
    }
    
    .stCheckbox label {
        font-size: 13px !important;
        color: #374151 !important;
    }
    
    /* 텍스트 인풋 적당한 크기 */
    .stTextInput > div > div > input {
        height: 36px !important;
        font-size: 13px !important;
        padding: 0.5rem !important;
        color: #374151 !important;
    }
    
    .stTextInput label {
        font-size: 13px !important;
        color: #374151 !important;
    }
    
    /* 텍스트 에리어 적당한 크기 */
    .stTextArea textarea {
        font-size: 13px !important;
        padding: 0.5rem !important;
        color: #374151 !important;
    }
    
    .stTextArea label {
        font-size: 13px !important;
        color: #374151 !important;
    }
    
    /* 프로그레스 바 적당한 크기 */
    .stProgress > div > div {
        height: 10px !important;
    }
    
    /* 알림 메시지 적당한 크기 */
    .stAlert {
        font-size: 13px !important;
        padding: 0.6rem !important;
        margin: 0.5rem 0 !important;
    }
    
    /* 정보/에러 메시지 적당한 크기 */
    .stSuccess, .stError, .stWarning, .stInfo {
        font-size: 13px !important;
        padding: 0.6rem !important;
        margin: 0.5rem 0 !important;
    }
    
    /* 마크다운 텍스트 적당한 크기 */
    .stMarkdown {
        font-size: 13px !important;
        margin-bottom: 0.5rem !important;
        color: #374151 !important;
    }
    
    .stMarkdown p {
        font-size: 13px !important;
        line-height: 1.4 !important;
        margin: 0.3rem 0 !important;
        color: #374151 !important;
    }
    
    .stMarkdown strong {
        font-size: 13px !important;
        font-weight: 600;
    }
    
    .stMarkdown small {
        font-size: 11px !important;
    }
    
    /* 컬럼 간격 적당히 조정 */
    .css-1r6slb0, .css-12w0qpk {
        gap: 0.5rem !important;
    }
    
    /* 스피너 적당한 크기 */
    .stSpinner {
        height: 24px !important;
        width: 24px !important;
    }
    
    /* 여백 적당히 조정 */
    .element-container {
        margin-bottom: 0.5rem !important;
    }
    
    /* 차트 높이 적당히 조정 */
    .js-plotly-plot {
        height: 250px !important;
    }
    
    /* 키보드 단축키 힌트 적당한 크기 */
    .keyboard-hint {
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 0.3rem 0.5rem;
        border-radius: 4px;
        font-size: 11px !important;
        z-index: 999;
        line-height: 1.3;
    }
</style>
""", unsafe_allow_html=True)

def main():
    """메인 애플리케이션"""
    
    # 적당한 크기 헤더
    st.markdown("""
    <div class="main-header">
        <h1>🎬 YouTube 자동화 시스템</h1>
    </div>
    """, unsafe_allow_html=True)
    
    # 적당한 크기 사이드바
    with st.sidebar:
        st.markdown("### 🎬 YouTube 자동화")
        
        # 페이지 선택
        pages = {
            "🏠 대시보드": "dashboard",
            "📝 스크립트 관리": "scripts", 
            "📤 업로드 관리": "uploads",
            "📊 시스템 모니터링": "monitoring",
            "⚙️ 설정": "settings"
        }
        
        selected_page = st.selectbox(
            "페이지 선택",
            list(pages.keys()),
            key="page_selector"
        )
        
        st.markdown("---")
        
        # 키보드 단축키 표시
        st.markdown("**⌨️ 키보드 단축키**")
        st.markdown("""
        <div style="background: #f8fafc; padding: 0.5rem; border-radius: 4px; margin: 0.5rem 0; font-size: 12px;">
        <strong>단축키:</strong><br>
        Ctrl+1: 대시보드<br>
        Ctrl+2: 스크립트<br>
        Ctrl+3: 업로드<br>
        Ctrl+4: 모니터링<br>
        Ctrl+5: 설정
        </div>
        """, unsafe_allow_html=True)
        
        # 시스템 상태
        st.markdown("**🔧 시스템 상태**")
        try:
            from api.client import get_api_client
            api = get_api_client()
            health = api.health_check()
            
            if health.get("status") == "healthy":
                st.success("✅ 시스템 정상")
            else:
                st.error("❌ 시스템 오류")
        except:
            st.warning("⚠️ 연결 확인 중...")
    
    # 페이지 라우팅
    page_name = pages[selected_page]
    
    if page_name == "dashboard":
        from pages.dashboard import show_dashboard
        show_dashboard()
    elif page_name == "scripts":
        from pages.scripts import show_scripts_page
        show_scripts_page()
    elif page_name == "uploads":
        from pages.uploads import show_uploads_page
        show_uploads_page()
    elif page_name == "monitoring":
        from pages.monitoring import show_monitoring_page
        show_monitoring_page()
    elif page_name == "settings":
        from pages.settings import show_settings_page
        show_settings_page()

if __name__ == "__main__":
    main()