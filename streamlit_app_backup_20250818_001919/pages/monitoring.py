"""
📊 시스템 모니터링 페이지

실시간 시스템 상태, 로그, WebSocket 연결 등을 모니터링하는 페이지
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import time
import json

from api.client import get_api_client, APIError


def show_monitoring_page():
    """시스템 모니터링 페이지 표시"""
    
    st.markdown("## 📊 시스템 모니터링")
    st.markdown("실시간 시스템 상태와 로그를 모니터링합니다.")
    
    # API 클라이언트
    api = get_api_client()
    
    # 탭 구성
    tab1, tab2, tab3, tab4 = st.tabs(["🔍 실시간 모니터링", "📜 로그 뷰어", "🌐 WebSocket 상태", "📈 성능 메트릭스"])
    
    # ===============================
    # 탭 1: 실시간 모니터링
    # ===============================
    
    with tab1:
        show_realtime_monitoring(api)
    
    # ===============================
    # 탭 2: 로그 뷰어
    # ===============================
    
    with tab2:
        show_log_viewer(api)
    
    # ===============================
    # 탭 3: WebSocket 상태
    # ===============================
    
    with tab3:
        show_websocket_monitoring(api)
    
    # ===============================
    # 탭 4: 성능 메트릭스
    # ===============================
    
    with tab4:
        show_performance_metrics(api)


def show_realtime_monitoring(api):
    """실시간 모니터링 표시"""
    
    st.subheader("🔍 실시간 시스템 모니터링")
    
    # 자동 새로고침 설정
    col1, col2, col3 = st.columns([2, 1, 1])
    
    with col1:
        auto_refresh = st.checkbox("자동 새로고침", value=False, key="monitoring_auto_refresh")
        if auto_refresh:
            refresh_interval = st.slider("새로고침 간격 (초)", 5, 60, 10)
    
    with col2:
        if st.button("🔄 수동 새로고침"):
            st.rerun()
    
    with col3:
        last_update = st.empty()
        last_update.text(f"업데이트: {datetime.now().strftime('%H:%M:%S')}")
    
    # 자동 새로고침 처리
    if auto_refresh:
        time.sleep(refresh_interval)
        st.rerun()
    
    st.markdown("---")
    
    try:
        # 시스템 상태 확인
        health_status = api.health_check()
        upload_health = api.get_upload_health()
        scripts_stats = api.get_script_stats()
        
        # 전체 시스템 상태
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("🖥️ 시스템 상태")
            
            # API 서버 상태
            if health_status.get("status") == "healthy":
                st.success("✅ API 서버: 정상")
            else:
                st.error(f"❌ API 서버: 오류 - {health_status.get('error', 'Unknown')}")
            
            # YouTube API 상태
            youtube_status = upload_health.get("youtube_api", "unknown")
            if youtube_status == "connected":
                st.success("✅ YouTube API: 연결됨")
            elif youtube_status == "authentication_failed":
                st.error("❌ YouTube API: 인증 실패")
            else:
                st.warning(f"⚠️ YouTube API: {youtube_status}")
            
            # 업로드 시스템 상태
            upload_system = upload_health.get("upload_system", "unknown")
            if upload_system == "operational":
                st.success("✅ 업로드 시스템: 정상")
            else:
                st.error(f"❌ 업로드 시스템: {upload_system}")
        
        with col2:
            st.subheader("📊 현재 통계")
            
            stats = scripts_stats.get("statistics", {})
            
            # 메트릭 표시
            col_a, col_b = st.columns(2)
            with col_a:
                st.metric("전체 스크립트", stats.get("total", 0))
                st.metric("비디오 준비", stats.get("video_ready", 0))
            with col_b:
                st.metric("업로드 완료", stats.get("uploaded", 0))
                st.metric("오류", stats.get("error", 0))
        
        st.markdown("---")
        
        # 활동 타임라인
        st.subheader("⏰ 최근 활동 타임라인")
        
        # 최근 스크립트 활동 조회
        recent_scripts = api.get_scripts(limit=20)
        scripts = recent_scripts.get("scripts", [])
        
        if scripts:
            # 최근 활동 순으로 정렬
            scripts.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
            
            # 활동 타임라인 표시
            for script in scripts[:10]:
                col1, col2, col3, col4 = st.columns([1, 3, 2, 1])
                
                with col1:
                    # 시간
                    updated_at = script.get('updated_at', '')
                    if updated_at:
                        try:
                            dt = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
                            time_str = dt.strftime("%H:%M")
                            st.write(f"**{time_str}**")
                        except:
                            st.write("--:--")
                    else:
                        st.write("--:--")
                
                with col2:
                    # 활동 내용
                    status_emoji = {
                        'script_ready': '📝',
                        'video_ready': '🎥',
                        'uploaded': '✅',
                        'scheduled': '⏰',
                        'error': '❌'
                    }.get(script['status'], '❓')
                    
                    activity = get_activity_message(script)
                    st.write(f"{status_emoji} {activity}")
                
                with col3:
                    # 스크립트 제목
                    title = script['title']
                    if len(title) > 30:
                        title = title[:30] + "..."
                    st.write(title)
                
                with col4:
                    # 스크립트 ID
                    st.write(f"ID: {script['id']}")
        else:
            st.info("최근 활동이 없습니다.")
        
        # 시스템 리소스 (시뮬레이션)
        st.markdown("---")
        st.subheader("💻 시스템 리소스")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            # CPU 사용률 (시뮬레이션)
            import random
            cpu_usage = random.randint(10, 40)
            st.metric("CPU 사용률", f"{cpu_usage}%")
            
            # 프로그레스 바로 시각화
            progress_color = "green" if cpu_usage < 50 else "orange" if cpu_usage < 80 else "red"
            st.progress(cpu_usage / 100)
        
        with col2:
            # 메모리 사용률 (시뮬레이션)
            memory_usage = random.randint(30, 60)
            st.metric("메모리 사용률", f"{memory_usage}%")
            st.progress(memory_usage / 100)
        
        with col3:
            # 디스크 사용률 (시뮬레이션)
            disk_usage = random.randint(20, 50)
            st.metric("디스크 사용률", f"{disk_usage}%")
            st.progress(disk_usage / 100)
    
    except APIError as e:
        st.error(f"❌ 모니터링 데이터 로드 실패: {e.message}")
    except Exception as e:
        st.error(f"❌ 예상치 못한 오류: {str(e)}")


def show_log_viewer(api):
    """로그 뷰어 표시"""
    
    st.subheader("📜 시스템 로그 뷰어")
    
    # 로그 필터 설정
    col1, col2, col3 = st.columns(3)
    
    with col1:
        log_level = st.selectbox(
            "로그 레벨",
            ["ALL", "DEBUG", "INFO", "WARNING", "ERROR"],
            index=2
        )
    
    with col2:
        log_source = st.selectbox(
            "로그 소스",
            ["ALL", "API", "Upload", "YouTube", "WebSocket"],
            index=0
        )
    
    with col3:
        max_lines = st.selectbox(
            "표시 라인 수",
            [50, 100, 200, 500],
            index=1
        )
    
    # 로그 새로고침
    if st.button("🔄 로그 새로고침"):
        st.rerun()
    
    st.markdown("---")
    
    # 로그 내용 표시 (시뮬레이션)
    st.subheader("📋 실시간 로그")
    
    # 시뮬레이션 로그 데이터 생성
    log_entries = generate_sample_logs(max_lines, log_level, log_source)
    
    # 로그 표시 컨테이너
    log_container = st.container()
    
    with log_container:
        # 로그 스타일링
        st.markdown("""
        <style>
        .log-entry {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 2px 0;
            padding: 2px;
            border-radius: 3px;
        }
        .log-debug { background-color: #f8f9fa; color: #6c757d; }
        .log-info { background-color: #d1ecf1; color: #0c5460; }
        .log-warning { background-color: #fff3cd; color: #856404; }
        .log-error { background-color: #f8d7da; color: #721c24; }
        </style>
        """, unsafe_allow_html=True)
        
        # 로그 엔트리 표시
        for entry in log_entries:
            level_class = f"log-{entry['level'].lower()}"
            
            log_html = f"""
            <div class="log-entry {level_class}">
                <span style="font-weight: bold;">{entry['timestamp']}</span> 
                <span style="color: #495057;">[{entry['level']}]</span> 
                <span style="color: #007bff;">[{entry['source']}]</span> 
                {entry['message']}
            </div>
            """
            st.markdown(log_html, unsafe_allow_html=True)
    
    # 로그 다운로드
    st.markdown("---")
    
    if st.button("📥 로그 파일 다운로드"):
        # 로그 파일을 텍스트로 변환
        log_text = "\n".join([
            f"{entry['timestamp']} [{entry['level']}] [{entry['source']}] {entry['message']}"
            for entry in log_entries
        ])
        
        st.download_button(
            label="💾 다운로드",
            data=log_text,
            file_name=f"system_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
            mime="text/plain"
        )


def show_websocket_monitoring(api):
    """WebSocket 모니터링 표시"""
    
    st.subheader("🌐 WebSocket 연결 상태")
    
    try:
        # WebSocket 통계 조회
        ws_stats = api.get_websocket_stats()
        
        # WebSocket 상태 표시
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric(
                "활성 연결",
                ws_stats.get("active_connections", 0),
                help="현재 활성화된 WebSocket 연결 수"
            )
        
        with col2:
            st.metric(
                "총 연결 수",
                ws_stats.get("total_connections", 0),
                help="시스템 시작 후 총 연결 수"
            )
        
        with col3:
            st.metric(
                "메시지 수",
                ws_stats.get("total_messages", 0),
                help="전송된 총 메시지 수"
            )
        
        st.markdown("---")
        
        # 연결별 상세 정보
        st.subheader("🔗 활성 연결 상세")
        
        connections = ws_stats.get("connections", [])
        
        if connections:
            for conn in connections:
                with st.expander(f"연결 {conn.get('connection_id', 'Unknown')[:8]}..."):
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.write(f"**연결 ID:** {conn.get('connection_id', 'Unknown')}")
                        st.write(f"**사용자 ID:** {conn.get('user_id', 'Anonymous')}")
                        st.write(f"**연결 시간:** {conn.get('connected_at', 'Unknown')}")
                    
                    with col2:
                        st.write(f"**구독 스크립트:** {len(conn.get('subscribed_scripts', []))}개")
                        st.write(f"**마지막 활동:** {conn.get('last_activity', 'Unknown')}")
                        
                        # 구독 중인 스크립트 목록
                        subscribed = conn.get('subscribed_scripts', [])
                        if subscribed:
                            st.write(f"**구독 목록:** {', '.join(map(str, subscribed))}")
        else:
            st.info("현재 활성화된 WebSocket 연결이 없습니다.")
        
        st.markdown("---")
        
        # WebSocket 테스트
        st.subheader("📡 WebSocket 테스트")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # 브로드캐스트 메시지 전송
            st.write("**시스템 브로드캐스트**")
            
            broadcast_message = st.text_input(
                "브로드캐스트 메시지",
                placeholder="시스템 알림 메시지를 입력하세요..."
            )
            
            if st.button("📢 브로드캐스트 전송"):
                if broadcast_message:
                    try:
                        result = api.broadcast_message(broadcast_message)
                        st.success("✅ 브로드캐스트 전송 완료")
                        st.write(f"전송된 연결 수: {result.get('sent_to', 0)}")
                    except APIError as e:
                        st.error(f"❌ 브로드캐스트 실패: {e.message}")
                else:
                    st.warning("메시지를 입력해주세요.")
        
        with col2:
            # 스크립트별 알림 전송
            st.write("**스크립트별 알림**")
            
            script_id = st.number_input(
                "스크립트 ID",
                min_value=1,
                value=1
            )
            
            script_message = st.text_input(
                "스크립트 알림 메시지",
                placeholder="스크립트 관련 알림 메시지..."
            )
            
            if st.button("📬 스크립트 알림 전송"):
                if script_message:
                    try:
                        result = api.notify_script(script_id, script_message)
                        st.success("✅ 스크립트 알림 전송 완료")
                        st.write(f"전송된 연결 수: {result.get('sent_to', 0)}")
                    except APIError as e:
                        st.error(f"❌ 스크립트 알림 실패: {e.message}")
                else:
                    st.warning("메시지를 입력해주세요.")
    
    except APIError as e:
        st.error(f"❌ WebSocket 상태 조회 실패: {e.message}")
    except Exception as e:
        st.error(f"❌ 예상치 못한 오류: {str(e)}")


def show_performance_metrics(api):
    """성능 메트릭스 표시"""
    
    st.subheader("📈 성능 메트릭스")
    
    # 시간 범위 선택
    time_range = st.selectbox(
        "시간 범위",
        ["최근 1시간", "최근 24시간", "최근 7일", "최근 30일"],
        index=1
    )
    
    st.markdown("---")
    
    try:
        # 성능 데이터 생성 (시뮬레이션)
        performance_data = generate_performance_data(time_range)
        
        # 차트 표시
        col1, col2 = st.columns(2)
        
        with col1:
            # API 응답 시간
            st.subheader("⚡ API 응답 시간")
            
            fig_response = px.line(
                performance_data,
                x='timestamp',
                y='response_time',
                title='평균 응답 시간 (ms)',
                labels={'response_time': '응답 시간 (ms)', 'timestamp': '시간'}
            )
            fig_response.update_traces(line_color='#FF6B35')
            st.plotly_chart(fig_response, use_container_width=True)
        
        with col2:
            # 처리량
            st.subheader("📊 요청 처리량")
            
            fig_throughput = px.bar(
                performance_data,
                x='timestamp',
                y='requests_per_minute',
                title='분당 요청 수',
                labels={'requests_per_minute': '요청/분', 'timestamp': '시간'}
            )
            fig_throughput.update_traces(marker_color='#1E90FF')
            st.plotly_chart(fig_throughput, use_container_width=True)
        
        # 오류율 및 성공률
        col1, col2 = st.columns(2)
        
        with col1:
            # 오류율
            st.subheader("❌ 오류율")
            
            fig_error = px.line(
                performance_data,
                x='timestamp',
                y='error_rate',
                title='오류율 (%)',
                labels={'error_rate': '오류율 (%)', 'timestamp': '시간'}
            )
            fig_error.update_traces(line_color='#FF4444')
            st.plotly_chart(fig_error, use_container_width=True)
        
        with col2:
            # 시스템 자원 사용률
            st.subheader("💻 자원 사용률")
            
            # 멀티라인 차트
            fig_resources = go.Figure()
            
            fig_resources.add_trace(go.Scatter(
                x=performance_data['timestamp'],
                y=performance_data['cpu_usage'],
                mode='lines',
                name='CPU (%)',
                line=dict(color='#FF6B35')
            ))
            
            fig_resources.add_trace(go.Scatter(
                x=performance_data['timestamp'],
                y=performance_data['memory_usage'],
                mode='lines',
                name='메모리 (%)',
                line=dict(color='#1E90FF')
            ))
            
            fig_resources.update_layout(
                title='시스템 자원 사용률',
                xaxis_title='시간',
                yaxis_title='사용률 (%)',
                legend=dict(x=0, y=1)
            )
            
            st.plotly_chart(fig_resources, use_container_width=True)
        
        # 상세 메트릭스 테이블
        st.markdown("---")
        st.subheader("📋 상세 메트릭스")
        
        # 요약 통계
        summary_col1, summary_col2, summary_col3, summary_col4 = st.columns(4)
        
        with summary_col1:
            avg_response = performance_data['response_time'].mean()
            st.metric("평균 응답시간", f"{avg_response:.1f}ms")
        
        with summary_col2:
            total_requests = performance_data['requests_per_minute'].sum()
            st.metric("총 요청 수", f"{total_requests:,.0f}")
        
        with summary_col3:
            avg_error_rate = performance_data['error_rate'].mean()
            st.metric("평균 오류율", f"{avg_error_rate:.2f}%")
        
        with summary_col4:
            max_cpu = performance_data['cpu_usage'].max()
            st.metric("최대 CPU 사용률", f"{max_cpu:.1f}%")
        
        # 상세 데이터 표시
        if st.checkbox("상세 데이터 표시"):
            st.dataframe(
                performance_data[['timestamp', 'response_time', 'requests_per_minute', 'error_rate']],
                use_container_width=True
            )
    
    except Exception as e:
        st.error(f"❌ 성능 메트릭스 로드 실패: {str(e)}")


def get_activity_message(script):
    """스크립트 상태에 따른 활동 메시지 생성"""
    status = script.get('status', 'unknown')
    
    messages = {
        'script_ready': '스크립트가 업로드되었습니다',
        'video_ready': '비디오 파일이 업로드되었습니다',
        'uploaded': 'YouTube 업로드가 완료되었습니다',
        'scheduled': '예약 발행이 설정되었습니다',
        'error': '처리 중 오류가 발생했습니다'
    }
    
    return messages.get(status, f'상태가 {status}로 변경되었습니다')


def generate_sample_logs(max_lines, log_level, log_source):
    """샘플 로그 데이터 생성"""
    import random
    
    levels = ["DEBUG", "INFO", "WARNING", "ERROR"]
    sources = ["API", "Upload", "YouTube", "WebSocket"]
    
    # 필터 적용
    if log_level != "ALL":
        levels = [log_level]
    
    if log_source != "ALL":
        sources = [log_source]
    
    logs = []
    base_time = datetime.now()
    
    for i in range(max_lines):
        # 시간을 역순으로 (최신이 위로)
        timestamp = (base_time - timedelta(minutes=i)).strftime("%Y-%m-%d %H:%M:%S")
        level = random.choice(levels)
        source = random.choice(sources)
        
        # 레벨별 메시지 생성
        if level == "DEBUG":
            messages = [
                "함수 호출: get_scripts()",
                "데이터베이스 쿼리 실행",
                "API 요청 파라미터 검증",
                "WebSocket 메시지 파싱"
            ]
        elif level == "INFO":
            messages = [
                "스크립트 업로드 완료: ID 123",
                "YouTube 업로드 시작: video_id abc123",
                "WebSocket 클라이언트 연결: user_456",
                "비디오 파일 처리 완료"
            ]
        elif level == "WARNING":
            messages = [
                "YouTube API 할당량 부족 경고",
                "파일 크기가 권장 크기를 초과함",
                "WebSocket 연결 재시도 중",
                "임시 파일 정리 필요"
            ]
        else:  # ERROR
            messages = [
                "YouTube 업로드 실패: 인증 오류",
                "데이터베이스 연결 실패",
                "파일 업로드 중 네트워크 오류",
                "WebSocket 연결 끊김"
            ]
        
        message = random.choice(messages)
        
        logs.append({
            'timestamp': timestamp,
            'level': level,
            'source': source,
            'message': message
        })
    
    return logs


def generate_performance_data(time_range):
    """성능 데이터 생성 (시뮬레이션)"""
    import random
    import numpy as np
    
    # 시간 범위에 따른 데이터 포인트 수
    range_config = {
        "최근 1시간": {"points": 60, "interval": "1T"},
        "최근 24시간": {"points": 144, "interval": "10T"},
        "최근 7일": {"points": 168, "interval": "1H"},
        "최근 30일": {"points": 720, "interval": "1H"}
    }
    
    config = range_config[time_range]
    
    # 시간 축 생성
    end_time = datetime.now()
    timestamps = pd.date_range(
        end=end_time,
        periods=config["points"],
        freq=config["interval"]
    )
    
    # 성능 데이터 생성
    data = []
    
    for i, ts in enumerate(timestamps):
        # 베이스 값에 노이즈 추가
        base_response_time = 150 + np.sin(i * 0.1) * 50  # 주기적 패턴
        response_time = max(50, base_response_time + random.gauss(0, 20))
        
        requests_per_minute = max(0, 100 + np.sin(i * 0.2) * 40 + random.gauss(0, 15))
        
        error_rate = max(0, 2 + np.sin(i * 0.05) * 1 + random.gauss(0, 0.5))
        
        cpu_usage = max(0, min(100, 30 + np.sin(i * 0.15) * 20 + random.gauss(0, 5)))
        memory_usage = max(0, min(100, 45 + np.sin(i * 0.1) * 15 + random.gauss(0, 3)))
        
        data.append({
            'timestamp': ts,
            'response_time': round(response_time, 1),
            'requests_per_minute': round(requests_per_minute, 0),
            'error_rate': round(error_rate, 2),
            'cpu_usage': round(cpu_usage, 1),
            'memory_usage': round(memory_usage, 1)
        })
    
    return pd.DataFrame(data)


if __name__ == "__main__":
    show_monitoring_page()