# YouTube 자동화 대시보드

1인 개발자를 위한 실무표준 Streamlit 대시보드

## 🚀 실행 방법

```bash
# 프로젝트 루트에서
streamlit run streamlit_app/app.py

# 또는 포트 지정
streamlit run streamlit_app/app.py --server.port 8501
```

## 📁 파일 구조

```
streamlit_app/
├── app.py                 # 메인 애플리케이션
├── config.py             # 설정 관리
├── components/           # 재사용 컴포넌트
│   ├── __init__.py
│   ├── api_client.py     # API 클라이언트
│   ├── ui_components.py  # UI 컴포넌트
│   └── data_utils.py     # 데이터 처리 유틸
└── assets/              # 정적 자원
    └── styles.css       # CSS 스타일
```

## 🎯 주요 기능

### 📊 대시보드
- 시스템 상태 모니터링
- 스크립트 통계 표시
- 상태별 차트
- 최근 활동 내역

### 📝 스크립트 관리
- 파일 업로드 (txt, md)
- 직접 입력
- 스크립트 목록 관리
- 검색 및 필터링
- 스크립트 삭제

### 🎬 업로드 관리
- 비디오 파일 업로드 (mp4, avi, mov, mkv, webm)
- YouTube 업로드
- 공개 설정 (private, unlisted, public)
- 카테고리 선택
- 진행률 표시

## 🛠️ 기술 스택

- **Streamlit**: 웹 인터페이스
- **Plotly**: 차트 및 시각화
- **Pandas**: 데이터 처리
- **Requests**: API 통신

## ⚙️ 설정

### 환경 변수
```bash
# API 서버 설정
API_BASE_URL=http://localhost:8000
API_TIMEOUT=30
```

### config.py 주요 설정
- `MAX_FILE_SIZE_MB`: 최대 파일 크기 (기본: 100MB)
- `ALLOWED_SCRIPT_FORMATS`: 스크립트 파일 형식
- `ALLOWED_VIDEO_FORMATS`: 비디오 파일 형식
- `STATUS_ICONS`: 상태별 아이콘
- `STATUS_COLORS`: 상태별 색상

## 🎨 디자인 특징

### 실무 중심
- 깔끔하고 직관적인 인터페이스
- 불필요한 장식 제거
- 생산성 중심 설계

### 반응형
- 다양한 화면 크기 지원
- 모바일 친화적

### 접근성
- 명확한 상태 표시
- 직관적인 아이콘
- 일관성 있는 색상 체계

## 🔧 개발자 팁

### 컴포넌트 재사용
- `ui_components.py`: UI 컴포넌트 함수들
- `data_utils.py`: 데이터 처리 함수들
- `api_client.py`: API 통신 로직

### 상태 관리
- 최소한의 session_state 사용
- 자동 새로고침 기능
- 진행률 표시

### 에러 처리
- APIError 예외 처리
- 사용자 친화적 에러 메시지
- 폼 검증

## 📈 성능 최적화

- `@st.cache_resource`로 API 클라이언트 캐싱
- 분리된 CSS 파일
- 모듈화된 컴포넌트
- 효율적인 데이터 로딩

## 🐛 문제 해결

### 일반적인 문제
1. **API 연결 실패**: backend 서버가 실행 중인지 확인
2. **파일 업로드 실패**: 파일 크기 및 형식 확인
3. **YouTube 업로드 실패**: 인증 및 할당량 확인

### 로그 확인
```bash
# Streamlit 로그는 터미널에서 확인
streamlit run streamlit_app/app.py

# Backend 로그 확인
tail -f backend/logs/app-$(date +%Y-%m-%d).log
```

## 📝 라이선스

이 프로젝트는 YouTube 업로드 자동화 시스템의 일부입니다.