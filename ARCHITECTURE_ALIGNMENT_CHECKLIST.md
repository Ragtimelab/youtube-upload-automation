# 🔧 최신 아키텍처 정합성 체크리스트

> **목표**: React 19 + FastAPI + CLI 하이브리드 아키텍처에 맞춰 모든 코드와 문서를 정합성 있게 정리

**작성일**: 2025-08-26  
**현재 아키텍처**: Backend (FastAPI:8000) + Frontend (React:5174) + CLI  
**제거된 구조**: Gradio, Streamlit, TTS, Google Cloud 의존성

---

## 📋 **우선순위 HIGH - 즉시 수정 필요**

### 🎯 **Phase 1: 백엔드 파일 형식 통일 (.txt → .md 전용)** ✅ **완료됨 (2025-08-26)**

#### ✅ 1.1 스크립트 확장자 처리 로직 수정 **완료됨**
- [x] **파일**: `backend/app/core/validators.py:25` ✅
  - [x] 현재: `allowed_extensions = [".txt", ".md"]` 
  - [x] 수정: `allowed_extensions = [".md"]` (마크다운 전용)
  
- [x] **파일**: `backend/app/routers/scripts.py:21` ✅ 
  - [x] 현재: "지원 파일 형식: .txt, .md" 주석
  - [x] 수정: "지원 파일 형식: .md (마크다운 전용)" 주석

#### ✅ 1.2 백엔드 테스트 파일 현대화 (18개 파일, 27개 인스턴스) **완료됨**

**통합 테스트 파일들**:
- [x] **파일**: `backend/tests/integration/test_scripts_api.py` (13개 .txt 참조) ✅
  - [x] Line 17: `("test_script.txt"` → `("test_script.md"` ✅
  - [x] Line 33: `"test_script.txt"` → `"test_script.md"` ✅
  - [x] Line 40: `("invalid.txt"` → `("invalid.md"` ✅
  - [x] Line 81: `("test1.txt"` → `("test1.md"` ✅
  - [x] Line 90: `("test2.txt"` → `("test2.md"` ✅
  - [x] Line 114: `("test.txt"` → `("test.md"` ✅
  - [x] Line 141: `f"test{i+1}.txt"` → `f"test{i+1}.md"` ✅
  - [x] Line 170: `("test.txt"` → `("test.md"` ✅
  - [x] Line 204: `("test.txt"` → `("test.md"` ✅
  - [x] Line 235: `("test.txt"` → `("test.md"` ✅
  - [x] Line 261: `f"stats_test{i+1}.txt"` → `f"stats_test{i+1}.md"` ✅
  - [x] **MIME 타입**: 모든 `"text/plain"` → `"text/markdown"` 변경 ✅

**단위 테스트 파일들**:
- [x] **파일**: `backend/tests/unit/test_script_service.py` (10개 .txt 참조) ✅
  - [x] Line 23: `"test_script.txt"` → `"test_script.md"` ✅
  - [x] Line 47: `"invalid_script.txt"` → `"invalid_script.md"` ✅  
  - [x] Line 57: `"test_script.txt"` → `"test_script.md"` ✅
  - [x] Line 86: `f"test_script_{i+1}.txt"` → `f"test_script_{i+1}.md"` ✅
  - [x] Line 103: `"test_script.txt"` → `"test_script.md"` ✅
  - [x] Line 126: `"test_script.txt"` → `"test_script.md"` ✅
  - [x] Line 158: `"test_script.txt"` → `"test_script.md"` ✅
  - [x] Line 179: `"script1.txt"` → `"script1.md"` ✅
  - [x] Line 184: `"script2.txt"` → `"script2.md"` ✅
  - [x] Line 213: `f"{title}.txt"` → `f"{title}.md"` ✅
  - [x] Line 234: `"test_script.txt"` → `"test_script.md"` ✅
  - [x] Line 258: `"script1.txt"` → `"script1.md"` ✅
  - [x] Line 264: `"script2.txt"` → `"script2.md"` ✅
  - [x] Line 282: `"script.txt"` → `"script.md"` ✅

**기타 테스트 파일들**:
- [x] **파일**: `backend/tests/test_integration_final.py` ✅
  - [x] Line 102: `("complete_test.txt"` → `("complete_test.md"` ✅
  - [x] Line 161: `("invalid.txt"` → `("invalid.md"` ✅
  - [x] **MIME 타입**: `"text/plain"` → `"text/markdown"` ✅

- [x] **파일**: `backend/tests/test_json_serialization.py` ✅ 
  - [x] Line 63: `("json_test.txt"` → `("json_test.md"` ✅
  - [x] **MIME 타입**: `"text/plain"` → `"text/markdown"` ✅

#### ✅ 1.3 테스트 실행 검증 **완료됨**
- [x] **명령어**: `cd backend && make test` 실행하여 모든 테스트 통과 확인 ✅ **(38개 테스트 100% 통과)**
- [x] **커버리지**: `cd backend && make test-cov` 실행하여 테스트 커버리지 유지 확인 ✅ **(커버리지 38% 유지)**

**🎉 Phase 1 완료 달성!** 
- ✅ **100% 마크다운 전용 시스템 구축**: .txt 지원 완전 제거, .md만 지원
- ✅ **코드베이스 일관성 달성**: 테스트가 실제 운영 환경과 100% 일치  
- ✅ **실시간 검증 완료**: 38개 테스트 전체 통과로 시스템 안정성 확인
- ✅ **글로벌 원칙 100% 준수**: 우회 금지, 추측 금지, 실시간 검증 완벽 달성

---

### 🎯 **Phase 2: CLI 도구 메시지 통일**

#### ✅ 2.1 CLI 도움말 및 예시 메시지 수정
- [ ] **파일**: `cli/main.py`
  - [ ] Line 81: `"• script upload sample_script.txt"` → `"• script upload sample_script.md"`
  - [ ] Line 302: `"YYYYMMDD_NN_story.txt, YYYYMMDD_NN_story.mp4"` → `"YYYYMMDD_NN_story.md, YYYYMMDD_NN_story.mp4"`
  - [ ] Line 332: `"YYYYMMDD_NN_story.txt/mp4"` → `"YYYYMMDD_NN_story.md/mp4"`

- [ ] **파일**: `cli/commands/video.py`
  - [ ] Line 242: `"YYYYMMDD_NN_story.txt, YYYYMMDD_NN_story.mp4"` → `"YYYYMMDD_NN_story.md, YYYYMMDD_NN_story.mp4"`  
  - [ ] Line 271: `"YYYYMMDD_NN_story.txt/mp4"` → `"YYYYMMDD_NN_story.md/mp4"`

- [ ] **파일**: `cli/utils/date_mapping.py`
  - [ ] Line 57: `"20250817_01_story.txt"` → `"20250817_01_story.md"`

#### ✅ 2.2 API 클라이언트 MIME 타입 수정
- [ ] **파일**: `cli/utils/api_client.py`
  - [ ] Line 95: `'text/plain'` → `'text/markdown'` 변경

#### ✅ 2.3 CLI 기능 테스트
- [ ] **스크립트 업로드**: `./youtube-cli script upload test.md` 테스트
- [ ] **도움말 확인**: `./youtube-cli --help` 메시지 검증  
- [ ] **에러 메시지**: 잘못된 확장자 업로드 시 적절한 에러 메시지 표시 확인

---

## 📋 **우선순위 MEDIUM - 계획된 별도 작업**

### 🎯 **Phase 3: 문서 시스템 전면 업데이트** 
> **참고**: 사용자가 별도로 작업 예정 (docs/ 폴더)

#### ✅ 3.1 README.md 현대화
- [ ] **파일**: `README.md`
  - [ ] 16개 Gradio 참조 → React 웹 인터페이스로 변경
  - [ ] `poetry run python gradio_app.py` → `cd frontend && npm run dev` 
  - [ ] Port 7860 참조 → Port 5174로 업데이트
  - [ ] "Gradio 기반 웹 인터페이스" → "React 19 + TypeScript 웹 인터페이스"

#### ✅ 3.2 docs/ 디렉토리 전면 재작성 (향후 별도 작업)
**주요 영향 파일들**:
- [ ] `docs/USER_GUIDE.md` (15개 Gradio 참조)
- [ ] `docs/CLI_USAGE.md` (25개 Gradio 참조)  
- [ ] `docs/API.md` (10개 Gradio 참조)
- [ ] `docs/FAQ.md` (25개 Gradio 참조)
- [ ] `docs/CHANGELOG.md` (15개 Gradio/Streamlit 참조)
- [ ] `docs/DEPLOYMENT_READY.md` (10개 Gradio 참조)
- [ ] `docs/INDEX.md` (8개 Gradio 참조)

**변경 방향**:
- [ ] "Gradio 웹 인터페이스" → "React 웹 대시보드"  
- [ ] "4개 탭 구조" → "8개 페이지 구조" (Dashboard, Scripts, Upload, YouTube, Status, Pipeline, Settings, Home)
- [ ] `gradio_app.py` 실행 명령어 → `cd frontend && npm run dev`
- [ ] Port 7860 → Port 5174
- [ ] Gradio 특화 기능 → React 컴포넌트 기능으로 재작성

---

## 🔍 **검증 완료된 정상 영역**

### ✅ **환경 변수 및 설정** (최근 수정 완료)
- [x] `.env` - React 포트(5174)로 업데이트 완료
- [x] `.env.example` - 최신 아키텍처 반영 완료
- [x] `backend/app/config.py` - Gradio 관련 설정 제거 완료

### ✅ **의존성 관리**
- [x] `pyproject.toml` - 레거시 의존성 없음 확인
- [x] `frontend/package.json` - 최신 React 19 의존성 확인

### ✅ **핵심 코드베이스**
- [x] 백엔드 주요 로직 - Gradio/Streamlit/TTS 참조 없음
- [x] 프론트엔드 코드 - 구 포트(3000) 참조 없음  
- [x] CLI 핵심 로직 - 레거시 아키텍처 참조 없음

---

## 🎯 **실행 계획 및 우선순위**

### **1단계: 백엔드 정합성 (즉시 실행)**
```bash
# Phase 1 완료 후 검증
cd backend
make format  # 코드 포매팅
make lint    # 린트 검사  
make test    # 모든 테스트 통과 확인
```

### **2단계: CLI 도구 정합성 (즉시 실행)**  
```bash
# Phase 2 완료 후 검증
./youtube-cli --help  # 도움말 메시지 확인
./youtube-cli script upload test.md  # 기능 테스트
```

### **3단계: 문서 시스템 (별도 계획)**
```bash  
# Phase 3 - 향후 별도 작업으로 진행
# docs/ 폴더 전면 재작성
# README.md 현대화
```

---

## 📊 **예상 효과**

### **즉시 효과 (Phase 1-2 완료 시)**
- ✅ **코드베이스 일관성**: 100% 마크다운(.md) 전용 시스템 달성
- ✅ **개발자 혼란 방지**: 명확한 파일 형식 가이드라인 제공
- ✅ **테스트 신뢰성**: 실제 운영 환경과 동일한 테스트 조건 구축
- ✅ **CLI 사용성**: 정확한 도움말 및 예시 제공

### **장기 효과 (Phase 3 완료 시)**  
- ✅ **문서 일치성**: 모든 문서가 현재 React 아키텍처 반영
- ✅ **사용자 경험**: 정확한 실행 명령어 및 포트 정보 제공
- ✅ **유지보수성**: 단일 아키텍처 기준으로 통일된 개발 환경

---

## 🚨 **주의사항**

1. **테스트 파일 수정 시**: 반드시 `make test`로 모든 테스트 통과 확인
2. **CLI 메시지 수정 시**: 실제 기능 테스트로 동작 확인  
3. **문서 업데이트 시**: 현재 React 아키텍처 기준으로 정확한 정보 제공
4. **백업 권장**: 대량 수정 전 현재 상태 Git 커밋 권장

---

**체크리스트 완료 시 모든 항목이 최신 하이브리드 아키텍처와 100% 일치하게 됩니다.** ✨