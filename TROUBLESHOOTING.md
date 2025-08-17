# 🔧 YouTube 업로드 자동화 시스템 트러블슈팅 가이드

## 🚨 긴급 문제 해결

### 1. 시스템 접속 불가
```bash
# 백엔드 서버 상태 확인
curl http://localhost:8000/health

# 프론트엔드 서버 상태 확인
curl http://localhost:5174/

# 서버 재시작
cd backend && poetry run uvicorn app.main:app --reload
cd frontend && npm run dev
```

### 2. YouTube 인증 문제
```bash
# 기존 토큰 삭제 (재인증 강제)
rm backend/secrets/token.pickle

# credentials.json 경로 확인
ls -la backend/secrets/credentials.json

# 인증 권한 재확인
# YouTube Data API v3 업로드 권한 필요
```

## 📝 대본 관련 오류

### "대본 내용이 없습니다" 오류
**원인**: 대본 파일 형식이 표준과 다름

**해결방법**:
```
=== 제목 ===
[제목 내용]

=== 메타데이터 ===
설명: [설명 내용]
태그: [태그1, 태그2, 태그3]

=== 썸네일 정보 ===
텍스트: [썸네일 텍스트]
ImageFX 프롬프트: [프롬프트]

=== 대본 ===
[실제 대본 내용]
```

**체크리스트**:
- [ ] === 구분자 정확히 사용
- [ ] 필수 섹션 모두 포함
- [ ] 파일 인코딩 UTF-8
- [ ] 파일 확장자 .txt 또는 .md

### 대본 파싱 실패
```bash
# 파일 인코딩 확인
file -I script_file.txt

# UTF-8로 변환
iconv -f original_encoding -t UTF-8 script_file.txt > converted_script.txt
```

## 🎬 영상 업로드 오류

### 파일 크기 초과 (8GB 제한)
```bash
# 파일 크기 확인
ls -lh video_file.mp4

# FFmpeg로 압축
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -vb 8M -ab 128k output.mp4
```

### 지원하지 않는 형식
**허용 형식**: .mp4 (H.264 + AAC-LC)

**변환 명령어**:
```bash
# 표준 YouTube 형식으로 변환
ffmpeg -i input.avi -c:v libx264 -c:a aac -preset slow -crf 18 output.mp4
```

### 네트워크 업로드 실패
```bash
# 네트워크 연결 테스트
ping -c 4 youtube.com

# DNS 문제 확인
nslookup youtube.com

# 재시도 (청크 크기 자동 감소)
# 시스템이 자동으로 처리하나, 수동 재시도 가능
```

## 🔑 YouTube API 문제

### 할당량 초과 (quotaExceeded)
**일일 제한**: 10,000 units
**업로드 비용**: 1,600 units per video

**대응방안**:
1. 24시간 후 재시도
2. 업로드 일정 분산
3. Google Cloud Console에서 할당량 증가 요청

### 권한 부족 (insufficientPermissions)
```bash
# 토큰 권한 확인
# - youtube.upload 권한 필요
# - youtube.readonly는 업로드 불가

# 재인증으로 해결
rm backend/secrets/token.pickle
# 시스템에서 자동으로 재인증 프롬프트 표시
```

### 미인증 프로젝트 제한
**증상**: public/unlisted 업로드 실패
**원인**: 2020년 7월 28일 이후 생성된 미인증 프로젝트

**해결**:
1. 비공개(private) 모드로만 업로드
2. Google Cloud Console에서 프로젝트 인증 신청
3. 예약 업로드는 자동으로 private 모드 설정

## 🌐 네트워크 및 연결

### WebSocket 연결 실패
```bash
# WebSocket 서버 상태 확인
curl http://localhost:8000/ws/stats

# 브라우저 콘솔 확인
# F12 → Console → WebSocket 연결 로그 확인
```

**일반적인 해결방법**:
1. 페이지 새로고침
2. 브라우저 캐시 정리
3. 방화벽/프록시 설정 확인

### API 응답 지연
```bash
# 백엔드 로그 확인
tail -f logs/app-$(date +%Y-%m-%d).log

# 데이터베이스 연결 확인
sqlite3 backend/youtube_automation.db ".schema"
```

## 💾 데이터베이스 문제

### SQLite 락 오류
```bash
# 데이터베이스 잠금 해제
fuser backend/youtube_automation.db
kill -9 [PID]

# 데이터베이스 무결성 검사
sqlite3 backend/youtube_automation.db "PRAGMA integrity_check;"
```

### 마이그레이션 실패
```bash
# 현재 마이그레이션 상태 확인
cd backend && poetry run alembic current

# 마이그레이션 강제 실행
poetry run alembic upgrade head

# 마이그레이션 롤백 (필요시)
poetry run alembic downgrade -1
```

## 🐛 개발 환경 문제

### Poetry 환경 문제
```bash
# 가상환경 재생성
poetry env remove python
poetry install

# 의존성 충돌 해결
poetry lock --no-update
poetry install
```

### Node.js/npm 문제
```bash
# 패키지 캐시 정리
npm cache clean --force

# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# TypeScript 타입 오류
npm run lint -- --fix
```

### 포트 충돌
```bash
# 포트 사용 확인
lsof -i :8000  # 백엔드
lsof -i :5174  # 프론트엔드

# 프로세스 종료
kill -9 [PID]

# 다른 포트 사용
cd backend && poetry run uvicorn app.main:app --port 8001
cd frontend && npm run dev -- --port 3001
```

## 📊 성능 최적화

### 업로드 속도 개선
1. **네트워크 최적화**
   - 안정적인 인터넷 연결 사용
   - 다른 대역폭 사용 활동 중단
   - 유선 연결 권장

2. **파일 최적화**
   - 불필요한 부분 편집 제거
   - 적절한 비트레이트 설정
   - 목적에 맞는 해상도 선택

3. **시스템 리소스**
   - 충분한 디스크 공간 확보
   - 메모리 사용량 모니터링
   - CPU 사용률 확인

### 메모리 누수 방지
```bash
# 프로세스 메모리 사용량 모니터링
ps aux | grep python
ps aux | grep node

# 로그 파일 크기 관리
du -h logs/
find logs/ -name "*.log" -mtime +30 -delete
```

## 🔍 로그 분석

### 백엔드 로그 위치
- **애플리케이션 로그**: `logs/app-YYYY-MM-DD.log`
- **에러 로그**: `logs/error-YYYY-MM-DD.log`

### 주요 로그 패턴
```bash
# 업로드 관련 로그
grep "업로드" logs/app-$(date +%Y-%m-%d).log

# 에러 로그
grep "ERROR" logs/error-$(date +%Y-%m-%d).log

# YouTube API 관련
grep "YouTube" logs/app-$(date +%Y-%m-%d).log
```

### 프론트엔드 디버깅
```javascript
// 브라우저 콘솔에서 WebSocket 상태 확인
console.log(window.WebSocket);

// 로컬 스토리지 확인
console.log(localStorage);

// API 요청 모니터링
// Network 탭에서 XHR/Fetch 요청 확인
```

## 🚀 배포 준비 체크리스트

### 환경 설정
- [ ] 환경 변수 설정 확인 (.env)
- [ ] 프로덕션 데이터베이스 구성
- [ ] 보안 인증서 설정
- [ ] 방화벽 규칙 구성

### 성능 테스트
- [ ] 대용량 파일 업로드 테스트
- [ ] 동시 사용자 부하 테스트
- [ ] 메모리 누수 검사
- [ ] API 응답 시간 측정

### 보안 검사
- [ ] credentials.json 보안 위치 확인
- [ ] API 키 노출 검사
- [ ] CORS 설정 확인
- [ ] HTTPS 설정 (프로덕션)

## 📞 추가 지원

### 로그 수집 명령어
```bash
# 디버깅용 로그 패키지 생성
mkdir debug_logs
cp logs/*.log debug_logs/
cp .env debug_logs/ 2>/dev/null || echo "No .env file"
cp backend/youtube_automation.db debug_logs/ 2>/dev/null || echo "No DB file"
tar -czf debug_package.tar.gz debug_logs/
```

### 시스템 정보 수집
```bash
# 시스템 환경 정보
python --version
node --version
npm --version
poetry --version

# 설치된 패키지 확인
cd backend && poetry show
cd frontend && npm list --depth=0
```

---

🆘 **지원 요청 시 포함할 정보**:
1. 에러 메시지 전문
2. 재현 단계
3. 로그 파일 (debug_package.tar.gz)
4. 시스템 환경 정보
5. 사용 중인 파일 형식 및 크기