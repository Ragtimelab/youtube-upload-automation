"""
재사용 가능한 UI 컴포넌트들
"""
import streamlit as st
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional, Any
import plotly.express as px
import plotly.graph_objects as go

import sys
from pathlib import Path

# 상위 디렉토리 import를 위한 경로 설정
parent_dir = Path(__file__).parent.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

from config import Config


def show_status_badge(status: str) -> None:
    """상태 배지 표시"""
    display = Config.get_status_display(status)
    st.markdown(
        f'<span style="color: {display["color"]}; font-weight: bold;">'
        f'{display["icon"]} {status}</span>',
        unsafe_allow_html=True
    )


# show_script_card 함수는 현재 사용되지 않으므로 제거함


# show_stats_metrics 함수도 현재 사용되지 않으므로 제거함


def show_progress_bar(progress: float, label: str = "") -> None:
    """진행률 바 표시"""
    if label:
        st.caption(label)
    st.progress(progress)


def show_error_message(message: str) -> None:
    """오류 메시지 표시"""
    st.error(f"❌ {message}")


def show_success_message(message: str) -> None:
    """성공 메시지 표시"""
    st.success(f"✅ {message}")


def show_info_message(message: str) -> None:
    """정보 메시지 표시"""
    st.info(f"ℹ️ {message}")


def show_warning_message(message: str) -> None:
    """경고 메시지 표시"""
    st.warning(f"⚠️ {message}")


def show_loading_spinner(text: str = "처리 중...") -> Any:
    """로딩 스피너 표시"""
    return st.spinner(text)


def show_file_uploader(label: str, file_types: List[str], help_text: str = None) -> Optional[Any]:
    """파일 업로더 컴포넌트"""
    return st.file_uploader(
        label,
        type=file_types,
        help=help_text
    )


def show_confirmation_dialog(message: str, key: str) -> bool:
    """확인 대화상자"""
    # 확인 상태 초기화
    confirm_key = f"confirm_{key}"
    if confirm_key not in st.session_state:
        st.session_state[confirm_key] = False
    
    if st.session_state[confirm_key]:
        # 확인 상태일 때
        col1, col2 = st.columns(2)
        with col1:
            if st.button("✅ 확실히 삭제", key=f"confirm_delete_{key}", type="primary"):
                st.session_state[confirm_key] = False  # 상태 리셋
                return True
        with col2:
            if st.button("❌ 취소", key=f"cancel_delete_{key}"):
                st.session_state[confirm_key] = False
        
        st.warning("⚠️ 정말로 삭제하시겠습니까?")
    else:
        # 일반 상태일 때
        if st.button("🗑️ 삭제", key=f"delete_{key}"):
            st.session_state[confirm_key] = True
    
    return False


# show_status_chart와 show_recent_activity 함수는 현재 사용되지 않으므로 제거함


def show_script_table(scripts: List[Dict[str, Any]]) -> None:
    """스크립트 테이블 표시"""
    if not scripts:
        show_info_message("표시할 스크립트가 없습니다.")
        return
    
    # 테이블 데이터 구성
    table_data = []
    for script in scripts:
        display = Config.get_status_display(script['status'])
        
        # 시간 포맷팅
        created_at = script.get('created_at', '')
        if created_at:
            try:
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                time_str = dt.strftime("%m-%d %H:%M")
            except:
                time_str = created_at[:10]
        else:
            time_str = "-"
        
        table_data.append({
            "ID": script['id'],
            "제목": script['title'][:50] + ('...' if len(script['title']) > 50 else ''),
            "상태": f"{display['icon']} {script['status']}",
            "생성일": time_str,
            "YouTube": "📺" if script.get('youtube_video_id') else "-"
        })
    
    # 데이터프레임으로 표시
    df = pd.DataFrame(table_data)
    st.dataframe(df, use_container_width=True, hide_index=True)


def show_youtube_link(youtube_id: str) -> None:
    """YouTube 링크 표시"""
    if youtube_id:
        youtube_url = f"https://www.youtube.com/watch?v={youtube_id}"
        st.markdown(f"[📺 YouTube에서 보기]({youtube_url})")


def format_file_size(size_bytes: int) -> str:
    """파일 크기 포맷팅"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024**2:
        return f"{size_bytes/1024:.1f} KB"
    elif size_bytes < 1024**3:
        return f"{size_bytes/(1024**2):.1f} MB"
    else:
        return f"{size_bytes/(1024**3):.1f} GB"


def show_system_status(health_data: Dict[str, Any], upload_health: Dict[str, Any] = None) -> None:
    """시스템 상태 표시"""
    st.subheader("🔧 시스템 상태")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # API 서버 상태
        if health_data.get("status") == "healthy":
            st.success("✅ API 서버 연결됨")
        else:
            st.error("❌ API 서버 연결 실패")
    
    with col2:
        # YouTube API 상태 (upload_health에서 확인)
        if upload_health:
            youtube_status = upload_health.get("youtube_api", "unknown")
            if youtube_status == "connected":
                st.success("✅ YouTube API 연결됨")
                # 채널 정보 표시
                channel_info = upload_health.get("youtube_channel", {})
                if channel_info:
                    st.caption(f"📺 채널: {channel_info.get('title', 'Unknown')}")
            elif youtube_status == "authentication_failed":
                st.error("❌ YouTube 인증 실패")
            else:
                st.warning(f"⚠️ YouTube API: {youtube_status}")
        else:
            st.warning("⚠️ YouTube 상태 확인 중...")


def show_refresh_controls() -> Dict[str, Any]:
    """새로고침 컨트롤 표시"""
    col1, col2, col3 = st.columns([2, 1, 1])
    
    with col1:
        auto_refresh = st.checkbox("자동 새로고침", value=False)
    
    with col2:
        refresh_interval = st.selectbox(
            "간격(초)", 
            [10, 30, 60], 
            index=1
        ) if auto_refresh else None
    
    with col3:
        manual_refresh = st.button("🔄 새로고침")
    
    return {
        "auto_refresh": auto_refresh,
        "refresh_interval": refresh_interval,
        "manual_refresh": manual_refresh
    }