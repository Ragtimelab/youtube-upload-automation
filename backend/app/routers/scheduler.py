"""
스케줄러 관리 API 라우터
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List

from ..core.logging import get_router_logger
from ..services.scheduler_service import get_scheduler_service

router = APIRouter(prefix="/api/scheduler", tags=["scheduler"])
logger = get_router_logger("scheduler")


class SchedulerStatusResponse(BaseModel):
    """스케줄러 상태 응답"""
    status: str
    is_running: bool
    total_jobs: int
    next_run_time: str = None
    message: str


class JobInfoResponse(BaseModel):
    """작업 정보 응답"""
    id: str
    name: str
    next_run_time: str = None
    trigger: str
    args: list = []
    kwargs: dict = {}


@router.get("/status", response_model=SchedulerStatusResponse)
def get_scheduler_status():
    """스케줄러 상태 조회"""
    try:
        logger.info("스케줄러 상태 조회")
        
        scheduler_service = get_scheduler_service()
        stats = scheduler_service.get_scheduler_stats()
        
        is_running = scheduler_service.is_running()
        
        return SchedulerStatusResponse(
            status=stats.get("status", "unknown"),
            is_running=is_running,
            total_jobs=stats.get("total_jobs", 0),
            next_run_time=stats.get("next_run_time").isoformat() if stats.get("next_run_time") else None,
            message=f"스케줄러가 {'실행 중' if is_running else '정지됨'}입니다"
        )
        
    except Exception as e:
        logger.error(f"스케줄러 상태 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.post("/start")
def start_scheduler():
    """스케줄러 시작"""
    try:
        logger.info("스케줄러 시작 요청")
        
        scheduler_service = get_scheduler_service()
        
        if scheduler_service.is_running():
            return {
                "message": "스케줄러가 이미 실행 중입니다",
                "status": "running"
            }
        
        scheduler_service.start()
        
        logger.info("스케줄러 시작 완료")
        
        return {
            "message": "스케줄러가 시작되었습니다",
            "status": "started"
        }
        
    except Exception as e:
        logger.error(f"스케줄러 시작 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.post("/stop")
def stop_scheduler():
    """스케줄러 정지"""
    try:
        logger.info("스케줄러 정지 요청")
        
        scheduler_service = get_scheduler_service()
        
        if not scheduler_service.is_running():
            return {
                "message": "스케줄러가 이미 정지되어 있습니다",
                "status": "stopped"
            }
        
        scheduler_service.stop()
        
        logger.info("스케줄러 정지 완료")
        
        return {
            "message": "스케줄러가 정지되었습니다",
            "status": "stopped"
        }
        
    except Exception as e:
        logger.error(f"스케줄러 정지 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.get("/jobs", response_model=List[JobInfoResponse])
def get_scheduler_jobs():
    """현재 실행 중인 작업 목록 조회"""
    try:
        logger.info("스케줄러 작업 목록 조회")
        
        scheduler_service = get_scheduler_service()
        jobs = scheduler_service.get_all_jobs()
        
        job_responses = []
        for job in jobs:
            job_responses.append(JobInfoResponse(
                id=job["id"],
                name=job["name"],
                next_run_time=job["next_run_time"].isoformat() if job["next_run_time"] else None,
                trigger=job["trigger"],
                args=job.get("args", []),
                kwargs=job.get("kwargs", {})
            ))
        
        return job_responses
        
    except Exception as e:
        logger.error(f"스케줄러 작업 목록 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.get("/jobs/{job_id}")
def get_job_info(job_id: str):
    """특정 작업 정보 조회"""
    try:
        logger.info(f"작업 정보 조회: {job_id}")
        
        # job_id에서 schedule_id 추출 (format: "schedule_{schedule_id}")
        if not job_id.startswith("schedule_"):
            raise HTTPException(status_code=400, detail="잘못된 작업 ID 형식입니다")
        
        try:
            schedule_id = int(job_id.replace("schedule_", ""))
        except ValueError:
            raise HTTPException(status_code=400, detail="잘못된 스케줄 ID입니다")
        
        scheduler_service = get_scheduler_service()
        job_info = scheduler_service.get_job_info(schedule_id)
        
        if not job_info:
            raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다")
        
        return {
            "id": job_info["id"],
            "name": job_info["name"],
            "next_run_time": job_info["next_run_time"].isoformat() if job_info["next_run_time"] else None,
            "trigger": job_info["trigger"],
            "args": job_info.get("args", []),
            "kwargs": job_info.get("kwargs", {}),
            "schedule_id": schedule_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"작업 정보 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.delete("/jobs/{job_id}")
def remove_job(job_id: str):
    """작업 제거"""
    try:
        logger.info(f"작업 제거 요청: {job_id}")
        
        # job_id에서 schedule_id 추출
        if not job_id.startswith("schedule_"):
            raise HTTPException(status_code=400, detail="잘못된 작업 ID 형식입니다")
        
        try:
            schedule_id = int(job_id.replace("schedule_", ""))
        except ValueError:
            raise HTTPException(status_code=400, detail="잘못된 스케줄 ID입니다")
        
        scheduler_service = get_scheduler_service()
        success = scheduler_service.remove_schedule(schedule_id)
        
        if success:
            logger.info(f"작업 제거 완료: {job_id}")
            return {
                "message": f"작업 {job_id}이(가) 제거되었습니다",
                "job_id": job_id,
                "schedule_id": schedule_id
            }
        else:
            raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"작업 제거 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.get("/stats")
def get_scheduler_statistics():
    """스케줄러 통계 정보"""
    try:
        logger.info("스케줄러 통계 조회")
        
        scheduler_service = get_scheduler_service()
        stats = scheduler_service.get_scheduler_stats()
        
        return {
            "status": "success",
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"스케줄러 통계 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.post("/restart")
def restart_scheduler():
    """스케줄러 재시작"""
    try:
        logger.info("스케줄러 재시작 요청")
        
        scheduler_service = get_scheduler_service()
        
        # 현재 실행 중이면 정지
        if scheduler_service.is_running():
            scheduler_service.stop()
            logger.info("스케줄러 정지 완료")
        
        # 다시 시작
        scheduler_service.start()
        logger.info("스케줄러 시작 완료")
        
        return {
            "message": "스케줄러가 재시작되었습니다",
            "status": "restarted"
        }
        
    except Exception as e:
        logger.error(f"스케줄러 재시작 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.get("/health")
def scheduler_health_check():
    """스케줄러 헬스체크"""
    try:
        scheduler_service = get_scheduler_service()
        is_running = scheduler_service.is_running()
        stats = scheduler_service.get_scheduler_stats()
        
        health_status = {
            "scheduler": "healthy" if is_running else "stopped",
            "is_running": is_running,
            "total_jobs": stats.get("total_jobs", 0),
            "next_run_time": stats.get("next_run_time").isoformat() if stats.get("next_run_time") else None,
            "timestamp": __import__("datetime").datetime.utcnow().isoformat()
        }
        
        # 스케줄러가 정지되어 있으면 warning 상태
        if not is_running:
            health_status["warning"] = "스케줄러가 실행되지 않고 있습니다"
        
        return health_status
        
    except Exception as e:
        logger.error(f"스케줄러 헬스체크 중 오류: {str(e)}")
        return {
            "scheduler": "error",
            "error": str(e),
            "timestamp": __import__("datetime").datetime.utcnow().isoformat()
        }