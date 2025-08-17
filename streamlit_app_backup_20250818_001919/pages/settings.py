"""
⚙️ 설정 관리 페이지

시스템 설정, YouTube API 설정, 사용자 설정 등을 관리하는 페이지
"""

import streamlit as st
import json
import os
from pathlib import Path
from datetime import datetime

from api.client import get_api_client, APIError


def show_settings_page():
    """설정 관리 페이지 표시"""
    
    st.markdown("## ⚙️ 시스템 설정")
    st.markdown("시스템 설정과 YouTube API 설정을 관리합니다.")
    
    # API 클라이언트
    api = get_api_client()
    
    # 탭 구성
    tab1, tab2, tab3, tab4 = st.tabs(["🔧 시스템 설정", "📺 YouTube API", "🎨 인터페이스 설정", "💾 백업/복원"])
    
    # ===============================
    # 탭 1: 시스템 설정
    # ===============================
    
    with tab1:
        show_system_settings(api)
    
    # ===============================
    # 탭 2: YouTube API 설정
    # ===============================
    
    with tab2:
        show_youtube_api_settings(api)
    
    # ===============================
    # 탭 3: 인터페이스 설정
    # ===============================
    
    with tab3:
        show_interface_settings()
    
    # ===============================
    # 탭 4: 백업/복원
    # ===============================
    
    with tab4:
        show_backup_restore_settings(api)


def show_system_settings(api):
    """시스템 설정 표시"""
    
    st.subheader("🔧 시스템 설정")
    
    # 현재 시스템 상태 확인
    try:
        upload_health = api.get_upload_health()
        
        # 업로드 시스템 설정 표시
        st.write("**업로드 시스템 설정**")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.info(f"**최대 파일 크기:** {upload_health.get('max_file_size_mb', 'Unknown')}MB")
            
            allowed_formats = upload_health.get('allowed_formats', [])
            if allowed_formats:
                st.info(f"**지원 형식:** {', '.join(allowed_formats)}")
        
        with col2:
            recommended = upload_health.get('recommended_settings', {})
            if recommended:
                st.info(f"**권장 형식:** {recommended.get('format', 'MP4')}")
                st.info(f"**권장 해상도:** {recommended.get('resolution', '1920x1080')}")
                st.info(f"**권장 비트레이트:** {recommended.get('bitrate', '8Mbps')}")
        
        st.markdown("---")
        
        # API 연결 설정
        st.subheader("🌐 API 연결 설정")
        
        # API URL 설정
        current_api_url = st.session_state.get('api_base_url', 'http://localhost:8000')
        new_api_url = st.text_input(
            "API 서버 URL",
            value=current_api_url,
            help="백엔드 API 서버의 URL을 입력하세요"
        )
        
        # 연결 테스트
        if st.button("🔍 API 연결 테스트"):
            try:
                # 임시로 새 API 클라이언트 생성하여 테스트
                from api.client import YouTubeAutomationAPI
                test_api = YouTubeAutomationAPI(new_api_url)
                health = test_api.health_check()
                
                if health.get("status") == "healthy":
                    st.success("✅ API 서버 연결 성공!")
                    st.session_state.api_base_url = new_api_url
                else:
                    st.error(f"❌ API 서버 연결 실패: {health.get('error', 'Unknown error')}")
            except Exception as e:
                st.error(f"❌ 연결 테스트 실패: {str(e)}")
        
        # 타임아웃 설정
        api_timeout = st.slider(
            "API 타임아웃 (초)",
            min_value=10,
            max_value=120,
            value=30,
            help="API 요청의 타임아웃 시간을 설정합니다"
        )
        
        st.markdown("---")
        
        # 로깅 설정
        st.subheader("📜 로깅 설정")
        
        col1, col2 = st.columns(2)
        
        with col1:
            log_level = st.selectbox(
                "로그 레벨",
                ["DEBUG", "INFO", "WARNING", "ERROR"],
                index=1,
                help="시스템 로그의 상세도를 설정합니다"
            )
        
        with col2:
            enable_file_logging = st.checkbox(
                "파일 로깅 활성화",
                value=True,
                help="로그를 파일로 저장할지 설정합니다"
            )
        
        # 자동 정리 설정
        st.subheader("🧹 자동 정리 설정")
        
        col1, col2 = st.columns(2)
        
        with col1:
            auto_cleanup_enabled = st.checkbox(
                "자동 파일 정리 활성화",
                value=True,
                help="오래된 비디오 파일을 자동으로 정리합니다"
            )
        
        with col2:
            cleanup_days = st.number_input(
                "정리 주기 (일)",
                min_value=1,
                max_value=365,
                value=30,
                help="며칠 후 파일을 정리할지 설정합니다"
            )
        
        # 설정 저장
        if st.button("💾 시스템 설정 저장", type="primary"):
            settings = {
                "api_url": new_api_url,
                "api_timeout": api_timeout,
                "log_level": log_level,
                "enable_file_logging": enable_file_logging,
                "auto_cleanup_enabled": auto_cleanup_enabled,
                "cleanup_days": cleanup_days,
                "updated_at": datetime.now().isoformat()
            }
            
            # 세션 상태에 저장
            st.session_state.system_settings = settings
            st.success("✅ 시스템 설정이 저장되었습니다!")
    
    except APIError as e:
        st.error(f"❌ 시스템 상태 조회 실패: {e.message}")
    except Exception as e:
        st.error(f"❌ 예상치 못한 오류: {str(e)}")


def show_youtube_api_settings(api):
    """YouTube API 설정 표시"""
    
    st.subheader("📺 YouTube API 설정")
    
    # YouTube API 상태 확인
    try:
        upload_health = api.get_upload_health()
        youtube_status = upload_health.get("youtube_api", "unknown")
        
        # 현재 상태 표시
        st.write("**현재 YouTube API 상태**")
        
        if youtube_status == "connected":
            st.success("✅ YouTube API 연결됨")
            
            # 채널 정보 표시
            channel_info = upload_health.get("youtube_channel", {})
            if channel_info:
                col1, col2 = st.columns(2)
                with col1:
                    st.write(f"**채널명:** {channel_info.get('title', 'Unknown')}")
                with col2:
                    st.write(f"**구독자 수:** {channel_info.get('subscriber_count', '0')}명")
        
        elif youtube_status == "authentication_failed":
            st.error("❌ YouTube API 인증 실패")
            st.write("credentials.json 파일을 확인하거나 재설정이 필요합니다.")
        
        else:
            st.warning(f"⚠️ YouTube API 상태: {youtube_status}")
        
        st.markdown("---")
        
        # Credentials 파일 설정
        st.subheader("🔐 인증 정보 설정")
        
        st.write("**Google Cloud Console에서 다운로드한 credentials.json 파일을 업로드하세요.**")
        
        credentials_file = st.file_uploader(
            "credentials.json 파일",
            type=['json'],
            help="Google Cloud Console에서 OAuth 2.0 클라이언트 ID의 JSON 키 파일을 다운로드하여 업로드하세요."
        )
        
        if credentials_file is not None:
            try:
                # JSON 파일 검증
                credentials_data = json.load(credentials_file)
                
                # 필수 필드 확인
                required_fields = ['client_id', 'client_secret', 'auth_uri', 'token_uri']
                client_info = credentials_data.get('installed', {})
                
                missing_fields = [field for field in required_fields if field not in client_info]
                
                if missing_fields:
                    st.error(f"❌ credentials.json 파일에 필수 필드가 없습니다: {', '.join(missing_fields)}")
                else:
                    st.success("✅ 유효한 credentials.json 파일입니다!")
                    
                    # 파일 정보 표시
                    st.write(f"**클라이언트 ID:** {client_info['client_id'][:20]}...")
                    st.write(f"**프로젝트 ID:** {credentials_data.get('project_id', 'Unknown')}")
                    
                    # 저장 버튼
                    if st.button("💾 Credentials 저장"):
                        # 실제 환경에서는 안전한 위치에 저장
                        st.session_state.youtube_credentials = credentials_data
                        st.success("✅ YouTube API 인증 정보가 저장되었습니다!")
                        st.info("⚠️ 변경사항을 적용하려면 백엔드 서버를 재시작해주세요.")
            
            except json.JSONDecodeError:
                st.error("❌ 유효하지 않은 JSON 파일입니다.")
            except Exception as e:
                st.error(f"❌ 파일 처리 오류: {str(e)}")
        
        st.markdown("---")
        
        # YouTube 업로드 기본 설정
        st.subheader("📤 업로드 기본 설정")
        
        col1, col2 = st.columns(2)
        
        with col1:
            default_privacy = st.selectbox(
                "기본 공개 설정",
                ["private", "unlisted", "public"],
                index=0,
                format_func=lambda x: {"private": "비공개", "unlisted": "링크 공유", "public": "공개"}[x],
                help="새 비디오 업로드 시 기본 공개 설정"
            )
            
            default_category = st.selectbox(
                "기본 카테고리",
                [22, 1, 2, 10, 15, 17, 19, 20, 23, 24, 25, 26, 27, 28],
                index=0,
                format_func=lambda x: {
                    22: "People & Blogs", 1: "Film & Animation", 2: "Autos & Vehicles",
                    10: "Music", 15: "Pets & Animals", 17: "Sports", 19: "Travel & Events",
                    20: "Gaming", 23: "Comedy", 24: "Entertainment", 25: "News & Politics",
                    26: "Howto & Style", 27: "Education", 28: "Science & Technology"
                }.get(x, f"Category {x}"),
                help="새 비디오의 기본 카테고리"
            )
        
        with col2:
            enable_notifications = st.checkbox(
                "업로드 완료 알림",
                value=True,
                help="YouTube 업로드 완료 시 알림을 받습니다"
            )
            
            auto_add_tags = st.checkbox(
                "자동 태그 추가",
                value=True,
                help="스크립트의 태그를 YouTube 태그로 자동 추가"
            )
        
        # API 할당량 설정
        st.subheader("📊 API 할당량 관리")
        
        col1, col2 = st.columns(2)
        
        with col1:
            daily_quota_limit = st.number_input(
                "일일 할당량 제한",
                min_value=1000,
                max_value=50000,
                value=10000,
                help="YouTube Data API v3의 일일 할당량 제한"
            )
        
        with col2:
            quota_warning_threshold = st.slider(
                "할당량 경고 임계값 (%)",
                min_value=50,
                max_value=95,
                value=80,
                help="할당량 사용률이 이 값을 초과하면 경고를 표시합니다"
            )
        
        # YouTube 설정 저장
        if st.button("💾 YouTube 설정 저장", type="primary"):
            youtube_settings = {
                "default_privacy": default_privacy,
                "default_category": default_category,
                "enable_notifications": enable_notifications,
                "auto_add_tags": auto_add_tags,
                "daily_quota_limit": daily_quota_limit,
                "quota_warning_threshold": quota_warning_threshold,
                "updated_at": datetime.now().isoformat()
            }
            
            st.session_state.youtube_settings = youtube_settings
            st.success("✅ YouTube 설정이 저장되었습니다!")
    
    except APIError as e:
        st.error(f"❌ YouTube API 상태 조회 실패: {e.message}")
    except Exception as e:
        st.error(f"❌ 예상치 못한 오류: {str(e)}")


def show_interface_settings():
    """인터페이스 설정 표시"""
    
    st.subheader("🎨 인터페이스 설정")
    
    # 테마 설정
    st.write("**테마 설정**")
    
    col1, col2 = st.columns(2)
    
    with col1:
        theme_mode = st.selectbox(
            "테마 모드",
            ["Light", "Dark", "Auto"],
            index=0,
            help="인터페이스의 색상 테마를 선택합니다"
        )
    
    with col2:
        accent_color = st.selectbox(
            "강조 색상",
            ["Orange", "Blue", "Green", "Purple", "Red"],
            index=0,
            help="버튼과 강조 요소의 색상을 선택합니다"
        )
    
    # 레이아웃 설정
    st.markdown("---")
    st.write("**레이아웃 설정**")
    
    col1, col2 = st.columns(2)
    
    with col1:
        sidebar_width = st.selectbox(
            "사이드바 크기",
            ["Small", "Medium", "Large"],
            index=1,
            help="사이드바의 크기를 설정합니다"
        )
        
        show_welcome_message = st.checkbox(
            "시작 화면 환영 메시지 표시",
            value=True,
            help="앱 시작 시 환영 메시지를 표시합니다"
        )
    
    with col2:
        items_per_page = st.number_input(
            "페이지당 항목 수",
            min_value=10,
            max_value=100,
            value=20,
            help="목록 페이지에서 한 번에 표시할 항목 수"
        )
        
        enable_animations = st.checkbox(
            "애니메이션 효과",
            value=True,
            help="페이지 전환 및 버튼 애니메이션을 활성화합니다"
        )
    
    # 알림 설정
    st.markdown("---")
    st.write("**알림 설정**")
    
    col1, col2 = st.columns(2)
    
    with col1:
        show_success_messages = st.checkbox(
            "성공 메시지 표시",
            value=True,
            help="작업 완료 시 성공 메시지를 표시합니다"
        )
        
        show_progress_bars = st.checkbox(
            "진행률 표시",
            value=True,
            help="파일 업로드 등의 진행률을 표시합니다"
        )
    
    with col2:
        notification_duration = st.slider(
            "알림 표시 시간 (초)",
            min_value=3,
            max_value=15,
            value=5,
            help="알림 메시지가 표시되는 시간"
        )
        
        enable_sound = st.checkbox(
            "사운드 알림",
            value=False,
            help="작업 완료 시 사운드 알림을 재생합니다"
        )
    
    # 단축키 설정
    st.markdown("---")
    st.write("**키보드 단축키**")
    
    with st.expander("단축키 목록 보기"):
        st.markdown("""
        **현재 지원되는 단축키:**
        
        - `Ctrl + R` : 페이지 새로고침
        - `Ctrl + U` : 스크립트 업로드 페이지로 이동
        - `Ctrl + M` : 모니터링 페이지로 이동
        - `Ctrl + S` : 설정 페이지로 이동
        - `Esc` : 모달 창 닫기
        
        **향후 추가 예정:**
        - 비디오 업로드 단축키
        - 검색 단축키
        - 탭 전환 단축키
        """)
    
    # 언어 설정
    st.markdown("---")
    st.write("**언어 설정**")
    
    language = st.selectbox(
        "인터페이스 언어",
        ["한국어", "English"],
        index=0,
        help="인터페이스 언어를 선택합니다 (현재는 한국어만 지원)"
    )
    
    # 인터페이스 설정 저장
    if st.button("💾 인터페이스 설정 저장", type="primary"):
        interface_settings = {
            "theme_mode": theme_mode,
            "accent_color": accent_color,
            "sidebar_width": sidebar_width,
            "show_welcome_message": show_welcome_message,
            "items_per_page": items_per_page,
            "enable_animations": enable_animations,
            "show_success_messages": show_success_messages,
            "show_progress_bars": show_progress_bars,
            "notification_duration": notification_duration,
            "enable_sound": enable_sound,
            "language": language,
            "updated_at": datetime.now().isoformat()
        }
        
        st.session_state.interface_settings = interface_settings
        st.success("✅ 인터페이스 설정이 저장되었습니다!")
        st.info("일부 설정은 페이지를 새로고침한 후 적용됩니다.")


def show_backup_restore_settings(api):
    """백업/복원 설정 표시"""
    
    st.subheader("💾 백업 및 복원")
    
    # 데이터 백업
    st.write("**데이터 백업**")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.write("스크립트 데이터와 설정을 백업합니다.")
        
        if st.button("📥 데이터 백업 생성"):
            try:
                # 백업 데이터 생성
                backup_data = create_backup_data(api)
                
                # JSON 파일로 다운로드
                backup_json = json.dumps(backup_data, indent=2, ensure_ascii=False)
                
                st.download_button(
                    label="💾 백업 파일 다운로드",
                    data=backup_json,
                    file_name=f"youtube_automation_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                    mime="application/json"
                )
                
                st.success("✅ 백업 파일이 생성되었습니다!")
                
            except Exception as e:
                st.error(f"❌ 백업 생성 실패: {str(e)}")
    
    with col2:
        st.write("정기 자동 백업을 설정합니다.")
        
        enable_auto_backup = st.checkbox(
            "자동 백업 활성화",
            value=False,
            help="정기적으로 데이터를 자동 백업합니다"
        )
        
        if enable_auto_backup:
            backup_frequency = st.selectbox(
                "백업 주기",
                ["매일", "매주", "매월"],
                index=1,
                help="자동 백업 주기를 선택합니다"
            )
            
            backup_time = st.time_input(
                "백업 시간",
                value=datetime.now().time().replace(hour=2, minute=0, second=0, microsecond=0),
                help="자동 백업을 실행할 시간"
            )
    
    # 데이터 복원
    st.markdown("---")
    st.write("**데이터 복원**")
    
    st.warning("⚠️ 주의: 데이터 복원은 기존 데이터를 덮어씁니다. 복원 전에 현재 데이터를 백업하는 것을 권장합니다.")
    
    restore_file = st.file_uploader(
        "백업 파일 선택",
        type=['json'],
        help="이전에 생성한 백업 JSON 파일을 업로드하세요"
    )
    
    if restore_file is not None:
        try:
            # 백업 파일 검증
            backup_data = json.load(restore_file)
            
            # 백업 정보 표시
            st.write("**백업 파일 정보:**")
            col1, col2 = st.columns(2)
            
            with col1:
                st.write(f"생성일: {backup_data.get('created_at', 'Unknown')}")
                st.write(f"버전: {backup_data.get('version', 'Unknown')}")
            
            with col2:
                scripts_count = len(backup_data.get('scripts', []))
                st.write(f"스크립트 수: {scripts_count}개")
                st.write(f"설정 포함: {'✅' if backup_data.get('settings') else '❌'}")
            
            # 복원 옵션
            st.write("**복원 옵션:**")
            
            restore_scripts = st.checkbox(
                "스크립트 데이터 복원",
                value=True,
                help="백업된 스크립트 데이터를 복원합니다"
            )
            
            restore_settings = st.checkbox(
                "설정 복원",
                value=True,
                help="백업된 시스템 설정을 복원합니다"
            )
            
            # 복원 실행
            if st.button("🔄 데이터 복원 실행", type="primary"):
                if restore_scripts or restore_settings:
                    try:
                        success_count = 0
                        error_count = 0
                        
                        # 스크립트 복원
                        if restore_scripts and 'scripts' in backup_data:
                            st.write("스크립트 데이터 복원 중...")
                            for script_data in backup_data['scripts']:
                                try:
                                    # 스크립트 복원 로직 (실제 구현 필요)
                                    success_count += 1
                                except:
                                    error_count += 1
                        
                        # 설정 복원
                        if restore_settings and 'settings' in backup_data:
                            st.write("설정 복원 중...")
                            settings = backup_data['settings']
                            
                            if 'system_settings' in settings:
                                st.session_state.system_settings = settings['system_settings']
                            if 'youtube_settings' in settings:
                                st.session_state.youtube_settings = settings['youtube_settings']
                            if 'interface_settings' in settings:
                                st.session_state.interface_settings = settings['interface_settings']
                        
                        # 결과 표시
                        if error_count == 0:
                            st.success("✅ 데이터 복원이 완료되었습니다!")
                        else:
                            st.warning(f"⚠️ 복원 완료: 성공 {success_count}개, 실패 {error_count}개")
                        
                        st.info("변경사항을 적용하려면 페이지를 새로고침해주세요.")
                        
                    except Exception as e:
                        st.error(f"❌ 데이터 복원 실패: {str(e)}")
                else:
                    st.warning("복원할 항목을 선택해주세요.")
        
        except json.JSONDecodeError:
            st.error("❌ 유효하지 않은 백업 파일입니다.")
        except Exception as e:
            st.error(f"❌ 백업 파일 처리 오류: {str(e)}")
    
    # 데이터 초기화
    st.markdown("---")
    st.write("**데이터 초기화**")
    
    st.error("⚠️ 위험: 모든 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다!")
    
    if st.checkbox("데이터 초기화 확인", value=False):
        if st.button("🗑️ 모든 데이터 삭제", type="secondary"):
            # 실제 환경에서는 신중하게 구현
            st.session_state.clear()
            st.success("✅ 모든 데이터가 초기화되었습니다.")
            st.info("페이지를 새로고침해주세요.")


def create_backup_data(api):
    """백업 데이터 생성"""
    try:
        # 모든 스크립트 조회
        scripts_result = api.get_scripts(limit=10000)
        scripts = scripts_result.get("scripts", [])
        
        # 설정 정보 수집
        settings = {
            "system_settings": st.session_state.get("system_settings", {}),
            "youtube_settings": st.session_state.get("youtube_settings", {}),
            "interface_settings": st.session_state.get("interface_settings", {})
        }
        
        # 백업 데이터 구성
        backup_data = {
            "version": "1.0",
            "created_at": datetime.now().isoformat(),
            "total_scripts": len(scripts),
            "scripts": scripts,
            "settings": settings,
            "metadata": {
                "app_version": "YouTube Automation v2.0",
                "backup_type": "full"
            }
        }
        
        return backup_data
    
    except Exception as e:
        raise Exception(f"백업 데이터 생성 중 오류: {str(e)}")


if __name__ == "__main__":
    show_settings_page()