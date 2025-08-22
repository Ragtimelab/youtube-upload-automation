#!/usr/bin/env python3
"""
SQLite 데이터베이스 자동 백업 스크립트

기능:
- 데이터베이스 파일 백업 (압축 포함)
- 7일 로테이션 시스템
- 백업 무결성 검증
- 로깅 시스템
- Cron job 호환

사용법:
    python scripts/backup_database.py
    
Cron job 예시:
    # 매일 새벽 3시 백업
    0 3 * * * cd /path/to/project && python scripts/backup_database.py
"""

import os
import sys
import sqlite3
import shutil
import gzip
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional


# 프로젝트 루트 경로 설정
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# 설정
DB_PATH = PROJECT_ROOT / "backend" / "youtube_automation.db"
BACKUP_DIR = PROJECT_ROOT / "backups" / "database"
LOG_DIR = PROJECT_ROOT / "logs"
RETENTION_DAYS = 7
COMPRESS_BACKUPS = True

# 로깅 설정
def setup_logging():
    """백업 전용 로깅 설정"""
    LOG_DIR.mkdir(exist_ok=True)
    log_file = LOG_DIR / f"backup-{datetime.now().strftime('%Y-%m-%d')}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)


def verify_database(db_path: Path) -> bool:
    """데이터베이스 무결성 검증"""
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("PRAGMA integrity_check")
            result = cursor.fetchone()
            return result[0] == "ok"
    except Exception as e:
        logging.error(f"데이터베이스 검증 실패: {e}")
        return False


def create_backup(source_db: Path, backup_dir: Path, compress: bool = True) -> Optional[Path]:
    """데이터베이스 백업 생성"""
    if not source_db.exists():
        logging.error(f"소스 데이터베이스가 존재하지 않습니다: {source_db}")
        return None
    
    # 백업 디렉토리 생성
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    # 백업 파일명 생성 (타임스탬프 포함)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f"youtube_automation_{timestamp}.db"
    
    if compress:
        backup_filename += ".gz"
        backup_path = backup_dir / backup_filename
        
        try:
            # 압축 백업 생성
            with open(source_db, 'rb') as f_in:
                with gzip.open(backup_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            logging.info(f"압축 백업 생성 완료: {backup_path}")
            
        except Exception as e:
            logging.error(f"압축 백업 생성 실패: {e}")
            return None
    else:
        backup_path = backup_dir / backup_filename
        
        try:
            # 단순 복사 백업
            shutil.copy2(source_db, backup_path)
            logging.info(f"백업 생성 완료: {backup_path}")
            
        except Exception as e:
            logging.error(f"백업 생성 실패: {e}")
            return None
    
    return backup_path


def verify_backup(backup_path: Path, compress: bool = True) -> bool:
    """백업 파일 검증"""
    if not backup_path.exists():
        logging.error(f"백업 파일이 존재하지 않습니다: {backup_path}")
        return False
    
    try:
        if compress:
            # 압축 파일인 경우 임시 파일로 압축 해제하여 검증
            temp_db = backup_path.with_suffix('.tmp')
            with gzip.open(backup_path, 'rb') as f_in:
                with open(temp_db, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            is_valid = verify_database(temp_db)
            temp_db.unlink()  # 임시 파일 삭제
            
        else:
            is_valid = verify_database(backup_path)
        
        if is_valid:
            logging.info(f"백업 검증 성공: {backup_path}")
        else:
            logging.error(f"백업 검증 실패: {backup_path}")
        
        return is_valid
        
    except Exception as e:
        logging.error(f"백업 검증 중 오류: {e}")
        return False


def cleanup_old_backups(backup_dir: Path, retention_days: int):
    """오래된 백업 파일 정리"""
    if not backup_dir.exists():
        return
    
    cutoff_date = datetime.now() - timedelta(days=retention_days)
    deleted_count = 0
    
    for backup_file in backup_dir.glob("youtube_automation_*.db*"):
        if backup_file.stat().st_mtime < cutoff_date.timestamp():
            try:
                backup_file.unlink()
                deleted_count += 1
                logging.info(f"오래된 백업 삭제: {backup_file}")
            except Exception as e:
                logging.error(f"백업 삭제 실패: {backup_file}, {e}")
    
    if deleted_count > 0:
        logging.info(f"{deleted_count}개의 오래된 백업 파일을 정리했습니다")
    else:
        logging.info("정리할 오래된 백업 파일이 없습니다")


def get_backup_info(backup_dir: Path) -> List[dict]:
    """백업 파일 정보 조회"""
    backups = []
    
    if not backup_dir.exists():
        return backups
    
    for backup_file in sorted(backup_dir.glob("youtube_automation_*.db*"), reverse=True):
        stat = backup_file.stat()
        backups.append({
            'filename': backup_file.name,
            'path': backup_file,
            'size': stat.st_size,
            'created': datetime.fromtimestamp(stat.st_ctime),
            'modified': datetime.fromtimestamp(stat.st_mtime)
        })
    
    return backups


def main():
    """메인 백업 프로세스"""
    logger = setup_logging()
    
    logger.info("=" * 60)
    logger.info("SQLite 데이터베이스 백업 시작")
    logger.info("=" * 60)
    
    # 1. 원본 데이터베이스 검증
    logger.info(f"원본 데이터베이스 경로: {DB_PATH}")
    
    if not DB_PATH.exists():
        logger.error("데이터베이스 파일이 존재하지 않습니다")
        sys.exit(1)
    
    if not verify_database(DB_PATH):
        logger.error("원본 데이터베이스 무결성 검증 실패")
        sys.exit(1)
    
    logger.info("원본 데이터베이스 검증 완료")
    
    # 2. 백업 생성
    logger.info("백업 생성 중...")
    backup_path = create_backup(DB_PATH, BACKUP_DIR, COMPRESS_BACKUPS)
    
    if backup_path is None:
        logger.error("백업 생성 실패")
        sys.exit(1)
    
    # 3. 백업 검증
    logger.info("백업 검증 중...")
    if not verify_backup(backup_path, COMPRESS_BACKUPS):
        logger.error("백업 검증 실패 - 백업 파일 삭제")
        backup_path.unlink()
        sys.exit(1)
    
    # 4. 백업 정보 출력
    backup_size = backup_path.stat().st_size
    original_size = DB_PATH.stat().st_size
    compression_ratio = (1 - backup_size / original_size) * 100 if COMPRESS_BACKUPS else 0
    
    logger.info(f"백업 완료:")
    logger.info(f"  파일: {backup_path.name}")
    logger.info(f"  크기: {backup_size:,} bytes")
    logger.info(f"  원본 크기: {original_size:,} bytes")
    if COMPRESS_BACKUPS:
        logger.info(f"  압축률: {compression_ratio:.1f}%")
    
    # 5. 오래된 백업 정리
    logger.info(f"{RETENTION_DAYS}일 이전 백업 파일 정리 중...")
    cleanup_old_backups(BACKUP_DIR, RETENTION_DAYS)
    
    # 6. 현재 백업 목록 출력
    backups = get_backup_info(BACKUP_DIR)
    logger.info(f"\n현재 백업 파일 목록 ({len(backups)}개):")
    for backup in backups[:5]:  # 최근 5개만 표시
        logger.info(f"  {backup['filename']} - {backup['size']:,} bytes - {backup['created']}")
    
    logger.info("=" * 60)
    logger.info("백업 프로세스 완료")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()