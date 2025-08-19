"""
기본 Repository 인터페이스 및 구현체
"""

from abc import ABC, abstractmethod
from typing import Generic, List, Optional, TypeVar

from sqlalchemy.orm import Session

from ..core.constants import PaginationConstants

T = TypeVar("T")


class BaseRepository(Generic[T], ABC):
    """기본 Repository 인터페이스"""

    def __init__(self, db: Session):
        self.db = db

    @abstractmethod
    def create(self, entity: T) -> T:
        """엔티티 생성"""
        pass

    @abstractmethod
    def get_by_id(self, entity_id: int) -> Optional[T]:
        """ID로 엔티티 조회"""
        pass

    @abstractmethod
    def get_all(self, skip: int = 0, limit: int = PaginationConstants.DEFAULT_PAGE_LIMIT) -> List[T]:
        """모든 엔티티 조회"""
        pass

    @abstractmethod
    def update(self, entity: T) -> T:
        """엔티티 수정"""
        pass

    @abstractmethod
    def delete(self, entity_id: int) -> bool:
        """엔티티 삭제"""
        pass


class BaseSQLAlchemyRepository(BaseRepository[T]):
    """SQLAlchemy 기반 Repository 기본 구현체"""

    def __init__(self, db: Session, model):
        super().__init__(db)
        self.model = model

    def create(self, entity: T) -> T:
        """엔티티 생성"""
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def get_by_id(self, entity_id: int) -> Optional[T]:
        """ID로 엔티티 조회"""
        return self.db.query(self.model).filter(self.model.id == entity_id).first()

    def get_all(self, skip: int = 0, limit: int = PaginationConstants.DEFAULT_PAGE_LIMIT) -> List[T]:
        """모든 엔티티 조회"""
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def update(self, entity: T) -> T:
        """엔티티 수정"""
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity_id: int) -> bool:
        """엔티티 삭제"""
        entity = self.get_by_id(entity_id)
        if entity:
            self.db.delete(entity)
            self.db.commit()
            return True
        return False

    def count(self) -> int:
        """전체 엔티티 개수"""
        return self.db.query(self.model).count()
