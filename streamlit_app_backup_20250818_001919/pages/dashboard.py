"""
🏠 메인 대시보드

전체 시스템 상태와 통계를 실시간으로 모니터링하는 대시보드
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import time

from api.client import get_api_client, APIError


def show_dashboard():
    """메인 대시보드 표시"""
    
    # 적당한 크기 헤더
    col1, col2, col3, col4 = st.columns([3, 1, 1, 1])
    with col1:
        st.markdown("## 🏠 대시보드")
    with col2:
        auto_refresh = st.checkbox("자동새로고침", value=False, key="dashboard_auto_refresh")
    with col3:
        if st.button("🔄 새로고침", key="dashboard_refresh"):
            st.rerun()
    with col4:
        st.markdown(f"**{datetime.now().strftime('%H:%M:%S')}**")
    
    # 자동 새로고침 처리
    if auto_refresh:
        time.sleep(30)
        st.rerun()
    
    # API 클라이언트
    api = get_api_client()
    
    # API 연결 상태 확인 - 컴팩트
    try:
        health_status = api.health_check()
        if health_status["status"] != "healthy":
            st.error(f"❌ API 연결 실패: {health_status.get('error', 'Unknown')}")
            return
        
    except Exception as e:
        st.error(f"❌ 시스템 오류: {str(e)}")
        return
    
    # 데이터 로드
    try:
        # 통계 데이터
        stats_result = api.get_script_stats()
        stats = stats_result.get("statistics", {})
        
        # 스크립트 목록
        scripts_result = api.get_scripts(limit=100)
        scripts = scripts_result.get("scripts", [])
        
        # 업로드 시스템 상태
        upload_health = api.get_upload_health()
        
    except APIError as e:
        st.error(f"❌ 데이터 로드 실패: {e.message}")
        return
    except Exception as e:
        st.error(f"❌ 예상치 못한 오류: {str(e)}")
        return
    
    # 통계 섹션
    st.markdown("### 📊 시스템 통계")
    
    # 통계 데이터를 테이블로 구성
    stats_data = {
        "항목": ["📝 전체", "✅ 완료", "🎥 비디오준비", "⏰ 예약", "❌ 오류"],
        "개수": [
            stats.get("total", 0),
            stats.get("uploaded", 0), 
            stats.get("video_ready", 0),
            stats.get("scheduled", 0),
            stats.get("error", 0)
        ]
    }
    
    df_stats = pd.DataFrame(stats_data)
    
    # 테이블 스타일링을 위한 컬럼 구성
    col1, col2, col3 = st.columns([2, 3, 5])
    
    with col1:
        st.dataframe(
            df_stats,
            use_container_width=True,
            hide_index=True,
            height=180
        )
    
    with col2:
        # 시스템 상태 요약
        st.markdown("**시스템 상태**")
        total = stats.get("total", 0)
        if total > 0:
            progress_rate = stats.get("uploaded", 0) / total * 100
            st.progress(progress_rate / 100)
            st.markdown(f"완료율: {progress_rate:.1f}%")
        else:
            st.markdown("데이터 없음")
            
        # 알림
        if stats.get("error", 0) > 0:
            st.error(f"오류 {stats['error']}건")
        if stats.get("video_ready", 0) > 0:
            st.info(f"업로드 대기 {stats['video_ready']}건")
    
    with col3:
        # 빠른 작업 버튼들
        st.markdown("**빠른 작업**")
        
        col_a, col_b, col_c = st.columns(3)
        with col_a:
            st.markdown("📝 스크립트")
        with col_b:
            st.markdown("📤 업로드")
        with col_c:
            st.markdown("📊 모니터링")
    
    # 시각화 섹션
    if stats.get("total", 0) > 0:
        st.markdown("### 📈 데이터 분포")
        
        # 상태별 분포 데이터
        status_data = []
        status_labels = {
            'script_ready': '📝 스크립트',
            'video_ready': '🎥 비디오', 
            'uploaded': '✅ 완료',
            'scheduled': '⏰ 예약',
            'error': '❌ 오류'
        }
        
        for key, value in stats.items():
            if key != 'total' and value > 0:
                label = status_labels.get(key, key)
                status_data.append({"상태": label, "개수": value})
        
        if status_data:
            df_status = pd.DataFrame(status_data)
            
            # 수평 바 차트 (더 컴팩트함)
            fig_bar = px.bar(
                df_status,
                x="개수",
                y="상태", 
                orientation='h',
                text="개수",
                height=200
            )
            fig_bar.update_traces(
                texttemplate='%{text}',
                textposition='auto'
            )
            fig_bar.update_layout(
                showlegend=False,
                margin=dict(l=0, r=0, t=20, b=0),
                yaxis={'categoryorder':'total ascending'}
            )
            st.plotly_chart(fig_bar, use_container_width=True, height=200)
    
    # 최근 활동 섹션
    st.markdown("### 📋 최근 활동")
    
    if scripts:
        # 최근 5개 스크립트를 테이블로 표시
        recent_scripts = sorted(scripts, key=lambda x: x.get('updated_at', ''), reverse=True)[:5]
        
        # 테이블 데이터 구성
        table_data = []
        for script in recent_scripts:
            status_emoji = {
                'script_ready': '📝',
                'video_ready': '🎥', 
                'uploaded': '✅',
                'scheduled': '⏰',
                'error': '❌'
            }.get(script['status'], '❓')
            
            # 시간 포맷팅
            updated_at = script.get('updated_at', '')
            if updated_at:
                try:
                    dt = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
                    time_str = dt.strftime("%m-%d %H:%M")
                except:
                    time_str = updated_at[:10]
            else:
                time_str = "-"
            
            table_data.append({
                "상태": status_emoji,
                "제목": script['title'][:40] + ('...' if len(script['title']) > 40 else ''),
                "업데이트": time_str,
                "ID": script['id']
            })
        
        df_recent = pd.DataFrame(table_data)
        
        # 테이블 표시
        st.dataframe(
            df_recent,
            use_container_width=True,
            hide_index=True,
            height=200
        )
    else:
        st.info("등록된 스크립트가 없습니다.")
    
    # 시스템 상태 섹션
    st.markdown("### 🔧 시스템 상태")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # API 및 YouTube 상태를 간단히 표시
        st.markdown("**연결 상태**")
        st.markdown("🟢 API 서버")
        
        youtube_status = upload_health.get("youtube_api", "unknown")
        if youtube_status == "connected":
            st.markdown("🟢 YouTube API")
            channel_info = upload_health.get("youtube_channel", {})
            if channel_info:
                st.markdown(f"📺 {channel_info.get('title', 'Unknown')[:20]}")
        elif youtube_status == "authentication_failed":
            st.markdown("🔴 YouTube 인증실패")
        else:
            st.markdown(f"🟡 YouTube {youtube_status}")
    
    with col2:
        # 설정 정보 간단히
        st.markdown("**시스템 설정**")
        max_size = upload_health.get("max_file_size_mb", "Unknown")
        st.markdown(f"📁 최대크기: {max_size}MB")
        
        allowed_formats = upload_health.get("allowed_formats", [])
        if allowed_formats:
            formats_short = ', '.join(allowed_formats[:3])
            if len(allowed_formats) > 3:
                formats_short += f" 외 {len(allowed_formats)-3}개"
            st.markdown(f"🎬 지원형식: {formats_short}")


if __name__ == "__main__":
    show_dashboard()