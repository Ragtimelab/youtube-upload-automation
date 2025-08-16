"""
스케줄 리포지토리 - 예약 업로드 스케줄 데이터 관리
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc, func

from .base import BaseSQLAlchemyRepository
from ..models.schedule import Schedule, ScheduleStatus
from ..models.script import Script
from ..core.exceptions import DatabaseError


class ScheduleRepository(BaseSQLAlchemyRepository[Schedule]):
    """스케줄 리포지토리"""

    def __init__(self, db: Session):
        super().__init__(db, Schedule)

    def get_by_script_id(self, script_id: int) -> List[Schedule]:
        """특정 스크립트의 모든 스케줄 조회"""
        try:
            return (
                self.db.query(Schedule)
                .filter(Schedule.script_id == script_id)
                .order_by(desc(Schedule.created_at))
                .all()
            )
        except Exception as e:
            raise DatabaseError(f"스크립트 스케줄 조회 실패: {str(e)}")

    def get_by_status(self, status: str, limit: Optional[int] = None) -> List[Schedule]:
        """상태별 스케줄 조회"""
        try:
            query = (
                self.db.query(Schedule)
                .options(joinedload(Schedule.script))
                .filter(Schedule.status == status)
                .order_by(asc(Schedule.scheduled_time), desc(Schedule.priority))
            )
            
            if limit:
                query = query.limit(limit)
                
            return query.all()
        except Exception as e:
            raise DatabaseError(f"상태별 스케줄 조회 실패: {str(e)}")

    def get_pending_schedules(self, limit: Optional[int] = None) -> List[Schedule]:
        """대기 중인 스케줄 조회 (우선순위순)"""
        return self.get_by_status(ScheduleStatus.PENDING, limit)

    def get_overdue_schedules(self, limit: Optional[int] = None) -> List[Schedule]:
        """지연된 스케줄 조회"""
        try:
            current_time = datetime.utcnow()
            query = (
                self.db.query(Schedule)
                .options(joinedload(Schedule.script))
                .filter(
                    and_(
                        Schedule.status == ScheduleStatus.PENDING,
                        Schedule.scheduled_time < current_time
                    )
                )
                .order_by(asc(Schedule.scheduled_time), desc(Schedule.priority))
            )
            
            if limit:
                query = query.limit(limit)
                
            return query.all()
        except Exception as e:
            raise DatabaseError(f"지연된 스케줄 조회 실패: {str(e)}")

    def get_schedules_in_range(
        self, 
        start_time: datetime, 
        end_time: datetime,
        status: Optional[str] = None
    ) -> List[Schedule]:
        """특정 시간 범위 내의 스케줄 조회"""
        try:
            query = (
                self.db.query(Schedule)
                .options(joinedload(Schedule.script))
                .filter(
                    and_(
                        Schedule.scheduled_time >= start_time,
                        Schedule.scheduled_time <= end_time
                    )
                )
            )
            
            if status:
                query = query.filter(Schedule.status == status)
                
            return query.order_by(asc(Schedule.scheduled_time)).all()
        except Exception as e:
            raise DatabaseError(f"시간 범위 스케줄 조회 실패: {str(e)}")

    def get_monthly_schedules(self, year: int, month: int) -> List[Schedule]:
        """특정 월의 모든 스케줄 조회"""
        try:
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1) - timedelta(seconds=1)
            else:
                end_date = datetime(year, month + 1, 1) - timedelta(seconds=1)
                
            return self.get_schedules_in_range(start_date, end_date)
        except Exception as e:
            raise DatabaseError(f"월간 스케줄 조회 실패: {str(e)}")

    def get_failed_retryable_schedules(self, limit: Optional[int] = None) -> List[Schedule]:
        """재시도 가능한 실패한 스케줄 조회"""
        try:
            query = (
                self.db.query(Schedule)
                .options(joinedload(Schedule.script))
                .filter(
                    and_(
                        Schedule.status == ScheduleStatus.FAILED,
                        Schedule.retry_count < Schedule.max_retries
                    )
                )
                .order_by(asc(Schedule.updated_at))
            )
            
            if limit:
                query = query.limit(limit)
                
            return query.all()
        except Exception as e:
            raise DatabaseError(f"재시도 가능한 스케줄 조회 실패: {str(e)}")

    def get_statistics(self) -> Dict[str, Any]:
        """스케줄 통계 정보"""
        try:
            # 상태별 통계
            status_stats = (
                self.db.query(Schedule.status, func.count(Schedule.id))
                .group_by(Schedule.status)
                .all()
            )
            
            # 전체 통계
            total_count = self.db.query(func.count(Schedule.id)).scalar()
            
            # 오늘의 스케줄
            today = datetime.utcnow().date()
            today_start = datetime.combine(today, datetime.min.time())
            today_end = datetime.combine(today, datetime.max.time())
            
            today_count = (
                self.db.query(func.count(Schedule.id))
                .filter(
                    and_(
                        Schedule.scheduled_time >= today_start,
                        Schedule.scheduled_time <= today_end
                    )
                )
                .scalar()
            )
            
            # 이번 주 스케줄
            week_start = today_start - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)
            
            week_count = (
                self.db.query(func.count(Schedule.id))
                .filter(
                    and_(
                        Schedule.scheduled_time >= week_start,
                        Schedule.scheduled_time <= week_end
                    )
                )
                .scalar()
            )
            
            # 지연된 스케줄
            overdue_count = (
                self.db.query(func.count(Schedule.id))
                .filter(
                    and_(
                        Schedule.status == ScheduleStatus.PENDING,
                        Schedule.scheduled_time < datetime.utcnow()
                    )
                )
                .scalar()
            )
            
            return {
                "total_schedules": total_count or 0,
                "today_schedules": today_count or 0,
                "week_schedules": week_count or 0,
                "overdue_schedules": overdue_count or 0,
                "status_breakdown": {status: count for status, count in status_stats},
                "active_schedules": sum(
                    count for status, count in status_stats 
                    if status in ScheduleStatus.active_statuses()
                )
            }
        except Exception as e:
            raise DatabaseError(f"스케줄 통계 조회 실패: {str(e)}")

    def search_schedules(
        self,
        script_title: Optional[str] = None,
        status: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        priority_min: Optional[int] = None,
        priority_max: Optional[int] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Dict[str, Any]:
        """스케줄 검색 및 필터링"""
        try:
            query = self.db.query(Schedule).options(joinedload(Schedule.script))
            
            # 스크립트 제목으로 검색
            if script_title:
                query = query.join(Script).filter(
                    Script.title.ilike(f"%{script_title}%")
                )
            
            # 상태 필터
            if status:
                query = query.filter(Schedule.status == status)
            
            # 날짜 범위 필터
            if start_date:
                query = query.filter(Schedule.scheduled_time >= start_date)
            if end_date:
                query = query.filter(Schedule.scheduled_time <= end_date)
            
            # 우선순위 범위 필터
            if priority_min is not None:
                query = query.filter(Schedule.priority >= priority_min)
            if priority_max is not None:
                query = query.filter(Schedule.priority <= priority_max)
            
            # 총 개수 계산
            total_count = query.count()
            
            # 페이지네이션 및 정렬
            schedules = (
                query.order_by(desc(Schedule.scheduled_time))
                .offset(skip)
                .limit(limit)
                .all()
            )
            
            return {
                "schedules": schedules,
                "total_count": total_count,
                "current_page": (skip // limit) + 1,
                "total_pages": (total_count + limit - 1) // limit,
                "has_next": skip + limit < total_count,
                "has_prev": skip > 0
            }
        except Exception as e:
            raise DatabaseError(f"스케줄 검색 실패: {str(e)}")

    def cancel_schedules_by_script_id(self, script_id: int) -> int:
        """특정 스크립트의 모든 대기 중인 스케줄 취소"""
        try:
            updated_count = (
                self.db.query(Schedule)
                .filter(
                    and_(
                        Schedule.script_id == script_id,
                        Schedule.status.in_(ScheduleStatus.active_statuses())
                    )
                )
                .update(
                    {
                        "status": ScheduleStatus.CANCELLED,
                        "updated_at": datetime.utcnow()
                    },
                    synchronize_session=False
                )
            )
            self.db.commit()
            return updated_count
        except Exception as e:
            self.db.rollback()
            raise DatabaseError(f"스크립트 스케줄 취소 실패: {str(e)}")

    def cleanup_old_schedules(self, days_old: int = 30) -> int:
        """오래된 완료/취소된 스케줄 정리"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            
            deleted_count = (
                self.db.query(Schedule)
                .filter(
                    and_(
                        Schedule.status.in_([ScheduleStatus.COMPLETED, ScheduleStatus.CANCELLED]),
                        Schedule.updated_at < cutoff_date
                    )
                )
                .delete(synchronize_session=False)
            )
            self.db.commit()
            return deleted_count
        except Exception as e:
            self.db.rollback()
            raise DatabaseError(f"오래된 스케줄 정리 실패: {str(e)}")

    def get_next_scheduled_time(self, exclude_script_ids: Optional[List[int]] = None) -> Optional[datetime]:
        """다음 예정된 스케줄 시간 조회"""
        try:
            query = (
                self.db.query(func.min(Schedule.scheduled_time))
                .filter(Schedule.status == ScheduleStatus.PENDING)
            )
            
            if exclude_script_ids:
                query = query.filter(~Schedule.script_id.in_(exclude_script_ids))
            
            return query.scalar()
        except Exception as e:
            raise DatabaseError(f"다음 스케줄 시간 조회 실패: {str(e)}")

    def bulk_create_schedules(self, schedules_data: List[Dict[str, Any]]) -> List[Schedule]:
        """여러 스케줄 일괄 생성"""
        try:
            schedules = []
            for data in schedules_data:
                schedule = Schedule(**data)
                schedules.append(schedule)
                self.db.add(schedule)
            
            self.db.commit()
            
            # 생성된 스케줄들 새로고침
            for schedule in schedules:
                self.db.refresh(schedule)
            
            return schedules
        except Exception as e:
            self.db.rollback()
            raise DatabaseError(f"스케줄 일괄 생성 실패: {str(e)}")

    def bulk_update_status(self, schedule_ids: List[int], new_status: str) -> int:
        """여러 스케줄 상태 일괄 업데이트"""
        try:
            updated_count = (
                self.db.query(Schedule)
                .filter(Schedule.id.in_(schedule_ids))
                .update(
                    {
                        "status": new_status,
                        "updated_at": datetime.utcnow()
                    },
                    synchronize_session=False
                )
            )
            self.db.commit()
            return updated_count
        except Exception as e:
            self.db.rollback()
            raise DatabaseError(f"스케줄 상태 일괄 업데이트 실패: {str(e)}")