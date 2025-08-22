# 📦 데이터베이스 백업 시스템

## 🎯 개요

YouTube 자동화 시스템의 SQLite 데이터베이스를 자동으로 백업하는 시스템입니다.

### ✅ 주요 기능
- **자동 압축**: gzip으로 90% 압축률 달성
- **무결성 검증**: 백업 파일 데이터베이스 검증
- **7일 로테이션**: 오래된 백업 자동 정리
- **로깅 시스템**: 백업 과정 상세 기록
- **Cron 호환**: 무인 자동 백업 지원

## 🚀 사용법

### 수동 백업 실행

```bash
# 프로젝트 루트에서 실행
python scripts/backup_database.py

# 또는 backend 디렉토리에서 Makefile 사용
cd backend
make backup
make backup-info  # 백업 상태 확인
```

### 자동 백업 설정 (Cron Job)

#### 1. Cron 편집기 열기
```bash
crontab -e
```

#### 2. 백업 스케줄 추가
```bash
# 매일 새벽 3시 자동 백업
0 3 * * * cd /Users/ragtime/Coding/MyProeject/youtube-upload-automation && python scripts/backup_database.py >> logs/cron-backup.log 2>&1

# 매주 일요일 새벽 2시 백업
0 2 * * 0 cd /Users/ragtime/Coding/MyProeject/youtube-upload-automation && python scripts/backup_database.py >> logs/cron-backup.log 2>&1

# 매 6시간마다 백업 (개발환경)
0 */6 * * * cd /Users/ragtime/Coding/MyProeject/youtube-upload-automation && python scripts/backup_database.py >> logs/cron-backup.log 2>&1
```

#### 3. Cron 서비스 상태 확인
```bash
# macOS에서 cron 서비스 상태 확인
sudo launchctl list | grep cron

# Linux에서 cron 서비스 상태 확인  
systemctl status crond
```

## 📊 백업 파일 정보

### 파일 저장 위치
```
backups/
└── database/
    ├── youtube_automation_20250823_011125.db.gz  # 압축 백업
    ├── youtube_automation_20250822_030000.db.gz
    └── ...
```

### 파일명 규칙
- **형식**: `youtube_automation_YYYYMMDD_HHMMSS.db.gz`
- **압축**: gzip 압축 (90% 압축률)
- **보존**: 7일간 보관 후 자동 삭제

### 백업 성능
- **원본 크기**: ~70KB (테스트 데이터 기준)
- **압축 크기**: ~7KB (90% 압축률)
- **백업 시간**: < 1초
- **검증 시간**: < 1초

## 🔧 설정 옵션

### 백업 스크립트 설정 (backup_database.py 상단)
```python
# 설정 변경 가능한 항목들
DB_PATH = PROJECT_ROOT / "backend" / "youtube_automation.db"  # DB 경로
BACKUP_DIR = PROJECT_ROOT / "backups" / "database"           # 백업 디렉토리
RETENTION_DAYS = 7                                           # 보존 기간 (일)
COMPRESS_BACKUPS = True                                      # 압축 활성화
```

### 환경별 권장 설정
- **개발환경**: 매일 1회 (새벽 3시)
- **운영환경**: 매 6시간 또는 매일 2회
- **테스트환경**: 수동 실행

## 📋 백업 복원 방법

### 1. 압축 백업 파일 복원
```bash
# 백업 파일 압축 해제
gunzip -c backups/database/youtube_automation_20250823_011125.db.gz > restored_database.db

# 기존 DB 백업 후 교체
mv backend/youtube_automation.db backend/youtube_automation.db.old
mv restored_database.db backend/youtube_automation.db
```

### 2. 복원 후 검증
```bash
# 데이터베이스 무결성 확인
sqlite3 backend/youtube_automation.db "PRAGMA integrity_check;"

# 서버 재시작 후 기능 테스트
cd backend && make run
```

## 📊 모니터링 및 로깅

### 로그 파일 위치
```
logs/
├── backup-2025-08-23.log      # 일별 백업 로그
├── backup-2025-08-22.log
└── cron-backup.log            # Cron job 실행 로그
```

### 로그 레벨
- **INFO**: 정상 백업 과정
- **ERROR**: 백업 실패, 검증 실패
- **WARNING**: 디스크 공간 부족 등

### 모니터링 명령어
```bash
# 최근 백업 로그 확인
tail -f logs/backup-$(date +%Y-%m-%d).log

# 백업 실패 로그 검색
grep ERROR logs/backup-*.log

# 디스크 사용량 확인
du -sh backups/database/
```

## ⚠️ 주의사항

### 보안
- **백업 파일**: 중요한 사용자 데이터 포함
- **권한 설정**: 백업 디렉토리 접근 권한 제한 권장
- **암호화**: 민감한 환경에서는 추가 암호화 고려

### 디스크 공간 관리
- **7일 로테이션**: 자동으로 오래된 백업 정리
- **압축률**: 90% 압축으로 공간 효율성 확보
- **모니터링**: 정기적으로 디스크 사용량 확인

### 문제 해결
- **권한 오류**: 백업 디렉토리 쓰기 권한 확인
- **DB 잠금**: 백업 중 서버 실행 시 잠금 가능
- **압축 오류**: gzip 설치 상태 확인

## 🔗 관련 문서
- [CLAUDE.md](../CLAUDE.md) - 전체 시스템 아키텍처
- [DEPLOYMENT_READY.md](../docs/DEPLOYMENT_READY.md) - 배포 가이드
- [FAQ.md](../docs/FAQ.md) - 문제 해결

---

**백업 시스템 v1.0**  
**마지막 업데이트**: 2025-08-23  
**호환 시스템**: macOS, Linux, Windows (WSL)