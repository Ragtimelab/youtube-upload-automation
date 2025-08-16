"""
스케줄러 서비스 - APScheduler를 이용한 백그라운드 작업 처리
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR, EVENT_JOB_MISSED
from sqlalchemy.orm import Session

from ..core.logging import get_service_logger
from ..core.exceptions import DatabaseError, YouTubeUploadError
from ..database import get_db
from ..models.schedule import Schedule, ScheduleStatus
from ..repositories.schedule_repository import ScheduleRepository
from ..services.upload_service import UploadService
from ..services.websocket_manager import websocket_notification_service

logger = get_service_logger("scheduler_service")


class SchedulerService:
    """APScheduler 기반 스케줄링 서비스"""

    def __init__(self, database_url: str = "sqlite:///./youtube_automation.db"):
        self.database_url = database_url
        self.scheduler: Optional[BackgroundScheduler] = None
        self._is_running = False
        
        # APScheduler 설정
        self._setup_scheduler()

    def _setup_scheduler(self):
        """스케줄러 초기 설정"""
        jobstores = {
            'default': SQLAlchemyJobStore(url=self.database_url, tablename='apscheduler_jobs')
        }
        
        executors = {
            'default': ThreadPoolExecutor(20),
        }
        
        job_defaults = {
            'coalesce': False,  # 지연된 작업들을 하나로 합치지 않음
            'max_instances': 3,  # 동일한 작업의 최대 동시 실행 수
            'misfire_grace_time': 30  # 지연된 작업 허용 시간 (초)
        }

        self.scheduler = BackgroundScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone='Asia/Seoul'
        )

        # 이벤트 리스너 등록
        self.scheduler.add_listener(
            self._job_executed_listener,
            EVENT_JOB_EXECUTED | EVENT_JOB_ERROR | EVENT_JOB_MISSED
        )

    def start(self):
        """스케줄러 시작"""
        if not self._is_running and self.scheduler:
            try:
                self.scheduler.start()
                self._is_running = True
                logger.info("스케줄러가 시작되었습니다")
                
                # 기존 pending 스케줄들 복구
                self._recover_pending_schedules()
                
            except Exception as e:
                logger.error(f"스케줄러 시작 실패: {e}")
                raise

    def stop(self):
        """스케줄러 정지"""
        if self._is_running and self.scheduler:
            try:
                self.scheduler.shutdown(wait=True)
                self._is_running = False
                logger.info("스케줄러가 정지되었습니다")
            except Exception as e:
                logger.error(f"스케줄러 정지 실패: {e}")
                raise

    def is_running(self) -> bool:
        """스케줄러 실행 상태 확인"""
        return self._is_running and self.scheduler and self.scheduler.running

    def add_schedule(self, schedule_id: int, scheduled_time: datetime) -> bool:
        """스케줄 추가"""
        try:
            if not self.scheduler:
                raise RuntimeError("스케줄러가 초기화되지 않았습니다")

            job_id = f"schedule_{schedule_id}"
            
            # 기존 작업 제거 (있다면)
            if self.scheduler.get_job(job_id):
                self.scheduler.remove_job(job_id)

            # 새 작업 추가
            self.scheduler.add_job(
                func=self._execute_schedule,
                trigger='date',
                run_date=scheduled_time,
                args=[schedule_id],
                id=job_id,
                name=f"Schedule {schedule_id}",
                replace_existing=True
            )
            
            logger.info(f"스케줄 추가됨: ID={schedule_id}, 시간={scheduled_time}")
            return True
            
        except Exception as e:
            logger.error(f"스케줄 추가 실패: {e}")
            return False

    def remove_schedule(self, schedule_id: int) -> bool:
        """스케줄 제거"""
        try:
            if not self.scheduler:
                return False

            job_id = f"schedule_{schedule_id}"
            
            if self.scheduler.get_job(job_id):
                self.scheduler.remove_job(job_id)
                logger.info(f"스케줄 제거됨: ID={schedule_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"스케줄 제거 실패: {e}")
            return False

    def reschedule(self, schedule_id: int, new_time: datetime) -> bool:
        """스케줄 시간 변경"""
        try:
            if not self.scheduler:
                return False

            job_id = f"schedule_{schedule_id}"
            job = self.scheduler.get_job(job_id)
            
            if job:
                job.modify(next_run_time=new_time)
                logger.info(f"스케줄 시간 변경됨: ID={schedule_id}, 새 시간={new_time}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"스케줄 시간 변경 실패: {e}")
            return False

    def get_job_info(self, schedule_id: int) -> Optional[Dict[str, Any]]:
        """작업 정보 조회"""
        try:
            if not self.scheduler:
                return None

            job_id = f"schedule_{schedule_id}"
            job = self.scheduler.get_job(job_id)
            
            if job:
                return {
                    "id": job.id,
                    "name": job.name,
                    "next_run_time": job.next_run_time,
                    "trigger": str(job.trigger),
                    "args": job.args,
                    "kwargs": job.kwargs
                }
            
            return None
            
        except Exception as e:
            logger.error(f"작업 정보 조회 실패: {e}")
            return None

    def get_all_jobs(self) -> List[Dict[str, Any]]:
        """모든 작업 목록 조회"""
        try:
            if not self.scheduler:
                return []

            jobs = []
            for job in self.scheduler.get_jobs():
                jobs.append({
                    "id": job.id,
                    "name": job.name,
                    "next_run_time": job.next_run_time,
                    "trigger": str(job.trigger),
                    "args": job.args,
                    "kwargs": job.kwargs
                })
            
            return jobs
            
        except Exception as e:
            logger.error(f"작업 목록 조회 실패: {e}")
            return []

    def _recover_pending_schedules(self):
        """서버 재시작 시 기존 pending 스케줄들 복구"""
        try:
            db = next(get_db())
            repository = ScheduleRepository(db)
            
            # 대기 중인 스케줄들 조회
            pending_schedules = repository.get_pending_schedules()
            
            recovered_count = 0
            for schedule in pending_schedules:
                # 이미 지난 시간인 경우 즉시 실행
                if schedule.scheduled_time <= datetime.utcnow():
                    # 백그라운드에서 즉시 실행
                    asyncio.create_task(self._execute_schedule_async(schedule.id))
                else:
                    # 미래 시간인 경우 스케줄러에 추가
                    if self.add_schedule(schedule.id, schedule.scheduled_time):
                        recovered_count += 1

            logger.info(f"기존 스케줄 {recovered_count}개 복구 완료")
            
        except Exception as e:
            logger.error(f"스케줄 복구 실패: {e}")
        finally:
            db.close()

    def _execute_schedule(self, schedule_id: int):
        """스케줄 실행 (동기 버전)"""
        asyncio.run(self._execute_schedule_async(schedule_id))

    async def _execute_schedule_async(self, schedule_id: int):
        """스케줄 실행 (비동기 버전)"""
        db = None
        try:
            logger.info(f"스케줄 실행 시작: ID={schedule_id}")
            
            # 데이터베이스 세션 생성
            db = next(get_db())
            repository = ScheduleRepository(db)
            
            # 스케줄 조회
            schedule = repository.get_by_id(schedule_id)
            if not schedule:
                logger.error(f"스케줄을 찾을 수 없습니다: ID={schedule_id}")
                return

            # 상태 확인
            if not schedule.is_pending():
                logger.warning(f"스케줄이 이미 처리되었습니다: ID={schedule_id}, 상태={schedule.status}")
                return

            # 처리 중 상태로 변경
            schedule.mark_as_processing()
            repository.update(schedule)

            # WebSocket 알림: 처리 시작
            await websocket_notification_service.broadcast_system_notification({
                "title": "예약 업로드 시작",
                "message": f"스케줄 {schedule_id} 실행이 시작되었습니다",
                "type": "info",
                "script_id": schedule.script_id
            })

            # 업로드 서비스 실행
            upload_service = UploadService(db)
            upload_settings = schedule.get_upload_settings()
            
            result = await upload_service.upload_to_youtube(
                script_id=schedule.script_id,
                scheduled_time=upload_settings.get('scheduled_time'),
                privacy_status=upload_settings.get('privacy_status'),
                category_id=upload_settings.get('category_id')
            )

            # 성공 처리
            schedule.mark_as_completed()
            repository.update(schedule)

            logger.info(f"스케줄 실행 완료: ID={schedule_id}, YouTube ID={result.get('youtube_video_id')}")

            # WebSocket 알림: 처리 완료
            await websocket_notification_service.broadcast_system_notification({
                "title": "예약 업로드 완료",
                "message": f"스케줄 {schedule_id}이 성공적으로 완료되었습니다",
                "type": "success",
                "script_id": schedule.script_id,
                "youtube_url": result.get('youtube_url')
            })

        except Exception as e:
            # 실패 처리
            error_message = str(e)
            logger.error(f"스케줄 실행 실패: ID={schedule_id}, 오류={error_message}")
            
            if db and schedule:
                schedule.mark_as_failed(error_message)
                repository.update(schedule)

                # 재시도 가능한 경우 재스케줄링
                if schedule.can_retry():
                    retry_time = datetime.utcnow() + timedelta(minutes=5 * schedule.retry_count)
                    self.add_schedule(schedule_id, retry_time)
                    logger.info(f"스케줄 재시도 예약: ID={schedule_id}, 시간={retry_time}")

            # WebSocket 알림: 처리 실패
            await websocket_notification_service.broadcast_system_notification({
                "title": "예약 업로드 실패",
                "message": f"스케줄 {schedule_id} 실행이 실패했습니다: {error_message}",
                "type": "error",
                "script_id": schedule.script_id if schedule else None
            })

        finally:
            if db:
                db.close()

    def _job_executed_listener(self, event):
        """APScheduler 이벤트 리스너"""
        job_id = event.job_id
        
        if event.exception:
            logger.error(f"작업 실행 실패: {job_id}, 예외: {event.exception}")
        else:
            logger.info(f"작업 실행 완료: {job_id}")

    def get_scheduler_stats(self) -> Dict[str, Any]:
        """스케줄러 통계 정보"""
        try:
            if not self.scheduler:
                return {"status": "not_initialized"}

            jobs = self.scheduler.get_jobs()
            
            return {
                "status": "running" if self.is_running() else "stopped",
                "total_jobs": len(jobs),
                "next_run_time": min([job.next_run_time for job in jobs]) if jobs else None,
                "job_details": [
                    {
                        "id": job.id,
                        "name": job.name,
                        "next_run_time": job.next_run_time
                    }
                    for job in jobs
                ]
            }
        except Exception as e:
            logger.error(f"스케줄러 통계 조회 실패: {e}")
            return {"status": "error", "error": str(e)}


# 전역 스케줄러 인스턴스
scheduler_service: Optional[SchedulerService] = None


def get_scheduler_service() -> SchedulerService:
    """스케줄러 서비스 인스턴스 반환"""
    global scheduler_service
    if scheduler_service is None:
        scheduler_service = SchedulerService()
    return scheduler_service


def initialize_scheduler():
    """스케줄러 초기화 및 시작"""
    service = get_scheduler_service()
    if not service.is_running():
        service.start()


def shutdown_scheduler():
    """스케줄러 종료"""
    global scheduler_service
    if scheduler_service and scheduler_service.is_running():
        scheduler_service.stop()
        scheduler_service = None