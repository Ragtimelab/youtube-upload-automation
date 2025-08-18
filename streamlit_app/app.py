"""
YouTube 자동화 대시보드 - 메인 애플리케이션

1인 개발자를 위한 실무표준 Streamlit 대시보드
"""
import streamlit as st
import time
from pathlib import Path
import sys

# 컴포넌트 import를 위한 경로 설정
app_root = Path(__file__).parent
if str(app_root) not in sys.path:
    sys.path.insert(0, str(app_root))

from config import Config
from components.api_client import get_api_client, APIError
from components.ui_components import *
from components.data_utils import *

# 페이지 설정
st.set_page_config(
    page_title=Config.PAGE_TITLE,
    page_icon=Config.PAGE_ICON,
    layout=Config.LAYOUT,
    initial_sidebar_state="collapsed"
)

# CSS 스타일 로드
def load_css():
    """CSS 스타일 로드"""
    css_file = app_root / "assets" / "styles.css"
    if css_file.exists():
        with open(css_file) as f:
            st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

load_css()


def show_dashboard():
    """📊 대시보드 섹션"""
    api = get_api_client()
    
    try:
        # 데이터 로드
        health_data = api.health_check()
        upload_health = api.get_upload_health()
        stats_result = api.get_script_stats()
        stats = stats_result.get("statistics", {})
        scripts_result = api.get_scripts(limit=20)  # 제한된 수량
        scripts = scripts_result.get("scripts", [])
        
        # 컴팩트 레이아웃: 상단 3개 컬럼
        col1, col2, col3 = st.columns([1, 1, 1])
        
        with col1:
            st.subheader("🔧 시스템")
            # API 서버 상태
            if health_data.get("status") == "healthy":
                st.success("✅ API 연결")
            else:
                st.error("❌ API 오류")
            
            # YouTube API 상태
            if upload_health:
                youtube_status = upload_health.get("youtube_api", "unknown")
                if youtube_status == "connected":
                    st.success("✅ YouTube 연결")
                    channel_info = upload_health.get("youtube_channel", {})
                    if channel_info:
                        st.caption(f"📺 {channel_info.get('title', 'Unknown')[:15]}")
                else:
                    st.warning("⚠️ YouTube 확인 중")
        
        with col2:
            st.subheader("📊 통계")
            # 핵심 메트릭만 표시
            st.metric("전체", stats.get("total", 0))
            st.metric("완료", stats.get("uploaded", 0))
            if stats.get("error", 0) > 0:
                st.metric("오류", stats.get("error", 0))
        
        with col3:
            st.subheader("⚡ 빠른 작업")
            st.info("📝 스크립트 업로드하려면\n**스크립트 관리** 탭을 선택하세요")
            st.info("🎬 비디오 업로드하려면\n**업로드 관리** 탭을 선택하세요")
        
        # 하단: 최근 활동 (컴팩트)
        if scripts:
            st.markdown("---")
            st.subheader("📋 최근 활동")
            
            # 최근 3개만 표시
            recent_scripts = sorted(scripts, key=lambda x: x.get('updated_at', ''), reverse=True)[:3]
            
            for script in recent_scripts:
                col_a, col_b, col_c = st.columns([3, 1, 1])
                
                with col_a:
                    display = Config.get_status_display(script['status'])
                    title = truncate_text(script['title'], 40)
                    st.write(f"{display['icon']} **{title}**")
                
                with col_b:
                    created_at = script.get('created_at', '')
                    if created_at:
                        try:
                            dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                            st.caption(dt.strftime("%m-%d %H:%M"))
                        except:
                            st.caption(created_at[:10])
                
                with col_c:
                    if script.get('youtube_video_id'):
                        youtube_url = f"https://www.youtube.com/watch?v={script['youtube_video_id']}"
                        st.markdown(f"[📺]({youtube_url})")
                    else:
                        st.caption(f"ID: {script['id']}")
        else:
            st.info("💡 스크립트를 업로드해서 시작해보세요!")
            
        # 새로고침 (하단 작게)
        if st.button("🔄", help="새로고침"):
            st.rerun()
            
    except APIError as e:
        show_error_message(f"API 오류: {e.message}")
    except Exception as e:
        show_error_message(f"시스템 오류: {str(e)}")


def show_script_management():
    """📝 스크립트 관리 섹션"""
    st.markdown('<div class="section-header"><h2>📝 스크립트 관리</h2></div>', unsafe_allow_html=True)
    
    api = get_api_client()
    
    # 탭 구성
    tab1, tab2 = st.tabs(["📤 업로드", "📋 관리"])
    
    with tab1:
        st.subheader("스크립트 업로드")
        
        # 업로드 방법 선택
        upload_method = st.radio(
            "업로드 방법",
            ["파일 업로드", "직접 입력"],
            horizontal=True
        )
        
        if upload_method == "파일 업로드":
            # 파일 업로드
            uploaded_file = show_file_uploader(
                "스크립트 파일 선택",
                [ext.replace(".", "") for ext in Config.ALLOWED_SCRIPT_FORMATS],
                "지원 형식: .txt, .md"
            )
            
            if uploaded_file:
                # 파일 검증
                validation = validate_file_upload(
                    uploaded_file,
                    Config.ALLOWED_SCRIPT_FORMATS,
                    Config.MAX_FILE_SIZE_MB
                )
                
                if not validation["valid"]:
                    show_error_message(validation["error"])
                else:
                    # 파일 정보 표시
                    st.info(f"📄 {uploaded_file.name} ({format_file_size(validation['size'])})")
                    
                    # 내용 미리보기
                    try:
                        content = uploaded_file.read().decode('utf-8')
                        uploaded_file.seek(0)
                        
                        with st.expander("📖 내용 미리보기", expanded=True):
                            st.text_area("", content[:500] + ("..." if len(content) > 500 else ""), height=200, disabled=True)
                        
                        # 업로드 버튼
                        if st.button("📤 업로드", type="primary"):
                            try:
                                with show_loading_spinner("스크립트 업로드 중..."):
                                    result = api.upload_script(content, uploaded_file.name)
                                
                                show_success_message(f"스크립트 업로드 완료! ID: {result['id']}")
                                st.info(f"📝 제목: {result['title']}")
                                time.sleep(1)
                                st.rerun()
                                
                            except APIError as e:
                                show_error_message(f"업로드 실패: {e.message}")
                    
                    except UnicodeDecodeError:
                        show_error_message("파일 인코딩 오류: UTF-8 형식의 파일을 업로드하세요.")
        
        else:
            # 직접 입력
            st.write("**스크립트 형식 예시:**")
            st.code("""
=== 제목 ===
여기에 비디오 제목을 입력하세요

=== 메타데이터 ===
설명: 비디오 설명을 입력하세요
태그: 태그1, 태그2, 태그3

=== 썸네일 정보 ===
텍스트: 썸네일에 표시할 텍스트
ImageFX 프롬프트: AI 이미지 생성을 위한 프롬프트

=== 대본 ===
여기에 실제 대본 내용을 작성하세요.
            """)
            
            # 텍스트 입력
            script_content = st.text_area(
                "스크립트 내용",
                height=300,
                placeholder="위 형식에 맞춰 스크립트를 작성하세요..."
            )
            
            filename = st.text_input("파일명", value="manual_script.txt")
            
            if script_content.strip():
                if st.button("📝 저장 및 업로드", type="primary"):
                    try:
                        with show_loading_spinner("스크립트 업로드 중..."):
                            result = api.upload_script(script_content, filename)
                        
                        show_success_message(f"스크립트 업로드 완료! ID: {result['id']}")
                        st.info(f"📝 제목: {result['title']}")
                        time.sleep(1)
                        st.rerun()
                        
                    except APIError as e:
                        show_error_message(f"업로드 실패: {e.message}")
    
    with tab2:
        st.subheader("스크립트 목록")
        
        try:
            # 필터 및 검색
            col1, col2, col3 = st.columns([2, 2, 1])
            
            with col1:
                status_filter = st.selectbox(
                    "상태 필터",
                    ["전체", "script_ready", "video_ready", "uploaded", "error"]
                )
            
            with col2:
                search_term = st.text_input("제목 검색", placeholder="검색어 입력...")
            
            with col3:
                if st.button("🔄", help="새로고침"):
                    st.rerun()
            
            # 스크립트 목록 로드
            with show_loading_spinner("스크립트 목록 로딩 중..."):
                scripts_result = api.get_scripts(limit=1000)
                all_scripts = scripts_result.get("scripts", [])
            
            # 필터링 적용
            filtered_scripts = filter_scripts_by_status(all_scripts, status_filter)
            filtered_scripts = search_scripts_by_title(filtered_scripts, search_term)
            
            if not filtered_scripts:
                show_info_message("조건에 맞는 스크립트가 없습니다.")
            else:
                st.write(f"**총 {len(filtered_scripts)}개의 스크립트**")
                
                # 스크립트 테이블 표시
                show_script_table(filtered_scripts)
                
                # 개별 스크립트 관리
                st.markdown("---")
                st.subheader("스크립트 세부 관리")
                
                # 스크립트 선택
                script_options = {
                    script['id']: f"ID {script['id']}: {truncate_text(script['title'], 40)}"
                    for script in filtered_scripts
                }
                
                if script_options:
                    selected_id = st.selectbox(
                        "편집할 스크립트 선택",
                        options=list(script_options.keys()),
                        format_func=lambda x: script_options[x]
                    )
                    
                    # 선택된 스크립트 정보 표시
                    selected_script = next(s for s in filtered_scripts if s['id'] == selected_id)
                    
                    col1, col2 = st.columns([2, 1])
                    
                    with col1:
                        st.info(f"**제목:** {selected_script['title']}")
                        st.info(f"**상태:** {selected_script['status']}")
                        
                        # YouTube 링크 표시
                        if selected_script.get('youtube_video_id'):
                            show_youtube_link(selected_script['youtube_video_id'])
                    
                    with col2:
                        # 삭제 버튼
                        if show_confirmation_dialog("스크립트를 삭제하시겠습니까?", str(selected_id)):
                            try:
                                api.delete_script(selected_id)
                                show_success_message("스크립트가 삭제되었습니다.")
                                time.sleep(1)
                                st.rerun()
                            except APIError as e:
                                show_error_message(f"삭제 실패: {e.message}")
        
        except APIError as e:
            show_error_message(f"데이터 로드 실패: {e.message}")
        except Exception as e:
            show_error_message(f"예상치 못한 오류: {str(e)}")


def show_upload_management():
    """🎬 업로드 관리 섹션"""
    st.markdown('<div class="section-header"><h2>🎬 업로드 관리</h2></div>', unsafe_allow_html=True)
    
    api = get_api_client()
    
    # 탭 구성
    tab1, tab2 = st.tabs(["🎥 비디오 업로드", "📺 YouTube 업로드"])
    
    with tab1:
        st.subheader("비디오 파일 업로드")
        
        try:
            # 업로드 가능한 스크립트 조회
            ready_scripts = api.get_ready_for_video_upload()
            
            if not ready_scripts:
                show_info_message("비디오 업로드가 가능한 스크립트가 없습니다.")
                if st.button("📝 스크립트 페이지로"):
                    st.session_state.current_section = "scripts"
                    st.rerun()
                return
            
            # 스크립트 선택
            script_options = {
                script['id']: f"ID {script['id']}: {truncate_text(script['title'], 50)}"
                for script in ready_scripts
            }
            
            selected_script_id = st.selectbox(
                "스크립트 선택",
                options=list(script_options.keys()),
                format_func=lambda x: script_options[x]
            )
            
            # 선택된 스크립트 정보
            selected_script = next(s for s in ready_scripts if s['id'] == selected_script_id)
            st.info(f"📝 **{selected_script['title']}**")
            
            # 비디오 파일 업로드
            uploaded_video = show_file_uploader(
                "비디오 파일 선택",
                [ext.replace(".", "") for ext in Config.ALLOWED_VIDEO_FORMATS],
                "지원 형식: .mp4, .avi, .mov, .mkv, .webm (최대 8GB)"
            )
            
            if uploaded_video:
                # 파일 검증
                validation = validate_file_upload(
                    uploaded_video,
                    Config.ALLOWED_VIDEO_FORMATS,
                    8000  # 8GB
                )
                
                if not validation["valid"]:
                    show_error_message(validation["error"])
                else:
                    st.info(f"🎬 {uploaded_video.name} ({format_file_size(validation['size'])})")
                    
                    if st.button("🎥 비디오 업로드", type="primary"):
                        try:
                            progress_bar = st.progress(0)
                            status_text = st.empty()
                            
                            status_text.text("비디오 파일 업로드 중...")
                            progress_bar.progress(25)
                            
                            video_content = io.BytesIO(uploaded_video.read())
                            
                            progress_bar.progress(50)
                            result = api.upload_video_file(
                                selected_script_id,
                                video_content,
                                uploaded_video.name
                            )
                            
                            progress_bar.progress(100)
                            status_text.text("업로드 완료!")
                            
                            show_success_message(f"비디오 업로드 완료! 스크립트 ID: {result['script_id']}")
                            time.sleep(2)
                            st.rerun()
                            
                        except APIError as e:
                            show_error_message(f"업로드 실패: {e.message}")
        
        except APIError as e:
            show_error_message(f"데이터 로드 실패: {e.message}")
    
    with tab2:
        st.subheader("YouTube 업로드")
        
        try:
            # YouTube 업로드 가능한 스크립트 조회
            youtube_ready = api.get_ready_for_youtube_upload()
            
            if not youtube_ready:
                show_info_message("YouTube 업로드가 가능한 스크립트가 없습니다.")
                return
            
            # 스크립트 선택
            script_options = {
                script['id']: f"ID {script['id']}: {truncate_text(script['title'], 50)}"
                for script in youtube_ready
            }
            
            selected_script_id = st.selectbox(
                "YouTube 업로드할 스크립트 선택",
                options=list(script_options.keys()),
                format_func=lambda x: script_options[x],
                key="youtube_script_select"
            )
            
            # 선택된 스크립트 정보
            selected_script = next(s for s in youtube_ready if s['id'] == selected_script_id)
            st.info(f"🎬 **{selected_script['title']}**")
            
            # 업로드 설정
            col1, col2 = st.columns(2)
            
            with col1:
                privacy_status = st.selectbox(
                    "공개 설정",
                    ["private", "unlisted", "public"],
                    format_func=lambda x: {"private": "비공개", "unlisted": "링크 공유", "public": "공개"}[x]
                )
            
            with col2:
                category_id = st.selectbox(
                    "카테고리",
                    [22, 24, 26, 27, 28],
                    format_func=lambda x: {
                        22: "People & Blogs",
                        24: "Entertainment", 
                        26: "Howto & Style",
                        27: "Education",
                        28: "Science & Technology"
                    }.get(x, f"Category {x}"),
                    index=0
                )
            
            # YouTube 업로드 버튼
            if st.button("📺 YouTube 업로드", type="primary"):
                try:
                    progress_bar = st.progress(0)
                    status_text = st.empty()
                    
                    status_text.text("YouTube 업로드 시작...")
                    progress_bar.progress(20)
                    
                    result = api.upload_to_youtube(
                        selected_script_id,
                        privacy_status=privacy_status,
                        category_id=category_id
                    )
                    
                    progress_bar.progress(100)
                    status_text.text("업로드 완료!")
                    
                    show_success_message("YouTube 업로드 성공!")
                    
                    # YouTube 링크 표시
                    youtube_id = result.get('youtube_video_id')
                    if youtube_id:
                        show_youtube_link(youtube_id)
                    
                    time.sleep(2)
                    st.rerun()
                    
                except APIError as e:
                    show_error_message(f"YouTube 업로드 실패: {e.message}")
        
        except APIError as e:
            show_error_message(f"데이터 로드 실패: {e.message}")




def main():
    """메인 애플리케이션"""
    
    # 헤더
    st.markdown("""
    <div class="dashboard-header">
        <h1>🎬 YouTube 자동화 대시보드</h1>
        <p>스크립트 → 비디오 → YouTube 자동 업로드</p>
    </div>
    """, unsafe_allow_html=True)
    
    # 네비게이션
    section = st.radio(
        "섹션 선택",
        ["📊 대시보드", "📝 스크립트 관리", "🎬 업로드 관리"],
        horizontal=True,
        key="main_navigation"
    )
    
    # 섹션별 렌더링
    if section == "📊 대시보드":
        show_dashboard()
    elif section == "📝 스크립트 관리":
        show_script_management()
    elif section == "🎬 업로드 관리":
        show_upload_management()


if __name__ == "__main__":
    main()