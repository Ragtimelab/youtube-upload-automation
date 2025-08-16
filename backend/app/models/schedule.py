"""
스케줄 모델 - 예약 업로드 및 배치 처리를 위한 데이터 모델
"""

from datetime import datetime
from typing import Optional
import json

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from ..database import Base


class Schedule(Base):
    """예약 업로드 스케줄 모델"""
    
    __tablename__ = "schedules"

    # 기본 필드
    id = Column(Integer, primary_key=True, index=True)
    script_id = Column(Integer, ForeignKey("scripts.id"), nullable=False, index=True)
    
    # 스케줄 정보
    scheduled_time = Column(DateTime, nullable=False, index=True)
    status = Column(String(50), nullable=False, default="pending", index=True)
    priority = Column(Integer, nullable=False, default=5)  # 1-10, 높을수록 우선
    
    # 재시도 관련
    retry_count = Column(Integer, nullable=False, default=0)
    max_retries = Column(Integer, nullable=False, default=3)
    
    # 에러 처리
    error_message = Column(Text, nullable=True)
    
    # 업로드 설정 (JSON 형태로 저장)
    upload_settings = Column(JSON, nullable=True)
    
    # 타임스탬프
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    executed_at = Column(DateTime, nullable=True)
    
    # 관계 설정
    script = relationship("Script", back_populates="schedules")

    def __repr__(self):
        return f"<Schedule(id={self.id}, script_id={self.script_id}, status='{self.status}', scheduled_time='{self.scheduled_time}')>"

    def to_dict(self) -> dict:
        """모델을 딕셔너리로 변환"""
        return {
            "id": self.id,
            "script_id": self.script_id,
            "scheduled_time": self.scheduled_time.isoformat() if self.scheduled_time else None,
            "status": self.status,
            "priority": self.priority,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "error_message": self.error_message,
            "upload_settings": self.upload_settings,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "executed_at": self.executed_at.isoformat() if self.executed_at else None,
        }

    def get_upload_settings(self) -> dict:
        """업로드 설정을 딕셔너리로 반환"""
        if self.upload_settings:
            if isinstance(self.upload_settings, str):
                return json.loads(self.upload_settings)
            return self.upload_settings
        return {}

    def set_upload_settings(self, settings: dict):
        """업로드 설정을 JSON으로 저장"""
        self.upload_settings = settings

    def is_pending(self) -> bool:
        """대기 중 상태인지 확인"""
        return self.status == "pending"

    def is_processing(self) -> bool:
        """처리 중 상태인지 확인"""
        return self.status == "processing"

    def is_completed(self) -> bool:
        """완료 상태인지 확인"""
        return self.status == "completed"

    def is_failed(self) -> bool:
        """실패 상태인지 확인"""
        return self.status == "failed"

    def is_cancelled(self) -> bool:
        """취소 상태인지 확인"""
        return self.status == "cancelled"

    def can_retry(self) -> bool:
        """재시도 가능한지 확인"""
        return self.is_failed() and self.retry_count < self.max_retries

    def mark_as_processing(self):
        """처리 중 상태로 변경"""
        self.status = "processing"
        self.updated_at = datetime.utcnow()

    def mark_as_completed(self):
        """완료 상태로 변경"""
        self.status = "completed"
        self.executed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.error_message = None

    def mark_as_failed(self, error_message: str):
        """실패 상태로 변경"""
        self.status = "failed"
        self.error_message = error_message
        self.retry_count += 1
        self.updated_at = datetime.utcnow()

    def mark_as_cancelled(self):
        """취소 상태로 변경"""
        self.status = "cancelled"
        self.updated_at = datetime.utcnow()

    def reset_for_retry(self):
        """재시도를 위해 상태 리셋"""
        if self.can_retry():
            self.status = "pending"
            self.error_message = None
            self.updated_at = datetime.utcnow()

    @property
    def is_overdue(self) -> bool:
        """예정 시간이 지났는지 확인"""
        if self.scheduled_time and self.is_pending():
            return datetime.utcnow() > self.scheduled_time
        return False


# 스케줄 상태 상수
class ScheduleStatus:
    PENDING = "pending"       # 대기 중
    PROCESSING = "processing" # 처리 중
    COMPLETED = "completed"   # 완료
    FAILED = "failed"         # 실패
    CANCELLED = "cancelled"   # 취소

    @classmethod
    def all_statuses(cls) -> list[str]:
        """모든 상태 목록 반환"""
        return [cls.PENDING, cls.PROCESSING, cls.COMPLETED, cls.FAILED, cls.CANCELLED]

    @classmethod
    def active_statuses(cls) -> list[str]:
        """활성 상태 목록 반환 (pending, processing)"""
        return [cls.PENDING, cls.PROCESSING]

    @classmethod
    def final_statuses(cls) -> list[str]:
        """최종 상태 목록 반환 (completed, failed, cancelled)"""
        return [cls.COMPLETED, cls.FAILED, cls.CANCELLED]


# 우선순위 상수
class SchedulePriority:
    LOWEST = 1
    LOW = 3
    NORMAL = 5
    HIGH = 7
    HIGHEST = 10

    @classmethod
    def get_label(cls, priority: int) -> str:
        """우선순위 레이블 반환"""
        labels = {
            1: "매우 낮음",
            2: "매우 낮음", 
            3: "낮음",
            4: "낮음",
            5: "보통",
            6: "보통",
            7: "높음",
            8: "높음",
            9: "매우 높음",
            10: "매우 높음",
        }
        return labels.get(priority, "보통")