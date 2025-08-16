"""
스케줄 관리 API 라우터
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from ..core.exceptions import BaseAppException, DatabaseError, ScriptNotFoundError
from ..core.logging import get_router_logger
from ..database import get_db
from ..models.schedule import Schedule, ScheduleStatus, SchedulePriority
from ..repositories.schedule_repository import ScheduleRepository
from ..repositories.script_repository import ScriptRepository
from ..services.scheduler_service import get_scheduler_service

router = APIRouter(prefix="/api/schedules", tags=["schedules"])
logger = get_router_logger("schedules")


# Pydantic 모델들
class ScheduleCreate(BaseModel):
    """스케줄 생성 요청"""
    script_id: int = Field(..., description="스크립트 ID")
    scheduled_time: datetime = Field(..., description="예약 시간")
    priority: int = Field(default=SchedulePriority.NORMAL, ge=1, le=10, description="우선순위 (1-10)")
    max_retries: int = Field(default=3, ge=0, le=10, description="최대 재시도 횟수")
    upload_settings: Optional[dict] = Field(default=None, description="업로드 설정")


class ScheduleUpdate(BaseModel):
    """스케줄 수정 요청"""
    scheduled_time: Optional[datetime] = Field(None, description="예약 시간")
    priority: Optional[int] = Field(None, ge=1, le=10, description="우선순위")
    max_retries: Optional[int] = Field(None, ge=0, le=10, description="최대 재시도 횟수")
    upload_settings: Optional[dict] = Field(None, description="업로드 설정")


class BatchScheduleCreate(BaseModel):
    """배치 스케줄 생성 요청"""
    script_ids: List[int] = Field(..., description="스크립트 ID 목록")
    start_time: datetime = Field(..., description="시작 시간")
    interval_minutes: int = Field(default=30, ge=1, description="간격 (분)")
    priority: int = Field(default=SchedulePriority.NORMAL, ge=1, le=10, description="우선순위")
    max_retries: int = Field(default=3, ge=0, le=10, description="최대 재시도 횟수")
    upload_settings: Optional[dict] = Field(default=None, description="업로드 설정")


class MonthlyPlanCreate(BaseModel):
    """월간 계획 생성 요청"""
    script_ids: List[int] = Field(..., description="스크립트 ID 목록")
    year: int = Field(..., ge=2024, le=2030, description="년도")
    month: int = Field(..., ge=1, le=12, description="월")
    uploads_per_day: int = Field(default=1, ge=1, le=10, description="일일 업로드 수")
    start_hour: int = Field(default=9, ge=0, le=23, description="시작 시간")
    priority: int = Field(default=SchedulePriority.NORMAL, ge=1, le=10, description="우선순위")
    upload_settings: Optional[dict] = Field(default=None, description="업로드 설정")


class ScheduleResponse(BaseModel):
    """스케줄 응답"""
    id: int
    script_id: int
    scheduled_time: datetime
    status: str
    priority: int
    retry_count: int
    max_retries: int
    error_message: Optional[str]
    upload_settings: Optional[dict]
    created_at: datetime
    updated_at: datetime
    executed_at: Optional[datetime]
    script_title: Optional[str] = None


# API 엔드포인트들

@router.post("/", response_model=ScheduleResponse)
def create_schedule(
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db)
):
    """단일 스케줄 생성"""
    try:
        logger.info(f"스케줄 생성 요청: script_id={schedule_data.script_id}")

        # 스크립트 존재 확인
        script_repository = ScriptRepository(db)
        script = script_repository.get_by_id(schedule_data.script_id)
        if not script:
            raise ScriptNotFoundError(schedule_data.script_id)

        # 스케줄 생성
        schedule_repository = ScheduleRepository(db)
        schedule = Schedule(
            script_id=schedule_data.script_id,
            scheduled_time=schedule_data.scheduled_time,
            priority=schedule_data.priority,
            max_retries=schedule_data.max_retries,
            upload_settings=schedule_data.upload_settings or {}
        )

        created_schedule = schedule_repository.create(schedule)

        # 스케줄러에 작업 추가
        scheduler_service = get_scheduler_service()
        if scheduler_service.is_running():
            scheduler_service.add_schedule(created_schedule.id, created_schedule.scheduled_time)

        logger.info(f"스케줄 생성 완료: ID={created_schedule.id}")

        # 응답 생성
        response_data = created_schedule.to_dict()
        response_data['script_title'] = script.title
        return ScheduleResponse(**response_data)

    except BaseAppException:
        raise
    except Exception as e:
        logger.error(f"스케줄 생성 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.get("/", response_model=dict)
def list_schedules(
    status: Optional[str] = Query(None, description="상태 필터"),
    script_title: Optional[str] = Query(None, description="스크립트 제목 검색"),
    start_date: Optional[datetime] = Query(None, description="시작 날짜"),
    end_date: Optional[datetime] = Query(None, description="종료 날짜"),
    priority_min: Optional[int] = Query(None, ge=1, le=10, description="최소 우선순위"),
    priority_max: Optional[int] = Query(None, ge=1, le=10, description="최대 우선순위"),
    skip: int = Query(0, ge=0, description="건너뛸 개수"),
    limit: int = Query(50, ge=1, le=100, description="가져올 개수"),
    db: Session = Depends(get_db)
):
    """스케줄 목록 조회 (필터링 및 페이지네이션 지원)"""
    try:
        logger.info(f"스케줄 목록 조회: status={status}, skip={skip}, limit={limit}")

        schedule_repository = ScheduleRepository(db)
        result = schedule_repository.search_schedules(
            script_title=script_title,
            status=status,
            start_date=start_date,
            end_date=end_date,
            priority_min=priority_min,
            priority_max=priority_max,
            skip=skip,
            limit=limit
        )

        # 응답 데이터 구성
        schedules_data = []
        for schedule in result['schedules']:
            schedule_dict = schedule.to_dict()
            schedule_dict['script_title'] = schedule.script.title if schedule.script else None
            schedules_data.append(schedule_dict)

        return {
            "schedules": schedules_data,
            "pagination": {
                "total_count": result['total_count'],
                "current_page": result['current_page'],
                "total_pages": result['total_pages'],
                "has_next": result['has_next'],
                "has_prev": result['has_prev']
            }
        }

    except Exception as e:
        logger.error(f"스케줄 목록 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.get("/{schedule_id}", response_model=ScheduleResponse)
def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """특정 스케줄 조회"""
    try:
        logger.info(f"스케줄 조회: ID={schedule_id}")

        schedule_repository = ScheduleRepository(db)
        schedule = schedule_repository.get_by_id(schedule_id)
        
        if not schedule:
            raise HTTPException(status_code=404, detail="스케줄을 찾을 수 없습니다")

        # 응답 생성
        response_data = schedule.to_dict()
        response_data['script_title'] = schedule.script.title if schedule.script else None
        return ScheduleResponse(**response_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"스케줄 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.put("/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(
    schedule_id: int,
    schedule_data: ScheduleUpdate,
    db: Session = Depends(get_db)
):
    """스케줄 수정"""
    try:
        logger.info(f"스케줄 수정 요청: ID={schedule_id}")

        schedule_repository = ScheduleRepository(db)
        schedule = schedule_repository.get_by_id(schedule_id)
        
        if not schedule:
            raise HTTPException(status_code=404, detail="스케줄을 찾을 수 없습니다")

        # 활성 상태에서만 수정 가능
        if schedule.status not in ScheduleStatus.active_statuses():
            raise HTTPException(
                status_code=400, 
                detail="완료되거나 취소된 스케줄은 수정할 수 없습니다"
            )

        # 수정 사항 적용
        update_data = schedule_data.model_dump(exclude_unset=True)
        old_scheduled_time = schedule.scheduled_time

        for field, value in update_data.items():
            setattr(schedule, field, value)

        updated_schedule = schedule_repository.update(schedule)

        # 스케줄 시간이 변경된 경우 스케줄러 업데이트
        if schedule_data.scheduled_time and schedule_data.scheduled_time != old_scheduled_time:
            scheduler_service = get_scheduler_service()
            if scheduler_service.is_running():
                scheduler_service.reschedule(schedule_id, schedule_data.scheduled_time)

        logger.info(f"스케줄 수정 완료: ID={schedule_id}")

        # 응답 생성
        response_data = updated_schedule.to_dict()
        response_data['script_title'] = updated_schedule.script.title if updated_schedule.script else None
        return ScheduleResponse(**response_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"스케줄 수정 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """스케줄 삭제"""
    try:
        logger.info(f"스케줄 삭제 요청: ID={schedule_id}")

        schedule_repository = ScheduleRepository(db)
        schedule = schedule_repository.get_by_id(schedule_id)
        
        if not schedule:
            raise HTTPException(status_code=404, detail="스케줄을 찾을 수 없습니다")

        # 스케줄러에서 작업 제거
        scheduler_service = get_scheduler_service()
        if scheduler_service.is_running():
            scheduler_service.remove_schedule(schedule_id)

        # 데이터베이스에서 삭제
        schedule_repository.delete(schedule_id)

        logger.info(f"스케줄 삭제 완료: ID={schedule_id}")

        return {"message": "스케줄이 삭제되었습니다", "schedule_id": schedule_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"스케줄 삭제 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.post("/{schedule_id}/cancel")
def cancel_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """스케줄 취소"""
    try:
        logger.info(f"스케줄 취소 요청: ID={schedule_id}")

        schedule_repository = ScheduleRepository(db)
        schedule = schedule_repository.get_by_id(schedule_id)
        
        if not schedule:
            raise HTTPException(status_code=404, detail="스케줄을 찾을 수 없습니다")

        if not schedule.is_pending():
            raise HTTPException(
                status_code=400, 
                detail="대기 중인 스케줄만 취소할 수 있습니다"
            )

        # 스케줄 취소
        schedule.mark_as_cancelled()
        updated_schedule = schedule_repository.update(schedule)

        # 스케줄러에서 작업 제거
        scheduler_service = get_scheduler_service()
        if scheduler_service.is_running():
            scheduler_service.remove_schedule(schedule_id)

        logger.info(f"스케줄 취소 완료: ID={schedule_id}")

        return {
            "message": "스케줄이 취소되었습니다",
            "schedule_id": schedule_id,
            "status": updated_schedule.status
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"스케줄 취소 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.post("/{schedule_id}/retry")
def retry_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """실패한 스케줄 재시도"""
    try:
        logger.info(f"스케줄 재시도 요청: ID={schedule_id}")

        schedule_repository = ScheduleRepository(db)
        schedule = schedule_repository.get_by_id(schedule_id)
        
        if not schedule:
            raise HTTPException(status_code=404, detail="스케줄을 찾을 수 없습니다")

        if not schedule.can_retry():
            raise HTTPException(
                status_code=400, 
                detail="재시도할 수 없는 상태이거나 최대 재시도 횟수를 초과했습니다"
            )

        # 재시도를 위한 상태 리셋
        schedule.reset_for_retry()
        
        # 즉시 실행하도록 시간 설정
        schedule.scheduled_time = datetime.utcnow() + timedelta(seconds=30)
        updated_schedule = schedule_repository.update(schedule)

        # 스케줄러에 다시 추가
        scheduler_service = get_scheduler_service()
        if scheduler_service.is_running():
            scheduler_service.add_schedule(schedule_id, updated_schedule.scheduled_time)

        logger.info(f"스케줄 재시도 설정 완료: ID={schedule_id}")

        return {
            "message": "스케줄이 재시도를 위해 설정되었습니다",
            "schedule_id": schedule_id,
            "new_scheduled_time": updated_schedule.scheduled_time,
            "retry_count": updated_schedule.retry_count
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"스케줄 재시도 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.get("/stats/summary")
def get_schedule_statistics(db: Session = Depends(get_db)):
    """스케줄 통계 조회"""
    try:
        logger.info("스케줄 통계 조회")

        schedule_repository = ScheduleRepository(db)
        stats = schedule_repository.get_statistics()

        return {
            "status": "success",
            "data": stats
        }

    except Exception as e:
        logger.error(f"스케줄 통계 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.post("/batch", response_model=dict)
def create_batch_schedule(
    batch_data: BatchScheduleCreate,
    db: Session = Depends(get_db)
):
    """배치 스케줄 생성 (여러 스크립트 일괄 스케줄링)"""
    try:
        logger.info(f"배치 스케줄 생성 요청: {len(batch_data.script_ids)}개 스크립트")

        # 스크립트 존재 확인
        script_repository = ScriptRepository(db)
        valid_scripts = []
        invalid_script_ids = []

        for script_id in batch_data.script_ids:
            script = script_repository.get_by_id(script_id)
            if script:
                valid_scripts.append(script)
            else:
                invalid_script_ids.append(script_id)

        if invalid_script_ids:
            raise HTTPException(
                status_code=400,
                detail=f"존재하지 않는 스크립트 ID: {invalid_script_ids}"
            )

        # 스케줄 데이터 생성
        schedule_repository = ScheduleRepository(db)
        schedules_data = []
        current_time = batch_data.start_time

        for i, script in enumerate(valid_scripts):
            schedules_data.append({
                "script_id": script.id,
                "scheduled_time": current_time,
                "priority": batch_data.priority,
                "max_retries": batch_data.max_retries,
                "upload_settings": batch_data.upload_settings or {}
            })
            
            # 다음 스케줄 시간 계산
            current_time += timedelta(minutes=batch_data.interval_minutes)

        # 일괄 생성
        created_schedules = schedule_repository.bulk_create_schedules(schedules_data)

        # 스케줄러에 작업 추가
        scheduler_service = get_scheduler_service()
        if scheduler_service.is_running():
            for schedule in created_schedules:
                scheduler_service.add_schedule(schedule.id, schedule.scheduled_time)

        logger.info(f"배치 스케줄 생성 완료: {len(created_schedules)}개")

        return {
            "message": f"{len(created_schedules)}개 스케줄이 생성되었습니다",
            "created_count": len(created_schedules),
            "start_time": batch_data.start_time,
            "end_time": current_time - timedelta(minutes=batch_data.interval_minutes),
            "schedules": [
                {
                    "id": schedule.id,
                    "script_id": schedule.script_id,
                    "script_title": schedule.script.title if schedule.script else None,
                    "scheduled_time": schedule.scheduled_time
                }
                for schedule in created_schedules
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"배치 스케줄 생성 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.post("/monthly-plan", response_model=dict)
def create_monthly_plan(
    plan_data: MonthlyPlanCreate,
    db: Session = Depends(get_db)
):
    """월간 업로드 계획 생성"""
    try:
        logger.info(f"월간 계획 생성 요청: {plan_data.year}/{plan_data.month}")

        # 스크립트 존재 확인
        script_repository = ScriptRepository(db)
        valid_scripts = []
        invalid_script_ids = []

        for script_id in plan_data.script_ids:
            script = script_repository.get_by_id(script_id)
            if script:
                valid_scripts.append(script)
            else:
                invalid_script_ids.append(script_id)

        if invalid_script_ids:
            raise HTTPException(
                status_code=400,
                detail=f"존재하지 않는 스크립트 ID: {invalid_script_ids}"
            )

        # 월간 계획 계산
        from calendar import monthrange
        _, days_in_month = monthrange(plan_data.year, plan_data.month)
        
        # 업로드 가능한 총 슬롯 수
        total_slots = days_in_month * plan_data.uploads_per_day
        
        if len(valid_scripts) > total_slots:
            raise HTTPException(
                status_code=400,
                detail=f"스크립트 수({len(valid_scripts)})가 월간 업로드 슬롯({total_slots})을 초과합니다"
            )

        # 스케줄 데이터 생성
        schedule_repository = ScheduleRepository(db)
        schedules_data = []
        script_index = 0

        for day in range(1, days_in_month + 1):
            for upload_slot in range(plan_data.uploads_per_day):
                if script_index >= len(valid_scripts):
                    break
                
                # 스케줄 시간 계산 (시간 간격을 두고 분배)
                hour = plan_data.start_hour + (upload_slot * 2)  # 2시간 간격
                if hour >= 24:
                    hour = 23  # 최대 23시까지
                
                scheduled_time = datetime(
                    plan_data.year, 
                    plan_data.month, 
                    day, 
                    hour, 
                    0, 
                    0
                )

                schedules_data.append({
                    "script_id": valid_scripts[script_index].id,
                    "scheduled_time": scheduled_time,
                    "priority": plan_data.priority,
                    "max_retries": 3,
                    "upload_settings": plan_data.upload_settings or {}
                })
                
                script_index += 1
            
            if script_index >= len(valid_scripts):
                break

        # 일괄 생성
        created_schedules = schedule_repository.bulk_create_schedules(schedules_data)

        # 스케줄러에 작업 추가
        scheduler_service = get_scheduler_service()
        if scheduler_service.is_running():
            for schedule in created_schedules:
                scheduler_service.add_schedule(schedule.id, schedule.scheduled_time)

        logger.info(f"월간 계획 생성 완료: {len(created_schedules)}개")

        return {
            "message": f"{plan_data.year}년 {plan_data.month}월 업로드 계획이 생성되었습니다",
            "year": plan_data.year,
            "month": plan_data.month,
            "created_count": len(created_schedules),
            "total_scripts": len(valid_scripts),
            "uploads_per_day": plan_data.uploads_per_day,
            "start_date": f"{plan_data.year}-{plan_data.month:02d}-01",
            "end_date": f"{plan_data.year}-{plan_data.month:02d}-{days_in_month}",
            "schedules": [
                {
                    "id": schedule.id,
                    "script_id": schedule.script_id,
                    "script_title": schedule.script.title if schedule.script else None,
                    "scheduled_time": schedule.scheduled_time,
                    "date": schedule.scheduled_time.date().isoformat()
                }
                for schedule in created_schedules
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"월간 계획 생성 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@router.get("/calendar/{year}/{month}")
def get_monthly_calendar(
    year: int, 
    month: int, 
    db: Session = Depends(get_db)
):
    """월간 캘린더 뷰"""
    try:
        logger.info(f"월간 캘린더 조회: {year}/{month}")

        if year < 2024 or year > 2030:
            raise HTTPException(status_code=400, detail="유효하지 않은 연도입니다")
        
        if month < 1 or month > 12:
            raise HTTPException(status_code=400, detail="유효하지 않은 월입니다")

        schedule_repository = ScheduleRepository(db)
        schedules = schedule_repository.get_monthly_schedules(year, month)

        # 날짜별로 그룹화
        calendar_data = {}
        for schedule in schedules:
            date_key = schedule.scheduled_time.date().isoformat()
            if date_key not in calendar_data:
                calendar_data[date_key] = []
            
            calendar_data[date_key].append({
                "id": schedule.id,
                "script_id": schedule.script_id,
                "script_title": schedule.script.title if schedule.script else None,
                "scheduled_time": schedule.scheduled_time,
                "status": schedule.status,
                "priority": schedule.priority
            })

        return {
            "year": year,
            "month": month,
            "calendar": calendar_data,
            "total_schedules": len(schedules)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"월간 캘린더 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")