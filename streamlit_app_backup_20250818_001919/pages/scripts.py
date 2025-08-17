"""
📝 스크립트 관리 페이지

스크립트 업로드, 수정, 삭제, 조회 등 전체 CRUD 작업을 관리하는 페이지
"""

import streamlit as st
import pandas as pd
from datetime import datetime
import io

from api.client import get_api_client, APIError


def show_scripts_page():
    """스크립트 관리 페이지 표시"""
    
    st.markdown("## 📝 스크립트 관리")
    st.markdown("스크립트를 업로드하고 관리할 수 있습니다.")
    
    # API 클라이언트
    api = get_api_client()
    
    # 탭 구성
    tab1, tab2, tab3 = st.tabs(["📤 업로드", "📋 목록 관리", "✏️ 편집"])
    
    # ===============================
    # 탭 1: 스크립트 업로드
    # ===============================
    
    with tab1:
        
        # 업로드 방법 선택
        upload_method = st.radio(
            "업로드 방법 선택",
            ["파일 업로드", "직접 입력"],
            horizontal=True
        )
        
        if upload_method == "파일 업로드":
            # 파일 업로드
            uploaded_file = st.file_uploader(
                "스크립트 파일 선택",
                type=['txt', 'md'],
                help="텍스트 파일(.txt) 또는 마크다운 파일(.md)을 업로드하세요."
            )
            
            if uploaded_file is not None:
                # 파일 내용 미리보기
                try:
                    content = uploaded_file.read().decode('utf-8')
                    uploaded_file.seek(0)  # 파일 포인터 리셋
                    
                    st.write("**파일 미리보기:**")
                    with st.expander("내용 확인", expanded=True):
                        st.text_area("", content, height=200, disabled=True)
                    
                    # 업로드 버튼
                    col1, col2 = st.columns([1, 4])
                    with col1:
                        if st.button("📤 업로드", type="primary"):
                            try:
                                with st.spinner("스크립트 업로드 중..."):
                                    # BytesIO로 변환
                                    file_content = io.BytesIO(uploaded_file.read())
                                    result = api.upload_script(file_content, uploaded_file.name)
                                
                                st.success("✅ 스크립트 업로드 성공!")
                                st.write(f"**ID:** {result['id']}")
                                st.write(f"**제목:** {result['title']}")
                                st.write(f"**상태:** {result['status']}")
                                
                                # 업로드 후 목록 새로고침
                                st.rerun()
                                
                            except APIError as e:
                                st.error(f"❌ 업로드 실패: {e.message}")
                            except Exception as e:
                                st.error(f"❌ 예상치 못한 오류: {str(e)}")
                    
                except UnicodeDecodeError:
                    st.error("❌ 파일 인코딩 오류: UTF-8 형식의 텍스트 파일을 업로드하세요.")
                except Exception as e:
                    st.error(f"❌ 파일 읽기 오류: {str(e)}")
        
        else:
            # 직접 입력
            st.write("**스크립트 형식:**")
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
            
            filename = st.text_input("파일명", value="script.txt")
            
            if script_content.strip():
                col1, col2 = st.columns([1, 4])
                with col1:
                    if st.button("📝 저장 및 업로드", type="primary"):
                        try:
                            with st.spinner("스크립트 업로드 중..."):
                                # 텍스트를 BytesIO로 변환
                                file_content = io.BytesIO(script_content.encode('utf-8'))
                                result = api.upload_script(file_content, filename)
                            
                            st.success("✅ 스크립트 업로드 성공!")
                            st.write(f"**ID:** {result['id']}")
                            st.write(f"**제목:** {result['title']}")
                            st.write(f"**상태:** {result['status']}")
                            
                            # 입력 필드 초기화
                            st.session_state.clear()
                            st.rerun()
                            
                        except APIError as e:
                            st.error(f"❌ 업로드 실패: {e.message}")
                        except Exception as e:
                            st.error(f"❌ 예상치 못한 오류: {str(e)}")
    
    # ===============================
    # 탭 2: 스크립트 목록 관리
    # ===============================
    
    with tab2:
        st.subheader("📋 스크립트 목록")
        
        # 필터 및 검색
        col1, col2, col3 = st.columns([2, 2, 1])
        
        with col1:
            status_filter = st.selectbox(
                "상태 필터",
                ["전체", "script_ready", "video_ready", "uploaded", "scheduled", "error"],
                key="scripts_status_filter"
            )
        
        with col2:
            search_term = st.text_input("제목 검색", placeholder="검색어를 입력하세요...")
        
        with col3:
            if st.button("🔄 새로고침"):
                st.rerun()
        
        # 스크립트 목록 조회
        try:
            # 필터 적용
            filter_status = None if status_filter == "전체" else status_filter
            
            with st.spinner("스크립트 목록 로딩 중..."):
                scripts_result = api.get_scripts(limit=100, status=filter_status)
                scripts = scripts_result.get("scripts", [])
                total = scripts_result.get("total", 0)
            
            # 검색 필터 적용
            if search_term:
                scripts = [s for s in scripts if search_term.lower() in s.get('title', '').lower()]
            
            if not scripts:
                st.info("조건에 맞는 스크립트가 없습니다.")
                return
            
            st.write(f"**총 {len(scripts)}개의 스크립트** (전체: {total}개)")
            
            # 배치 작업 버튼
            col1, col2, col3 = st.columns([1, 1, 3])
            with col1:
                if st.button("🗑️ 선택 삭제", help="체크된 스크립트들을 삭제합니다"):
                    st.session_state.show_batch_delete = True
            with col2:
                if st.button("📊 통계 보기"):
                    show_script_statistics(scripts)
            
            # 스크립트 목록 표시
            for idx, script in enumerate(scripts):
                with st.container():
                    col1, col2, col3, col4, col5 = st.columns([0.5, 3, 1.5, 1.5, 1])
                    
                    with col1:
                        # 선택 체크박스
                        selected = st.checkbox("", key=f"select_{script['id']}", label_visibility="collapsed")
                    
                    with col2:
                        # 제목과 상태
                        status_emoji = {
                            'script_ready': '📝',
                            'video_ready': '🎥',
                            'uploaded': '✅',
                            'scheduled': '⏰',
                            'error': '❌'
                        }.get(script['status'], '❓')
                        
                        title = script['title']
                        if len(title) > 50:
                            title = title[:50] + "..."
                        
                        st.write(f"{status_emoji} **{title}**")
                        st.caption(f"ID: {script['id']} | 상태: {script['status']}")
                    
                    with col3:
                        # 생성일
                        created_at = script.get('created_at', '')
                        if created_at:
                            try:
                                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                                formatted_date = dt.strftime("%Y-%m-%d")
                                st.write(f"생성: {formatted_date}")
                            except:
                                st.write(f"생성: {created_at[:10]}")
                        else:
                            st.write("생성: -")
                    
                    with col4:
                        # YouTube ID
                        youtube_id = script.get('youtube_video_id', '')
                        if youtube_id:
                            youtube_url = f"https://www.youtube.com/watch?v={youtube_id}"
                            st.markdown(f"[📺 YouTube]({youtube_url})")
                        else:
                            st.write("-")
                    
                    with col5:
                        # 작업 버튼
                        action_col1, action_col2 = st.columns(2)
                        with action_col1:
                            if st.button("👁️", key=f"view_{script['id']}", help="상세 보기"):
                                st.session_state.selected_script_id = script['id']
                                st.session_state.active_tab = 2  # 편집 탭으로 이동
                                st.rerun()
                        
                        with action_col2:
                            if st.button("🗑️", key=f"delete_{script['id']}", help="삭제"):
                                if st.session_state.get(f"confirm_delete_{script['id']}", False):
                                    try:
                                        api.delete_script(script['id'])
                                        st.success(f"✅ 스크립트 {script['id']} 삭제 완료")
                                        st.rerun()
                                    except APIError as e:
                                        st.error(f"❌ 삭제 실패: {e.message}")
                                else:
                                    st.session_state[f"confirm_delete_{script['id']}"] = True
                                    st.warning("⚠️ 한 번 더 클릭하면 삭제됩니다.")
                    
                    st.markdown("---")
        
        except APIError as e:
            st.error(f"❌ 데이터 로드 실패: {e.message}")
        except Exception as e:
            st.error(f"❌ 예상치 못한 오류: {str(e)}")
    
    # ===============================
    # 탭 3: 스크립트 편집
    # ===============================
    
    with tab3:
        st.subheader("✏️ 스크립트 편집")
        
        # 스크립트 선택
        script_id = st.number_input(
            "편집할 스크립트 ID",
            min_value=1,
            value=st.session_state.get("selected_script_id", 1),
            key="edit_script_id"
        )
        
        if st.button("🔍 스크립트 로드"):
            try:
                script = api.get_script(script_id)
                st.session_state.edit_script_data = script
                st.session_state.edit_script_loaded = True
                st.rerun()
            except APIError as e:
                st.error(f"❌ 스크립트 로드 실패: {e.message}")
        
        # 스크립트 편집 폼
        if st.session_state.get("edit_script_loaded", False) and "edit_script_data" in st.session_state:
            script_data = st.session_state.edit_script_data
            
            st.write(f"**편집 중인 스크립트:** {script_data['title']}")
            st.write(f"**현재 상태:** {script_data['status']}")
            
            # 편집 폼
            with st.form("edit_script_form"):
                col1, col2 = st.columns(2)
                
                with col1:
                    new_title = st.text_input(
                        "제목",
                        value=script_data.get('title', ''),
                        max_chars=100
                    )
                    
                    new_description = st.text_area(
                        "설명",
                        value=script_data.get('description', ''),
                        height=100
                    )
                    
                    new_tags = st.text_input(
                        "태그 (쉼표로 구분)",
                        value=script_data.get('tags', '')
                    )
                
                with col2:
                    new_thumbnail_text = st.text_input(
                        "썸네일 텍스트",
                        value=script_data.get('thumbnail_text', '')
                    )
                    
                    new_imagefx_prompt = st.text_area(
                        "ImageFX 프롬프트",
                        value=script_data.get('imagefx_prompt', ''),
                        height=100
                    )
                
                # 내용 미리보기
                st.write("**스크립트 내용 미리보기:**")
                content = script_data.get('content', '')
                if content:
                    preview = content[:500] + ('...' if len(content) > 500 else '')
                    st.text_area("", preview, height=150, disabled=True)
                
                # 저장 버튼
                col1, col2 = st.columns([1, 4])
                with col1:
                    if st.form_submit_button("💾 저장", type="primary"):
                        try:
                            # 변경된 필드만 업데이트
                            update_data = {}
                            
                            if new_title != script_data.get('title', ''):
                                update_data['title'] = new_title
                            if new_description != script_data.get('description', ''):
                                update_data['description'] = new_description
                            if new_tags != script_data.get('tags', ''):
                                update_data['tags'] = new_tags
                            if new_thumbnail_text != script_data.get('thumbnail_text', ''):
                                update_data['thumbnail_text'] = new_thumbnail_text
                            if new_imagefx_prompt != script_data.get('imagefx_prompt', ''):
                                update_data['imagefx_prompt'] = new_imagefx_prompt
                            
                            if update_data:
                                result = api.update_script(script_id, **update_data)
                                st.success("✅ 스크립트 수정 완료!")
                                st.write(f"**수정 시간:** {result.get('updated_at', '')}")
                                
                                # 데이터 새로고침
                                st.session_state.edit_script_data = api.get_script(script_id)
                                st.rerun()
                            else:
                                st.info("변경된 내용이 없습니다.")
                        
                        except APIError as e:
                            st.error(f"❌ 수정 실패: {e.message}")
                        except Exception as e:
                            st.error(f"❌ 예상치 못한 오류: {str(e)}")


def show_script_statistics(scripts):
    """스크립트 통계 표시"""
    st.subheader("📊 스크립트 통계")
    
    # 상태별 통계
    status_counts = {}
    for script in scripts:
        status = script.get('status', 'unknown')
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # 메트릭 표시
    cols = st.columns(len(status_counts))
    for idx, (status, count) in enumerate(status_counts.items()):
        with cols[idx]:
            st.metric(status, count)
    
    # 날짜별 생성 통계
    creation_dates = {}
    for script in scripts:
        created_at = script.get('created_at', '')
        if created_at:
            try:
                date = created_at[:10]  # YYYY-MM-DD
                creation_dates[date] = creation_dates.get(date, 0) + 1
            except:
                pass
    
    if creation_dates:
        st.write("**일별 생성 통계:**")
        df = pd.DataFrame(list(creation_dates.items()), columns=['날짜', '개수'])
        st.bar_chart(df.set_index('날짜'))


if __name__ == "__main__":
    show_scripts_page()