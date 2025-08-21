# 🙋‍♂️ Gradio 웹 인터페이스 FAQ & 문제해결

> **자주 묻는 질문과 실전 문제해결 가이드**

## 📋 목차

1. [설치 및 시작](#-설치-및-시작)
2. [스크립트 관리](#-스크립트-관리)
3. [비디오 업로드](#-비디오-업로드)
4. [YouTube 업로드](#-youtube-업로드)
5. [시스템 오류](#-시스템-오류)
6. [성능 최적화](#-성능-최적화)

---

## 🚀 설치 및 시작

### Q: Gradio 웹 인터페이스가 시작되지 않아요

**A: 다음 단계를 확인하세요**

```bash
# 1. 가상환경 활성화 확인
poetry shell

# 2. 의존성 설치 확인
poetry install

# 3. 백엔드 서버 먼저 시작 (필수!)
cd backend && make run

# 4. Gradio 웹 인터페이스 시작
poetry run python gradio_app.py
```

### Q: "ModuleNotFoundError" 오류가 발생해요

**A: Python 경로 문제입니다**

```bash
# 프로젝트 루트에서 실행하세요
cd /path/to/youtube-upload-automation
poetry run python gradio_app.py

# 또는 절대 경로 사용
PYTHONPATH=/path/to/project poetry run python gradio_app.py
```

### Q: 포트 7860이 이미 사용 중이라고 나와요

**A: Gradio가 자동으로 다른 포트를 찾거나 수동 설정하세요**

```bash
# Gradio는 자동으로 다음 사용 가능한 포트 찾음 (7861, 7862 등)
poetry run python gradio_app.py

# 또는 기존 프로세스 종료
lsof -ti:7860 | xargs kill -9

# 특정 포트로 실행하려면 코드 수정 필요
# gradio_app.py에서 demo.launch(server_port=7861)
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
file -bi script.txt
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

### Q: Gradio 웹페이지가 로딩되지 않아요

**A: 네트워크와 브라우저를 확인하세요**

```bash
# 1. Gradio 서버 실행 확인
curl http://localhost:7860

# 2. 백엔드 API 연결 확인 
curl http://localhost:8000/health

# 3. 브라우저 캐시 삭제
# Ctrl+Shift+R (또는 Cmd+Shift+R)

# 4. 시크릿/프라이빗 모드에서 테스트

# 5. 다른 포트로 Gradio 실행 (코드 수정 필요)
# gradio_app.py에서 demo.launch(server_port=7861)
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
for script in script1.txt script2.txt script3.txt; do
    ./quick-script $script
    sleep 5
done

# 병렬 처리 (주의: API 할당량 고려)
./quick-script script1.txt &
./quick-script script2.txt &
wait
```

---

## 🌐 Gradio 웹 인터페이스 특화 FAQ

### Q: 드래그 앤 드롭이 작동하지 않아요

**A: 브라우저와 파일 형식을 확인하세요**

- **지원 브라우저**: Chrome, Firefox, Safari, Edge 최신 버전
- **스크립트 파일**: .md 파일만 지원 (최대 10MB)
- **비디오 파일**: .mp4, .avi, .mov, .mkv, .webm (최대 8GB)

```bash
# 파일 확장자 확인
file my_script.md
file my_video.mp4

# 파일 크기 확인  
ls -lh my_script.md
ls -lh my_video.mp4
```

### Q: 4개 탭 중 일부가 비어있어요

**A: 백엔드 API 연결을 확인하세요**

```bash
# 1. 백엔드 서버 상태 확인
curl http://localhost:8000/health

# 2. Gradio 콘솔에서 오류 메시지 확인
# 터미널에서 gradio_app.py 실행한 곳에서 에러 로그 확인

# 3. 브라우저 개발자 도구에서 API 요청 실패 확인
# F12 → Network 탭 → 실패한 요청 확인
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

### Q: Gradio에서 업로드한 파일을 CLI에서 볼 수 없어요

**A: 완전히 정상입니다! 실시간 동기화됩니다**

```bash
# Gradio에서 스크립트 업로드 후
./youtube-cli script list  # 즉시 확인 가능

# CLI에서 비디오 업로드 후  
# Gradio 웹에서 🔄 새로고침 버튼 클릭하면 즉시 확인 가능
```

### Q: 업로드 진행률이 0%에서 변하지 않아요

**A: 대용량 파일 업로드 시 정상입니다**

- **초기 업로드**: 파일 검증 및 준비 과정 (1-2분)
- **대용량 파일**: 8GB 파일은 10-30분 소요 가능
- **네트워크 속도**: 업로드 속도에 따라 진행률 업데이트

**해결책:**
```bash
# 터미널에서 실제 진행상황 확인
tail -f backend/logs/app-$(date +%Y-%m-%d).log | grep upload

# CLI로 상태 확인  
./youtube-cli video status [SCRIPT_ID]
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

### 개발자 도구 활용

1. **F12** → **Console** 탭
2. 에러 메시지 확인
3. **Network** 탭에서 API 요청 실패 확인
4. 응답 상태 코드 확인 (200, 404, 500 등)

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

- 📖 **USER_GUIDE.md**: Gradio 완전한 사용법  
- ⚡ **QUICK_START.md**: 5분 빠른 시작
- 💻 **CLI_USAGE.md**: 명령줄 도구 및 Gradio 호환성
- 🔌 **API.md**: REST API 및 Gradio 통합
- 🏗️ **CLAUDE.md**: 전체 시스템 구조

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

*💡 **팁**: 문제가 해결되지 않을 때는 브라우저 시크릿 모드에서 테스트해보세요. 대부분의 캐시 관련 문제가 해결됩니다.*

---

**FAQ & 문제해결 가이드**  
**마지막 업데이트**: 2025-08-22  
**Gradio 웹 인터페이스**: 완전 지원 ✅
