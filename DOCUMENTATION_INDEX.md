# 📚 YouTube 자동화 시스템 문서 총 가이드

> **모든 문서와 가이드가 한 곳에! 필요한 정보를 빠르게 찾아보세요.**

## 🎯 상황별 문서 선택 가이드

### 🚀 **처음 사용하시나요?**
1. 📖 [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) - **5분만에 시작하기**
2. 🎬 [STREAMLIT_USER_GUIDE.md](./STREAMLIT_USER_GUIDE.md) - **완전한 사용법**

### 🔧 **문제가 생겼나요?**
1. 🙋‍♂️ [STREAMLIT_FAQ.md](./STREAMLIT_FAQ.md) - **자주 묻는 질문과 해결책**
2. 🔍 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - **심화 문제 해결**

### 💻 **개발자이신가요?**
1. 🏗️ [CLAUDE.md](./CLAUDE.md) - **전체 시스템 구조**
2. ⌨️ [CLI_USAGE.md](./CLI_USAGE.md) - **명령줄 도구**

### 🎊 **시스템 완성도를 확인하고 싶으신가요?**
1. ✅ [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - **구현 완료 보고서**
2. 🚀 [DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md) - **배포 준비 상태**

---

## 📋 전체 문서 목록

### 🎬 **Streamlit 대시보드 관련**
| 문서 | 설명 | 대상 사용자 | 예상 시간 |
|------|------|------------|----------|
| [STREAMLIT_USER_GUIDE.md](./STREAMLIT_USER_GUIDE.md) | 💎 **완전한 사용법 가이드** | 모든 사용자 | 15분 |
| [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) | ⚡ **5분 빠른 시작** | 신규 사용자 | 5분 |
| [STREAMLIT_FAQ.md](./STREAMLIT_FAQ.md) | 🙋‍♂️ **FAQ & 문제해결** | 문제 해결 | 상황별 |
| [streamlit_app/README.md](./streamlit_app/README.md) | 📘 **기술 문서** | 개발자 | 10분 |

### 🛠️ **시스템 & 개발**
| 문서 | 설명 | 대상 사용자 | 예상 시간 |
|------|------|------------|----------|
| [CLAUDE.md](./CLAUDE.md) | 🏗️ **전체 시스템 구조** | 개발자 | 30분 |
| [CLI_USAGE.md](./CLI_USAGE.md) | ⌨️ **명령줄 도구** | 파워유저/개발자 | 10분 |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 🔧 **심화 문제해결** | 고급 사용자 | 상황별 |

### 📊 **프로젝트 상태**
| 문서 | 설명 | 대상 사용자 | 예상 시간 |
|------|------|------------|----------|
| [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) | ✅ **구현 완료 보고서** | PM/검토자 | 10분 |
| [DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md) | 🚀 **배포 준비 완료** | 운영팀 | 5분 |
| [STREAMLIT_GUIDE.md](./STREAMLIT_GUIDE.md) | 📋 **기술 구현 가이드** | 개발자 | 15분 |
| [USER_GUIDE.md](./USER_GUIDE.md) | 👤 **일반 사용자 가이드** | 최종 사용자 | 10분 |

---

## 🎯 사용 시나리오별 권장 읽기 순서

### 📱 **신규 사용자 (처음 시작)**
```
1. QUICK_START_GUIDE.md (필수)
   ↓
2. STREAMLIT_USER_GUIDE.md (권장)
   ↓
3. 필요시 STREAMLIT_FAQ.md (참조)
```

### 🔧 **문제 해결이 필요한 경우**
```
1. STREAMLIT_FAQ.md (먼저 확인)
   ↓
2. 해결 안 되면 TROUBLESHOOTING.md
   ↓
3. 여전히 안 되면 CLAUDE.md에서 시스템 구조 파악
```

### 💻 **개발자/고급 사용자**
```
1. CLAUDE.md (시스템 이해)
   ↓
2. CLI_USAGE.md (도구 활용)
   ↓
3. STREAMLIT_USER_GUIDE.md (UI 기능)
   ↓
4. streamlit_app/README.md (기술 세부사항)
```

### 📊 **프로젝트 검토자/PM**
```
1. IMPLEMENTATION_COMPLETE.md (완성도 확인)
   ↓
2. DEPLOYMENT_READY.md (운영 준비도)
   ↓
3. QUICK_START_GUIDE.md (사용성 테스트)
```

---

## 🔍 기능별 문서 찾기

### 📝 **스크립트 관리**
- **기본 사용법**: STREAMLIT_USER_GUIDE.md > 스크립트 관리
- **형식 오류**: STREAMLIT_FAQ.md > 스크립트 관리
- **CLI 도구**: CLI_USAGE.md > 스크립트 명령어
- **파싱 로직**: CLAUDE.md > 스크립트 파서

### 🎥 **비디오 업로드**
- **기본 사용법**: STREAMLIT_USER_GUIDE.md > 업로드 관리
- **파일 형식 문제**: STREAMLIT_FAQ.md > 비디오 업로드
- **대용량 파일**: STREAMLIT_FAQ.md > 성능 최적화
- **백엔드 구조**: CLAUDE.md > 업로드 서비스

### 📺 **YouTube 업로드**
- **기본 사용법**: STREAMLIT_USER_GUIDE.md > YouTube 업로드
- **인증 문제**: STREAMLIT_FAQ.md > YouTube 업로드
- **할당량 관리**: STREAMLIT_FAQ.md > API 제한
- **API 구조**: CLAUDE.md > YouTube 서비스

### 📊 **모니터링 & 대시보드**
- **대시보드 사용법**: STREAMLIT_USER_GUIDE.md > 대시보드
- **상태 확인**: QUICK_START_GUIDE.md > 완료 확인
- **시스템 상태**: STREAMLIT_FAQ.md > 시스템 오류
- **WebSocket**: CLAUDE.md > 실시간 기능

---

## 🛠️ 개발 환경별 가이드

### 🐍 **Python/Backend 개발**
```
📖 CLAUDE.md (필수)
   → Backend Architecture
   → Development Commands  
   → Testing Structure

📘 streamlit_app/README.md
   → Streamlit 컴포넌트 구조
```

### 🎨 **Frontend/UI 개발**
```
📖 STREAMLIT_USER_GUIDE.md
   → 모든 UI 기능 이해

📘 streamlit_app/README.md  
   → 컴포넌트 재사용 방법
   → CSS 커스터마이징
```

### ⚙️ **DevOps/배포**
```
📖 DEPLOYMENT_READY.md (필수)
   → 배포 체크리스트
   → 환경 설정

📖 CLAUDE.md
   → 시스템 아키텍처
   → 의존성 관리
```

### 🧪 **QA/테스트**
```
📖 QUICK_START_GUIDE.md
   → 기본 기능 테스트

📖 STREAMLIT_USER_GUIDE.md
   → 전체 기능 테스트

📖 STREAMLIT_FAQ.md  
   → 오류 시나리오 테스트
```

---

## 📱 스크린샷 및 미디어

### 📸 **사용법 스크린샷** (`docs/screenshots/`)
- `01_dashboard_overview.png` - 대시보드 전체
- `02_dashboard_system_status.png` - 시스템 상태
- `03_script_management_upload.png` - 스크립트 업로드
- `04_script_direct_input.png` - 직접 입력 모드
- `05_script_management_list.png` - 스크립트 목록
- `06_upload_management_video.png` - 비디오 업로드  
- `07_upload_management_youtube.png` - YouTube 업로드

### 🎬 **테스트 결과**
- `streamlit_basic_test.png` - 기본 기능 테스트
- `streamlit_test_complete.png` - 전체 테스트 완료

---

## 🆘 긴급 도움말

### 🔥 **즉시 해결이 필요한 문제**
1. **앱이 실행되지 않음**: STREAMLIT_FAQ.md > 설치 및 시작
2. **업로드 실패**: STREAMLIT_FAQ.md > 비디오 업로드  
3. **YouTube 인증 오류**: STREAMLIT_FAQ.md > YouTube 업로드
4. **API 연결 실패**: STREAMLIT_FAQ.md > 시스템 오류

### 📞 **단계별 디버깅**
```bash
# 1. 로그 확인
tail -f backend/logs/app-$(date +%Y-%m-%d).log

# 2. 시스템 상태 확인  
curl http://localhost:8000/health

# 3. 브라우저 개발자 도구 (F12)
# 4. STREAMLIT_FAQ.md 해당 섹션 참조
```

---

## 📈 문서 업데이트 히스토리

| 날짜 | 문서 | 변경사항 |
|------|------|----------|
| 2025-08-17 | STREAMLIT_USER_GUIDE.md | 최초 작성 - 완전한 사용법 |
| 2025-08-17 | QUICK_START_GUIDE.md | 5분 빠른 시작 가이드 |
| 2025-08-17 | STREAMLIT_FAQ.md | FAQ와 문제해결 모음 |
| 2025-08-17 | DOCUMENTATION_INDEX.md | 문서 총 인덱스 |

---

## 🎉 시작하세요!

**처음 사용하시나요?** → [⚡ QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)에서 5분만에 시작하세요!

**문제가 있으신가요?** → [🙋‍♂️ STREAMLIT_FAQ.md](./STREAMLIT_FAQ.md)에서 해결책을 찾아보세요!

**전체 기능을 알고 싶으신가요?** → [📖 STREAMLIT_USER_GUIDE.md](./STREAMLIT_USER_GUIDE.md)에서 모든 것을 배워보세요!

---

*🚀 YouTube 자동화 시스템과 함께 효율적인 콘텐츠 제작 여정을 시작하세요!*