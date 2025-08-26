# 🙋‍♂️ React 웹 인터페이스 FAQ & 문제해결

> **자주 묻는 질문과 실전 문제해결 가이드 - React 19 + TypeScript 아키텍처**

## 📋 목차

1. [설치 및 시작](#-설치-및-시작)
2. [스크립트 관리](#-스크립트-관리)
3. [비디오 업로드](#-비디오-업로드)
4. [YouTube 업로드](#-youtube-업로드)
5. [시스템 오류](#-시스템-오류)
6. [성능 최적화](#-성능-최적화)

---

## 🚀 설치 및 시작

### Q: React 웹 인터페이스가 시작되지 않아요

**A: 다음 단계를 확인하세요**

```bash
# 1. Backend 서버 먼저 시작 (필수!)
cd backend && make run

# 2. Frontend 의존성 설치 확인
cd frontend && npm install

# 3. React 개발 서버 시작
npm run dev

# 4. 브라우저에서 http://localhost:5174 접속
```

### Q: "Module resolution failed" 또는 TypeScript 컴파일 오류가 발생해요

**A: Node.js 의존성과 경로 설정 문제입니다**

```bash
# 1. 의존성 완전 재설치
cd frontend
rm -rf node_modules package-lock.json
npm install

# 2. TypeScript 캐시 삭제
npm run build  # 컴파일 오류 확인

# 3. VSCode TypeScript 서버 재시작
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Q: 포트 5174가 이미 사용 중이라고 나와요

**A: Vite 개발 서버 포트를 변경하거나 기존 프로세스를 종료하세요**

```bash
# 기존 프로세스 종료
lsof -ti:5174 | xargs kill -9

# 또는 다른 포트로 실행
cd frontend
npm run dev -- --port 5175

# vite.config.ts에서 포트 변경 (영구적)
server: {
  port: 5175
}
```

---

## 📝 스크립트 관리

### Q: 스크립트 업로드 후 "파싱 오류"가 발생해요

**A: 스크립트 형식을 정확히 맞춰주세요**

❌ **잘못된 형식:**

```
제목: 내 비디오
설명: 비디오 설명
```

✅ **올바른 형식:**

```
=== 제목 ===
내 비디오

=== 메타데이터 ===
설명: 비디오 설명
태그: 태그1, 태그2

=== 썸네일 정보 ===
텍스트: 썸네일 텍스트
ImageFX 프롬프트: AI 프롬프트

=== 대본 ===
실제 대본 내용
```

### Q: UTF-8 인코딩 오류가 발생해요

**A: 파일 인코딩을 확인하세요**

```bash
# Windows 메모장에서 저장할 때
# 인코딩: UTF-8 선택

# VS Code에서
# 우하단 인코딩 표시 클릭 → UTF-8 선택

# 터미널에서 확인
file -bi script.md
```

### Q: 한글 제목이 깨져서 나와요

**A: 브라우저 인코딩을 확인하세요**

- F12 → Console → 오류 메시지 확인
- 브라우저 캐시 삭제: Ctrl+Shift+R (또는 Cmd+Shift+R)
- 다른 브라우저에서 테스트 (Chrome 권장)

### Q: 스크립트 삭제가 안 돼요

**A: 확인 절차를 완료하세요**

1. **🗑️ 삭제** 버튼 클릭
2. **⚠️ 정말로 삭제하시겠습니까?** 메시지 확인
3. **✅ 확실히 삭제** 버튼 클릭
4. 1-2초 후 목록에서 제거됨

---

## 🎥 비디오 업로드

### Q: "지원하지 않는 파일 형식"이라고 나와요

**A: 지원 형식을 확인하세요**

✅ **지원 형식:**

- .mp4 (권장)
- .avi
- .mov
- .mkv
- .webm

❌ **미지원 형식:**

- .wmv
- .flv
- .3gp
- .m4v

**해결책:**

```bash
# FFmpeg로 변환
ffmpeg -i input.wmv -c:v libx264 -c:a aac output.mp4
```

### Q: 8GB 제한을 초과했다고 나와요

**A: 파일 크기를 줄이세요**

```bash
# FFmpeg로 압축
ffmpeg -i large_video.mp4 -crf 28 -preset fast compressed_video.mp4

# 해상도 줄이기
ffmpeg -i input.mp4 -vf scale=1280:720 output.mp4

# 비트레이트 제한
ffmpeg -i input.mp4 -b:v 2M -b:a 128k output.mp4
```

### Q: 업로드가 중간에 멈춰요

**A: 네트워크와 시스템을 확인하세요**

- 네트워크 연결 상태 확인
- 디스크 용량 확인: `df -h`
- 메모리 사용량 확인: `free -h`
- 백엔드 로그 확인: `tail -f backend/logs/app-*.log`

### Q: "script_ready 상태 스크립트가 없습니다"라고 나와요

**A: 스크립트를 먼저 업로드하세요**

1. **📝 스크립트 관리** → **📤 업로드** 탭
2. 스크립트 업로드 완료 후
3. **🎬 업로드 관리** → **🎥 비디오 업로드**

---

## 📺 YouTube 업로드

### Q: "YouTube API 인증 실패"가 발생해요

**A: 인증을 다시 설정하세요**

```bash
# 1. 토큰 파일 삭제
rm token.pickle

# 2. credentials.json 파일 확인
ls credentials.json

# 3. 백엔드 재시작
cd backend && make run

# 4. 첫 업로드 시 브라우저에서 인증 완료
```

### Q: "일일 할당량 초과" 오류가 나와요

**A: YouTube API 할당량을 확인하세요**

- **일일 한도**: 10,000 units
- **업로드당 소모**: 1,600 units
- **하루 최대**: 약 6개 영상

**해결책:**

- 다음 날까지 대기 (할당량은 Pacific Time 자정에 리셋, 한국시간 오후 4-5시)
- Google Cloud Console에서 할당량 증가 요청

### Q: "video_ready 상태 스크립트가 없습니다"라고 나와요

**A: 비디오를 먼저 업로드하세요**

1. **🎬 업로드 관리** → **🎥 비디오 업로드**
2. 비디오 업로드 완료 후 (상태: video_ready)
3. **📺 YouTube 업로드** 탭에서 업로드

### Q: YouTube에 업로드됐는데 제목/설명이 다르게 나와요

**A: 스크립트 형식과 YouTube 제한을 확인하세요**

- **제목 제한**: 100자 (한글 기준 50자)
- **설명 제한**: 5,000 바이트
- **태그 제한**: 500자
- 특수문자가 자동으로 필터링될 수 있음

### Q: "미인증 프로젝트"라서 public 업로드가 안 돼요

**A: 프로젝트 인증 상태를 확인하세요**

- 2020년 7월 28일 이후 생성된 프로젝트는 인증 필요
- 인증 전까지는 private 모드만 가능
- Google Cloud Console → APIs & Services → OAuth consent screen → 게시 신청

---

## ⚙️ 시스템 오류

### Q: "❌ API 서버 연결 실패"가 계속 나와요

**A: 백엔드 서버 상태를 확인하세요**

```bash
# 1. 백엔드 프로세스 확인
ps aux | grep uvicorn

# 2. 포트 사용 확인
lsof -i :8000

# 3. 백엔드 재시작
cd backend
make run

# 4. 수동 시작
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Q: React 웹페이지가 로딩되지 않아요

**A: Vite 개발 서버와 네트워크를 확인하세요**

```bash
# 1. React 개발 서버 실행 확인
curl http://localhost:5174

# 2. 백엔드 API 연결 확인 
curl http://localhost:8000/health

# 3. Vite HMR(Hot Module Replacement) 확인
# 콘솔에서 "[vite] connected." 메시지 확인

# 4. 브라우저 캐시 삭제 (Ctrl+Shift+R)

# 5. CORS 에러 확인 (F12 → Console)
# Backend에서 CORS 설정 확인: origins=["http://localhost:5174"]
```

### Q: "세션 상태 오류"가 발생해요

**A: 브라우저를 새로고침하세요**

- F5 또는 Ctrl+R로 페이지 새로고침
- 심한 경우: 브라우저 완전 종료 후 재시작
- 캐시 문제: Ctrl+Shift+Delete로 캐시 삭제

### Q: 업로드 진행률이 99%에서 멈춰요

**A: 서버 처리 시간을 기다리세요**

- 대용량 파일은 처리 시간이 오래 걸림
- 백엔드 로그에서 진행 상황 확인:

```bash
tail -f backend/logs/app-$(date +%Y-%m-%d).log
```

- 5분 이상 멈춰있으면 페이지 새로고침

---

## ⚡ 성능 최적화

### Q: 페이지 로딩이 너무 느려요

**A: 다음 최적화를 적용하세요**

**브라우저 최적화:**

- Chrome 브라우저 사용 권장
- 불필요한 확장 프로그램 비활성화
- 브라우저 캐시 정리

**시스템 최적화:**

```bash
# 메모리 사용량 확인
free -h

# 불필요한 프로세스 종료
top

# 디스크 공간 확인
df -h
```

### Q: 대용량 파일 업로드가 자주 실패해요

**A: 업로드 설정을 조정하세요**

**분할 업로드:**

```bash
# 파일을 작은 조각으로 나누어 업로드
split -b 1G large_video.mp4 video_part_
```

**네트워크 최적화:**

- 유선 연결 사용
- 다른 네트워크 활동 최소화
- 업로드 시간대 조정 (밤 시간 권장)

### Q: 여러 스크립트를 동시에 처리하고 싶어요

**A: CLI 도구를 활용하세요**

```bash
# 배치 처리 스크립트
for script in script1.md script2.md script3.md; do
    ./quick-script $script
    sleep 5
done

# 병렬 처리 (주의: API 할당량 고려)
./quick-script script1.md &
./quick-script script2.md &
wait
```

---

## 🌐 React 웹 인터페이스 특화 FAQ

### Q: 드래그 앤 드롭이 작동하지 않아요

**A: React 컴포넌트와 파일 형식을 확인하세요**

- **지원 브라우저**: Chrome 최신 버전 권장 (React 19 완전 지원)
- **스크립트 파일**: .md 파일만 지원 (최대 10MB)
- **비디오 파일**: .mp4, .avi, .mov, .mkv, .webm (최대 8GB)
- **React Hook Form**: 드래그 앤 드롭 상태가 올바르게 업데이트되는지 확인

```bash
# 파일 확장자 확인
file my_script.md
file my_video.mp4

# 파일 크기 확인  
ls -lh my_script.md
ls -lh my_video.mp4
```

### Q: React 페이지에서 데이터가 로딩되지 않아요

**A: TanStack Query 상태와 API 연결을 확인하세요**

```bash
# 1. 백엔드 서버 상태 확인
curl http://localhost:8000/health

# 2. React 콘솔에서 TanStack Query 상태 확인
# F12 → Console → TanStack Query DevTools 활성화

# 3. API 요청 실패 확인
# F12 → Network 탭 → 5174→8000 CORS 요청 확인

# 4. Zustand 상태 관리 확인
# Redux DevTools Extension으로 상태 변화 모니터링
```

### Q: 배치 업로드가 중간에 멈춰요

**A: API 할당량과 파일 검증을 확인하세요**

- **최대 배치 크기**: 5개 영상 동시
- **업로드 간격**: 30-300초 설정 권장
- **할당량 체크**: 일일 10,000 units 고려

```bash
# 현재 상태 확인
./youtube-cli status

# 실패한 업로드 재시도
./youtube-cli youtube upload [SCRIPT_ID] --privacy private
```

### Q: 실시간 새로고침이 작동하지 않아요

**A: 네트워크 연결과 API 응답을 확인하세요**

1. **🔄 새로고침 버튼** 수동 클릭
2. **F5**로 페이지 전체 새로고침
3. **시크릿 모드**에서 테스트
4. **다른 브라우저**에서 테스트

### Q: React에서 업로드한 파일을 CLI에서 볼 수 없어요

**A: 완전히 정상입니다! WebSocket 실시간 동기화됩니다**

```bash
# React에서 스크립트 업로드 후
./youtube-cli script list  # 즉시 확인 가능

# CLI에서 비디오 업로드 후  
# React 웹에서 WebSocket을 통해 자동 업데이트 또는 🔄 새로고침
```

### Q: WebSocket 연결이 끊어져서 실시간 업데이트가 안 돼요

**A: WebSocket 연결 상태를 확인하세요**

```bash
# 1. Backend WebSocket 엔드포인트 확인
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:8000/ws/

# 2. React DevTools에서 WebSocket 상태 확인
# F12 → Console → "WebSocket connection established" 메시지 확인

# 3. 네트워크 연결 재시도
# React에서 자동 재연결 시도 (useWebSocket 훅)

# 4. CORS 및 프록시 설정 확인
# vite.config.ts에서 proxy 설정 확인
```

### Q: TypeScript 엄격 모드에서 컴파일 에러가 많이 발생해요

**A: TypeScript 5.8 엄격 설정 단계별 적용**

```bash
# 1. 기본 컴파일 에러 수정
cd frontend
npm run build  # 컴파일 에러 목록 확인

# 2. 타입 정의 파일 확인
# src/types/ 폴더에서 올바른 타입 import
import type { ScriptData, UploadStatus } from '@/types';

# 3. any 타입 사용 금지
# tsconfig.json에서 "noImplicitAny": true 활성화

# 4. 단계별 엄격 모드 적용
# "strict": true 전에 개별 옵션부터 적용
```

### Q: React 19 새로운 기능이 작동하지 않아요

**A: React 19 호환성과 최신 패턴 확인**

```bash
# 1. React 19 버전 확인
cd frontend
npm list react react-dom

# 2. React 19 새로운 훅 사용
# use() 훅, useOptimistic(), useFormStatus() 등

# 3. Suspense와 함께 데이터 패칭
# TanStack Query v5와 React 19 Suspense 통합

# 4. Server Components (향후 적용 예정)
# Next.js 15와 함께 서버 컴포넌트 지원
```

### Q: 업로드 진행률이 0%에서 변하지 않아요

**A: WebSocket 실시간 업데이트와 대용량 파일 확인**

- **WebSocket 연결**: React useWebSocket 훅에서 연결 상태 확인
- **초기 업로드**: 파일 검증 및 준비 과정 (1-2분)
- **대용량 파일**: 8GB 파일은 10-30분 소요 가능
- **진행률 업데이트**: WebSocket으로 실시간 진행률 수신

**해결책:**
```bash
# 터미널에서 실제 진행상황 확인
tail -f backend/logs/app-$(date +%Y-%m-%d).log | grep upload

# React DevTools에서 WebSocket 메시지 확인
# F12 → Console → WebSocket 메시지 로그

# CLI로 상태 확인  
./youtube-cli video status [SCRIPT_ID]
```

### Q: Vite HMR(Hot Module Replacement)이 작동하지 않아요

**A: Vite 개발 서버 설정과 파일 감시 확인**

```bash
# 1. Vite 서버 재시작
cd frontend
npm run dev

# 2. 파일 감시 권한 확인 (macOS/Linux)
# vite.config.ts에서 서버 설정 확인
server: {
  watch: {
    usePolling: true  # 파일 시스템 감시 문제 시 사용
  }
}

# 3. 브라우저 캐시 강제 새로고침
# Ctrl+Shift+R (또는 Cmd+Shift+R)

# 4. 콘솔에서 HMR 연결 상태 확인
# "[vite] connected." 메시지 확인
# "[vite] hot updated" 메시지 확인
```

### Q: npm run build 실패 또는 TypeScript 컴파일 에러

**A: 빌드 환경과 TypeScript 설정 점검**

```bash
# 1. 의존성 문제 해결
cd frontend
rm -rf node_modules package-lock.json
npm install

# 2. TypeScript 컴파일 단독 실행
npx tsc --noEmit  # 타입 체킹만 실행

# 3. Vite 빌드 세부 정보 확인
npm run build -- --verbose

# 4. 메모리 부족 시
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# 5. 빌드 결과물 확인
npm run preview  # 빌드된 파일로 프리뷰 서버 실행
```

### Q: React 컴포넌트가 예상대로 리렌더링되지 않아요

**A: React 19 Component Composition 패턴과 상태 관리 확인**

```bash
# 1. React DevTools에서 컴포넌트 트리 확인
# F12 → Components 탭 → 리렌더링 원인 확인

# 2. TanStack Query 캐시 상태 확인  
# F12 → TanStack Query DevTools → 데이터 캐싱 상태

# 3. Zustand 상태 변경 추적
# Redux DevTools Extension → 상태 변화 타임라인

# 4. Custom Hooks 의존성 배열 확인
# useEffect, useMemo, useCallback의 의존성 배열 점검

# 5. React Strict Mode 영향 확인
# 개발 모드에서 컴포넌트 이중 렌더링 정상 동작
```

---

## 🔍 디버깅 팁

### 로그 확인 방법

```bash
# 실시간 로그 모니터링
tail -f backend/logs/app-$(date +%Y-%m-%d).log

# 에러 로그만 확인
tail -f backend/logs/error-$(date +%Y-%m-%d).log | grep ERROR

# 특정 스크립트 ID 관련 로그
grep "script_id.*123" backend/logs/app-*.log
```

### React 개발자 도구 활용

1. **F12** → **Console** 탭
2. **React DevTools** 확장 프로그램 설치 및 활용
3. **TanStack Query DevTools**: 서버 상태 및 캐시 확인
4. **Zustand DevTools**: 클라이언트 상태 관리 디버깅
5. **Network** 탭에서 API 요청 실패 확인 (5174→8000 CORS)
6. **WebSocket** 탭에서 실시간 연결 상태 확인
7. **Sources** 탭에서 TypeScript 소스맵 디버깅

### 데이터베이스 직접 확인

```bash
# SQLite 데이터베이스 접속
sqlite3 backend/app.db

# 스크립트 목록 확인
SELECT id, title, status FROM scripts ORDER BY created_at DESC LIMIT 10;

# 특정 스크립트 상세 정보
SELECT * FROM scripts WHERE id = 1;
```

---

## 📞 추가 도움이 필요하다면

### 문서 참조

- 📖 **USER_GUIDE.md**: React 웹 인터페이스 완전한 사용법  
- ⚡ **QUICK_START.md**: 5분 빠른 시작
- 💻 **CLI_USAGE.md**: 명령줄 도구 및 React 호환성
- 🔌 **API.md**: REST API + WebSocket 통합
- 🏗️ **CLAUDE.md**: React 19 + TypeScript 시스템 구조

### 문제 보고

- 에러 메시지 전체 복사
- 재현 단계 상세히 기록
- 시스템 환경 정보 (OS, Python 버전 등)
- 로그 파일 첨부

### 긴급 해결책

```bash
# 완전 초기화 (주의: 모든 데이터 삭제)
rm backend/app.db
rm token.pickle
cd backend && make migrate
```

---

*💡 **팁**: 문제가 해결되지 않을 때는 다음을 시도하세요:*
- *브라우저 시크릿 모드에서 테스트 (캐시 문제 해결)*
- *Vite 개발 서버 재시작: Ctrl+C 후 npm run dev*
- *Backend 서버 재시작: cd backend && make run*
- *React DevTools와 TanStack Query DevTools로 상태 확인*
- *WebSocket 연결 상태 확인 (F12 → Network → WS)*

---

**FAQ & 문제해결 가이드**  
**마지막 업데이트**: 2025-08-26  
**React 19 + TypeScript 웹 인터페이스**: 완전 지원 ✅
