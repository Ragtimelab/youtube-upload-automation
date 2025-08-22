"""
WebSocket 연결 관리자

글로벌 원칙 준수:
- 근본 해결: 이전 WebSocket 제거 원인 분석 후 완전 재설계
- 검증 우선: 모든 연결/메시지 송수신 전 상태 검증
- 실시간 정보: 즉시적 상태 업데이트 및 진행률 전송
"""

import json
import asyncio
from typing import Dict, List, Set, Optional, Any, Literal
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from ..core.logging import get_logger


logger = get_logger("websocket_manager")


class MessageType(str, Enum):
    """WebSocket 메시지 타입 정의"""
    
    # 시스템 관련
    CONNECTION_ESTABLISHED = "connection_established"
    HEARTBEAT = "heartbeat"
    ERROR = "error"
    
    # 업로드 진행률
    UPLOAD_PROGRESS = "upload_progress"
    UPLOAD_STARTED = "upload_started"
    UPLOAD_COMPLETED = "upload_completed"
    UPLOAD_FAILED = "upload_failed"
    
    # 상태 변경
    STATUS_CHANGED = "status_changed"
    SCRIPT_UPDATED = "script_updated"
    SYSTEM_NOTIFICATION = "system_notification"
    
    # YouTube 관련
    YOUTUBE_UPLOAD_PROGRESS = "youtube_upload_progress"
    YOUTUBE_QUOTA_UPDATE = "youtube_quota_update"
    
    # 배치 작업
    BATCH_PROGRESS = "batch_progress"
    BATCH_COMPLETED = "batch_completed"


class WebSocketMessage(BaseModel):
    """WebSocket 메시지 표준 형식"""
    
    type: MessageType
    timestamp: datetime = Field(default_factory=datetime.now)
    data: Dict[str, Any] = Field(default_factory=dict)
    client_id: Optional[str] = None
    correlation_id: Optional[str] = None


@dataclass
class ConnectionInfo:
    """WebSocket 연결 정보"""
    
    websocket: WebSocket
    client_id: str
    connected_at: datetime
    last_heartbeat: datetime
    subscriptions: Set[str]  # 구독한 이벤트 타입들


class WebSocketConnectionManager:
    """
    WebSocket 연결 관리자
    
    주요 기능:
    1. 다중 클라이언트 연결 관리
    2. 메시지 브로드캐스팅 및 타겟팅
    3. 연결 상태 모니터링 및 자동 정리
    4. 실시간 업로드 진행률 추적
    5. 시스템 상태 알림 배포
    """
    
    def __init__(self):
        # 활성 연결 관리
        self.active_connections: Dict[str, ConnectionInfo] = {}
        
        # 진행률 추적
        self.upload_progress: Dict[int, Dict[str, Any]] = {}  # script_id -> progress info
        self.batch_progress: Dict[str, Dict[str, Any]] = {}  # batch_id -> progress info
        
        # 구독 관리 (클라이언트별 관심 이벤트)
        self.subscriptions: Dict[str, Set[MessageType]] = {}
        
        # 통계
        self.stats = {
            "total_connections": 0,
            "current_connections": 0,
            "messages_sent": 0,
            "messages_failed": 0,
            "last_reset": datetime.now()
        }
        
        logger.info("WebSocket Connection Manager 초기화 완료")
    
    async def connect(self, websocket: WebSocket, client_id: Optional[str] = None) -> str:
        """새로운 WebSocket 연결 수락 및 관리"""
        
        # 클라이언트 ID 생성 (실시간 정보 활용)
        if not client_id:
            client_id = f"client_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(self.active_connections)}"
        
        try:
            # WebSocket 연결 수락
            await websocket.accept()
            logger.info(f"WebSocket 연결 수락: client_id={client_id}")
            
            # 연결 정보 저장
            connection_info = ConnectionInfo(
                websocket=websocket,
                client_id=client_id,
                connected_at=datetime.now(),
                last_heartbeat=datetime.now(),
                subscriptions=set()
            )
            
            self.active_connections[client_id] = connection_info
            self.subscriptions[client_id] = set()
            
            # 통계 업데이트
            self.stats["total_connections"] += 1
            self.stats["current_connections"] = len(self.active_connections)
            
            # 연결 확인 메시지 전송
            await self.send_message(
                client_id,
                MessageType.CONNECTION_ESTABLISHED,
                {
                    "client_id": client_id,
                    "server_time": datetime.now().isoformat(),
                    "available_subscriptions": [t.value for t in MessageType]
                }
            )
            
            logger.info(f"클라이언트 연결 완료: {client_id} (총 {len(self.active_connections)}개)")
            return client_id
            
        except Exception as e:
            logger.error(f"WebSocket 연결 실패: {e}")
            raise
    
    async def disconnect(self, client_id: str):
        """WebSocket 연결 해제"""
        
        if client_id not in self.active_connections:
            logger.warning(f"존재하지 않는 클라이언트 연결 해제 시도: {client_id}")
            return
        
        try:
            # 연결 정보 제거
            connection_info = self.active_connections.pop(client_id)
            self.subscriptions.pop(client_id, None)
            
            # 통계 업데이트
            self.stats["current_connections"] = len(self.active_connections)
            
            # 연결 시간 로깅
            duration = datetime.now() - connection_info.connected_at
            logger.info(
                f"클라이언트 연결 해제: {client_id} "
                f"(연결 시간: {duration.total_seconds():.1f}초, "
                f"남은 연결: {len(self.active_connections)}개)"
            )
            
        except Exception as e:
            logger.error(f"연결 해제 중 오류: {client_id}, {e}")
    
    async def send_message(
        self, 
        client_id: str, 
        message_type: MessageType, 
        data: Dict[str, Any],
        correlation_id: Optional[str] = None
    ) -> bool:
        """특정 클라이언트에게 메시지 전송"""
        
        if client_id not in self.active_connections:
            logger.warning(f"존재하지 않는 클라이언트에게 메시지 전송 시도: {client_id}")
            return False
        
        try:
            # 연결 상태 재확인 (FastAPI 공식 패턴)
            connection = self.active_connections[client_id]
            if connection.websocket.client_state.name != "CONNECTED":
                logger.warning(f"연결 상태가 CONNECTED가 아님: {client_id} -> {connection.websocket.client_state.name}")
                await self.disconnect(client_id)
                return False
            
            # 메시지 생성 (실시간 정보 활용)
            message = WebSocketMessage(
                type=message_type,
                timestamp=datetime.now(),  # 서버 시간 기준
                data=data,
                client_id=client_id,
                correlation_id=correlation_id
            )
            
            # JSON 직렬화
            message_json = message.model_dump_json()
            
            # WebSocket으로 전송
            await connection.websocket.send_text(message_json)
            
            # 하트비트 업데이트
            connection.last_heartbeat = datetime.now()
            
            # 통계 업데이트
            self.stats["messages_sent"] += 1
            
            logger.debug(f"메시지 전송 성공: {client_id} -> {message_type.value}")
            return True
            
        except WebSocketDisconnect:
            logger.warning(f"클라이언트 연결 끊김 감지: {client_id}")
            await self.disconnect(client_id)
            return False
            
        except Exception as e:
            logger.error(f"메시지 전송 실패: {client_id}, {message_type.value}, {e}")
            self.stats["messages_failed"] += 1
            return False
    
    async def broadcast_message(
        self, 
        message_type: MessageType, 
        data: Dict[str, Any],
        target_subscriptions: Optional[Set[MessageType]] = None
    ):
        """모든 연결된 클라이언트에게 메시지 브로드캐스트"""
        
        if not self.active_connections:
            logger.debug("브로드캐스트할 활성 연결이 없음")
            return
        
        # 구독 필터링
        target_clients = []
        for client_id, subscriptions in self.subscriptions.items():
            if target_subscriptions is None or message_type in subscriptions:
                target_clients.append(client_id)
        
        if not target_clients:
            logger.debug(f"메시지 타입 {message_type.value}에 대한 구독자가 없음")
            return
        
        # 동시 전송
        tasks = []
        for client_id in target_clients:
            task = asyncio.create_task(
                self.send_message(client_id, message_type, data)
            )
            tasks.append(task)
        
        # 전송 결과 집계
        results = await asyncio.gather(*tasks, return_exceptions=True)
        success_count = sum(1 for r in results if r is True)
        
        logger.info(
            f"브로드캐스트 완료: {message_type.value}, "
            f"성공 {success_count}/{len(target_clients)}개"
        )
    
    async def subscribe(self, client_id: str, message_types: List[MessageType]):
        """클라이언트가 특정 메시지 타입 구독"""
        
        if client_id not in self.active_connections:
            logger.warning(f"존재하지 않는 클라이언트 구독 시도: {client_id}")
            return
        
        # 구독 추가
        self.subscriptions[client_id].update(message_types)
        
        # 구독 확인 메시지
        await self.send_message(
            client_id,
            MessageType.SYSTEM_NOTIFICATION,
            {
                "message": "구독이 완료되었습니다",
                "subscribed_types": [t.value for t in message_types],
                "total_subscriptions": len(self.subscriptions[client_id])
            }
        )
        
        logger.info(f"구독 완료: {client_id} -> {[t.value for t in message_types]}")
    
    # 업로드 진행률 관리
    async def update_upload_progress(
        self, 
        script_id: int, 
        progress_percentage: float, 
        status: str,
        additional_info: Optional[Dict[str, Any]] = None
    ):
        """업로드 진행률 업데이트 및 브로드캐스트"""
        
        # 진행률 정보 업데이트 (검증 우선)
        if not (0 <= progress_percentage <= 100):
            logger.error(f"잘못된 진행률: {progress_percentage}%")
            return
        
        progress_info = {
            "script_id": script_id,
            "progress_percentage": progress_percentage,
            "status": status,
            "updated_at": datetime.now().isoformat(),
            **(additional_info or {})
        }
        
        self.upload_progress[script_id] = progress_info
        
        # 실시간 브로드캐스트
        await self.broadcast_message(
            MessageType.UPLOAD_PROGRESS,
            progress_info,
            {MessageType.UPLOAD_PROGRESS}
        )
        
        logger.debug(f"업로드 진행률 업데이트: script_id={script_id}, {progress_percentage:.1f}%")
    
    async def notify_status_change(
        self, 
        script_id: int, 
        old_status: str, 
        new_status: str,
        additional_data: Optional[Dict[str, Any]] = None
    ):
        """스크립트 상태 변경 알림"""
        
        status_data = {
            "script_id": script_id,
            "old_status": old_status,
            "new_status": new_status,
            "changed_at": datetime.now().isoformat(),
            **(additional_data or {})
        }
        
        await self.broadcast_message(
            MessageType.STATUS_CHANGED,
            status_data
        )
        
        logger.info(f"상태 변경 알림: script_id={script_id}, {old_status} -> {new_status}")
    
    async def notify_system_event(self, event_type: str, message: str, level: Literal["info", "warning", "error"] = "info"):
        """시스템 이벤트 알림"""
        
        await self.broadcast_message(
            MessageType.SYSTEM_NOTIFICATION,
            {
                "event_type": event_type,
                "message": message,
                "level": level,
                "timestamp": datetime.now().isoformat()
            }
        )
        
        logger.info(f"시스템 알림: {event_type} - {message}")
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """연결 통계 조회 (JSON 직렬화 가능한 형태)"""
        
        # stats에서 datetime 객체를 문자열로 변환
        serializable_stats = {}
        for key, value in self.stats.items():
            if isinstance(value, datetime):
                serializable_stats[key] = value.isoformat()
            else:
                serializable_stats[key] = value
        
        return {
            **serializable_stats,
            "active_clients": list(self.active_connections.keys()),
            "subscription_summary": {
                client_id: [msg_type.value if hasattr(msg_type, 'value') else str(msg_type) for msg_type in subs]
                for client_id, subs in self.subscriptions.items()
            },
            "current_uploads": len(self.upload_progress),
            "current_batches": len(self.batch_progress)
        }
    
    async def cleanup_stale_connections(self, max_idle_seconds: int = 300):
        """비활성 연결 정리 (5분 이상 하트비트 없음)"""
        
        now = datetime.now()
        stale_clients = []
        
        for client_id, conn in self.active_connections.items():
            idle_seconds = (now - conn.last_heartbeat).total_seconds()
            if idle_seconds > max_idle_seconds:
                stale_clients.append(client_id)
        
        for client_id in stale_clients:
            logger.warning(f"비활성 연결 정리: {client_id}")
            await self.disconnect(client_id)
        
        if stale_clients:
            logger.info(f"비활성 연결 {len(stale_clients)}개 정리 완료")


# 글로벌 WebSocket 매니저 인스턴스
websocket_manager = WebSocketConnectionManager()


# 편의 함수들
async def notify_upload_progress(script_id: int, progress: float, status: str, **kwargs):
    """업로드 진행률 알림 편의 함수"""
    await websocket_manager.update_upload_progress(script_id, progress, status, kwargs)


async def notify_status_change(script_id: int, old_status: str, new_status: str, **kwargs):
    """상태 변경 알림 편의 함수"""
    await websocket_manager.notify_status_change(script_id, old_status, new_status, kwargs)


async def notify_system_event(event_type: str, message: str, level: str = "info"):
    """시스템 이벤트 알림 편의 함수"""
    await websocket_manager.notify_system_event(event_type, message, level)