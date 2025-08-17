"""
📤 업로드 관리 페이지

비디오 파일 업로드와 YouTube 업로드를 관리하는 페이지
"""

import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
import io
import time

from api.client import get_api_client, APIError


def show_uploads_page():
    """업로드 관리 페이지 표시"""
    
    # 적당한 크기 헤더
    st.markdown("## 📤 업로드 관리")
    st.markdown("비디오 파일 업로드와 YouTube 업로드를 관리합니다.")
    
    # API 클라이언트
    api = get_api_client()
    
    # 탭 구성
    tab1, tab2, tab3 = st.tabs(["🎥 비디오 업로드", "📺 YouTube 업로드", "📊 업로드 현황"])
    
    # ===============================
    # 탭 1: 비디오 파일 업로드
    # ===============================
    
    with tab1:
        # 업로드 가능한 스크립트 목록 조회
        try:
            ready_scripts = api.get_ready_for_video_upload()
            
            if not ready_scripts:
                st.info("업로드 가능한 스크립트가 없습니다.")
                if st.button("📝 스크립트 페이지로"):
                    st.session_state.page_selector = "📝 스크립트"
                    st.rerun()
                return
            
            # 스크립트 선택 - 컴팩트
            col1, col2 = st.columns([3, 1])
            with col1:
                script_options = {
                    script['id']: f"ID{script['id']}: {script['title'][:30]}{'...' if len(script['title']) > 30 else ''}"
                    for script in ready_scripts
                }
                
                selected_script_id = st.selectbox(
                    "스크립트 선택",
                    options=list(script_options.keys()),
                    format_func=lambda x: script_options[x],
                    key="video_upload_script_id",
                    label_visibility="collapsed"
                )
            
            with col2:
                st.markdown('<span style="font-size: 10px; font-weight: 600;">설정</span>', unsafe_allow_html=True)
                st.markdown('<span style="font-size: 9px;">MP4, 최대 8GB</span>', unsafe_allow_html=True)
            
            # 선택된 스크립트 정보 - 컴팩트
            selected_script = next(s for s in ready_scripts if s['id'] == selected_script_id)
            
            st.markdown(f'<span style="font-size: 10px;"><b>선택:</b> {selected_script["title"][:30]} | <b>상태:</b> {selected_script["status"]}</span>', unsafe_allow_html=True)
            
            # 컴팩트 파일 업로드
            uploaded_video = st.file_uploader(
                "비디오 파일",
                type=['mp4', 'avi', 'mov', 'mkv', 'webm'],
                label_visibility="collapsed"
            )
            
            if uploaded_video is not None:
                # 파일 정보 - 인라인 표시
                file_size_mb = len(uploaded_video.read()) / (1024 * 1024)
                uploaded_video.seek(0)  # 파일 포인터 리셋
                
                st.markdown(f'<span style="font-size: 10px;"><b>파일:</b> {uploaded_video.name[:20]} | <b>크기:</b> {file_size_mb:.1f}MB</span>', unsafe_allow_html=True)
                
                # 파일 크기 검증
                if file_size_mb > 8000:  # 8GB 제한
                    st.error("❌ 파일이 8GB를 초과합니다.")
                    return
                
                # 업로드 버튼 - 인라인
                col1, col2 = st.columns([1, 3])
                with col1:
                    if st.button("🎥 업로드", type="primary"):
                        try:
                            # 컴팩트 프로그레스
                            progress_bar = st.progress(0)
                            
                            progress_bar.progress(25)
                            video_content = io.BytesIO(uploaded_video.read())
                            
                            progress_bar.progress(50)
                            result = api.upload_video_file(
                                selected_script_id, 
                                video_content, 
                                uploaded_video.name
                            )
                            
                            progress_bar.progress(100)
                            st.success(f"✅ 업로드 완료: {result['script_id']}")
                            
                            # YouTube 탭으로 이동
                            time.sleep(1)
                            st.session_state.active_upload_tab = 1
                            st.rerun()
                            
                        except APIError as e:
                            st.error(f"❌ 실패: {e.message}")
                        except Exception as e:
                            st.error(f"❌ 오류: {str(e)}")
                
                with col2:
                    st.markdown('<span style="font-size: 9px;">업로드 후 자동으로 YouTube 탭 이동</span>', unsafe_allow_html=True)
        
        except APIError as e:
            st.error(f"❌ 데이터 로드 실패: {e.message}")
        except Exception as e:
            st.error(f"❌ 예상치 못한 오류: {str(e)}")
    
    # ===============================
    # 탭 2: YouTube 업로드
    # ===============================
    
    with tab2:
        st.subheader("📺 YouTube 업로드")
        
        # YouTube 업로드 가능한 스크립트 목록 조회
        try:
            youtube_ready_scripts = api.get_ready_for_youtube_upload()
            
            if not youtube_ready_scripts:
                st.info("YouTube 업로드가 가능한 스크립트가 없습니다.")
                st.markdown("먼저 비디오 파일을 업로드해주세요.")
                return
            
            # 개별 업로드와 배치 업로드 선택
            upload_mode = st.radio(
                "업로드 모드",
                ["개별 업로드", "배치 업로드"],
                horizontal=True
            )
            
            if upload_mode == "개별 업로드":
                # 개별 YouTube 업로드
                show_individual_youtube_upload(api, youtube_ready_scripts)
            else:
                # 배치 YouTube 업로드
                show_batch_youtube_upload(api, youtube_ready_scripts)
        
        except APIError as e:
            st.error(f"❌ 데이터 로드 실패: {e.message}")
        except Exception as e:
            st.error(f"❌ 예상치 못한 오류: {str(e)}")
    
    # ===============================
    # 탭 3: 업로드 현황
    # ===============================
    
    with tab3:
        show_upload_status_overview(api)


def show_individual_youtube_upload(api, youtube_ready_scripts):
    """개별 YouTube 업로드 처리"""
    
    # 스크립트 선택
    script_options = {
        script['id']: f"ID {script['id']}: {script['title'][:50]}{'...' if len(script['title']) > 50 else ''}"
        for script in youtube_ready_scripts
    }
    
    selected_script_id = st.selectbox(
        "YouTube 업로드할 스크립트 선택",
        options=list(script_options.keys()),
        format_func=lambda x: script_options[x],
        key="youtube_upload_script_id"
    )
    
    # 선택된 스크립트 정보
    selected_script = next(s for s in youtube_ready_scripts if s['id'] == selected_script_id)
    
    # 업로드 설정
    col1, col2 = st.columns(2)
    
    with col1:
        st.write("**업로드 설정**")
        
        privacy_status = st.selectbox(
            "공개 설정",
            ["private", "unlisted", "public"],
            format_func=lambda x: {"private": "비공개", "unlisted": "링크 공유", "public": "공개"}[x],
            help="private: 본인만 시청 가능, unlisted: 링크를 아는 사람만 시청 가능, public: 모든 사람 시청 가능"
        )
        
        category_id = st.selectbox(
            "카테고리",
            [22, 1, 2, 10, 15, 17, 19, 20, 23, 24, 25, 26, 27, 28],
            format_func=lambda x: {
                22: "People & Blogs", 1: "Film & Animation", 2: "Autos & Vehicles",
                10: "Music", 15: "Pets & Animals", 17: "Sports", 19: "Travel & Events",
                20: "Gaming", 23: "Comedy", 24: "Entertainment", 25: "News & Politics",
                26: "Howto & Style", 27: "Education", 28: "Science & Technology"
            }.get(x, f"Category {x}"),
            index=0
        )
    
    with col2:
        st.write("**예약 발행 (선택사항)**")
        
        enable_scheduling = st.checkbox("예약 발행 사용")
        
        if enable_scheduling:
            schedule_date = st.date_input(
                "발행 날짜",
                value=datetime.now().date() + timedelta(days=1),
                min_value=datetime.now().date()
            )
            
            schedule_time = st.time_input(
                "발행 시간",
                value=datetime.now().time().replace(hour=9, minute=0, second=0, microsecond=0)
            )
            
            # ISO 8601 형식으로 변환
            schedule_datetime = datetime.combine(schedule_date, schedule_time)
            publish_at = schedule_datetime.isoformat() + "Z"
        else:
            publish_at = None
    
    # 선택된 스크립트 미리보기
    with st.expander("📋 업로드할 스크립트 정보", expanded=True):
        col1, col2 = st.columns(2)
        with col1:
            st.write(f"**제목:** {selected_script['title']}")
            st.write(f"**설명:** {selected_script.get('description', '없음')}")
            st.write(f"**태그:** {selected_script.get('tags', '없음')}")
        
        with col2:
            # 업로드 상태 확인
            try:
                upload_status = api.get_upload_status(selected_script_id)
                if upload_status.get('has_video_file'):
                    file_info = upload_status.get('video_file_info', {})
                    st.write(f"**비디오 파일:** ✅ {file_info.get('filename', 'Unknown')}")
                    st.write(f"**파일 크기:** {file_info.get('file_size', 0) / (1024*1024):.1f} MB")
                else:
                    st.write("**비디오 파일:** ❌ 없음")
            except:
                st.write("**비디오 파일:** 확인 중...")
    
    # YouTube 업로드 버튼
    col1, col2 = st.columns([1, 3])
    with col1:
        if st.button("📺 YouTube 업로드", type="primary"):
            try:
                # 프로그레스 바
                progress_bar = st.progress(0)
                status_text = st.empty()
                
                status_text.text("YouTube 업로드 시작...")
                progress_bar.progress(20)
                
                # API 호출
                result = api.upload_to_youtube(
                    selected_script_id,
                    publish_at=publish_at,
                    privacy_status=privacy_status,
                    category_id=category_id
                )
                
                progress_bar.progress(100)
                status_text.text("업로드 완료!")
                
                st.success("✅ YouTube 업로드 성공!")
                st.write(f"**YouTube ID:** {result['youtube_video_id']}")
                
                # YouTube URL 생성
                youtube_url = f"https://www.youtube.com/watch?v={result['youtube_video_id']}"
                st.markdown(f"**YouTube URL:** [동영상 보기]({youtube_url})")
                
                if publish_at:
                    st.info(f"⏰ 예약 발행: {schedule_datetime.strftime('%Y-%m-%d %H:%M')}")
                else:
                    st.info(f"🔒 공개 설정: {privacy_status}")
                
                # 업로드 현황 새로고침
                time.sleep(2)
                st.rerun()
                
            except APIError as e:
                st.error(f"❌ YouTube 업로드 실패: {e.message}")
                progress_bar.empty()
                status_text.empty()
            except Exception as e:
                st.error(f"❌ 예상치 못한 오류: {str(e)}")
                progress_bar.empty()
                status_text.empty()


def show_batch_youtube_upload(api, youtube_ready_scripts):
    """배치 YouTube 업로드 처리"""
    
    st.write("**배치 YouTube 업로드**")
    st.info("여러 스크립트를 한번에 YouTube에 업로드할 수 있습니다.")
    
    # 스크립트 선택
    selected_scripts = []
    
    st.write("업로드할 스크립트를 선택하세요:")
    
    # 전체 선택/해제
    col1, col2 = st.columns([1, 4])
    with col1:
        select_all = st.checkbox("전체 선택")
    
    # 스크립트 목록
    for script in youtube_ready_scripts:
        col1, col2, col3 = st.columns([0.5, 3, 1])
        
        with col1:
            if select_all:
                selected = True
            else:
                selected = st.checkbox("", key=f"batch_select_{script['id']}", label_visibility="collapsed")
            
            if selected:
                selected_scripts.append(script)
        
        with col2:
            st.write(f"**ID {script['id']}:** {script['title'][:60]}{'...' if len(script['title']) > 60 else ''}")
        
        with col3:
            # 업로드 상태 확인
            try:
                upload_status = api.get_upload_status(script['id'])
                if upload_status.get('has_video_file'):
                    st.success("✅ 준비됨")
                else:
                    st.error("❌ 비디오 없음")
            except:
                st.warning("⚠️ 확인 중")
    
    if selected_scripts:
        st.write(f"**선택된 스크립트:** {len(selected_scripts)}개")
        
        # 배치 업로드 설정
        col1, col2 = st.columns(2)
        
        with col1:
            batch_privacy = st.selectbox(
                "공개 설정 (일괄 적용)",
                ["private", "unlisted", "public"],
                format_func=lambda x: {"private": "비공개", "unlisted": "링크 공유", "public": "공개"}[x]
            )
        
        with col2:
            batch_delay = st.slider(
                "업로드 간격 (초)",
                min_value=5,
                max_value=60,
                value=10,
                help="YouTube API 할당량 보호를 위한 업로드 간격"
            )
        
        # 배치 업로드 실행
        if st.button("🚀 배치 업로드 시작", type="primary"):
            try:
                # 전체 프로그레스
                total_scripts = len(selected_scripts)
                overall_progress = st.progress(0)
                status_container = st.container()
                
                results = []
                
                for idx, script in enumerate(selected_scripts):
                    with status_container:
                        st.write(f"**[{idx+1}/{total_scripts}]** {script['title'][:50]}... 업로드 중")
                        script_progress = st.progress(0)
                    
                    try:
                        # 개별 스크립트 업로드
                        script_progress.progress(50)
                        
                        result = api.upload_to_youtube(
                            script['id'],
                            privacy_status=batch_privacy
                        )
                        
                        script_progress.progress(100)
                        
                        results.append({
                            "script_id": script['id'],
                            "title": script['title'],
                            "status": "success",
                            "youtube_id": result['youtube_video_id']
                        })
                        
                        st.success(f"✅ ID {script['id']} 업로드 완료")
                        
                    except Exception as e:
                        results.append({
                            "script_id": script['id'],
                            "title": script['title'],
                            "status": "error",
                            "error": str(e)
                        })
                        
                        st.error(f"❌ ID {script['id']} 업로드 실패: {str(e)}")
                    
                    # 전체 진행률 업데이트
                    overall_progress.progress((idx + 1) / total_scripts)
                    
                    # 업로드 간격 대기 (마지막 제외)
                    if idx < total_scripts - 1:
                        time.sleep(batch_delay)
                
                # 결과 요약
                st.markdown("---")
                st.subheader("📊 배치 업로드 결과")
                
                success_count = len([r for r in results if r['status'] == 'success'])
                error_count = len([r for r in results if r['status'] == 'error'])
                
                col1, col2 = st.columns(2)
                with col1:
                    st.metric("성공", success_count)
                with col2:
                    st.metric("실패", error_count)
                
                # 상세 결과
                if results:
                    df_results = pd.DataFrame(results)
                    st.dataframe(df_results, use_container_width=True)
                
            except Exception as e:
                st.error(f"❌ 배치 업로드 오류: {str(e)}")


def show_upload_status_overview(api):
    """업로드 현황 개요 표시"""
    
    st.subheader("📊 업로드 현황")
    
    try:
        # 전체 스크립트 조회
        scripts_result = api.get_scripts(limit=1000)
        all_scripts = scripts_result.get("scripts", [])
        
        if not all_scripts:
            st.info("등록된 스크립트가 없습니다.")
            return
        
        # 상태별 분류
        status_counts = {}
        for script in all_scripts:
            status = script.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # 메트릭 표시
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                "📝 스크립트 준비",
                status_counts.get('script_ready', 0),
                help="비디오 업로드 대기 중"
            )
        
        with col2:
            st.metric(
                "🎥 비디오 준비",
                status_counts.get('video_ready', 0),
                help="YouTube 업로드 대기 중"
            )
        
        with col3:
            st.metric(
                "✅ 업로드 완료",
                status_counts.get('uploaded', 0),
                help="YouTube 업로드 완료"
            )
        
        with col4:
            st.metric(
                "❌ 오류",
                status_counts.get('error', 0),
                help="처리 중 오류 발생"
            )
        
        st.markdown("---")
        
        # 최근 업로드된 비디오 목록
        st.subheader("📺 최근 업로드된 비디오")
        
        uploaded_videos = [s for s in all_scripts if s.get('youtube_video_id')]
        uploaded_videos.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
        
        if uploaded_videos:
            for video in uploaded_videos[:10]:  # 최근 10개
                col1, col2, col3, col4 = st.columns([3, 2, 2, 1])
                
                with col1:
                    st.write(f"**{video['title'][:50]}{'...' if len(video['title']) > 50 else ''}**")
                
                with col2:
                    updated_at = video.get('updated_at', '')
                    if updated_at:
                        try:
                            dt = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
                            formatted_time = dt.strftime("%m-%d %H:%M")
                            st.write(f"업로드: {formatted_time}")
                        except:
                            st.write(f"업로드: {updated_at[:10]}")
                
                with col3:
                    youtube_id = video.get('youtube_video_id', '')
                    if youtube_id:
                        youtube_url = f"https://www.youtube.com/watch?v={youtube_id}"
                        st.markdown(f"[📺 YouTube]({youtube_url})")
                
                with col4:
                    st.write(f"ID: {video['id']}")
        else:
            st.info("업로드된 비디오가 없습니다.")
        
        # 업로드 통계 차트
        st.markdown("---")
        st.subheader("📈 업로드 통계")
        
        # 일별 업로드 통계
        daily_uploads = {}
        for script in all_scripts:
            if script.get('youtube_video_id'):
                updated_at = script.get('updated_at', '')
                if updated_at:
                    try:
                        date = updated_at[:10]  # YYYY-MM-DD
                        daily_uploads[date] = daily_uploads.get(date, 0) + 1
                    except:
                        pass
        
        if daily_uploads:
            df_daily = pd.DataFrame(list(daily_uploads.items()), columns=['날짜', '업로드 수'])
            df_daily = df_daily.sort_values('날짜')
            st.line_chart(df_daily.set_index('날짜'))
        else:
            st.info("업로드 통계 데이터가 없습니다.")
    
    except APIError as e:
        st.error(f"❌ 데이터 로드 실패: {e.message}")
    except Exception as e:
        st.error(f"❌ 예상치 못한 오류: {str(e)}")


if __name__ == "__main__":
    show_uploads_page()