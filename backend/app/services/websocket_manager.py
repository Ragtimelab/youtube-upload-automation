"""
WebSocket 연결 관리 및 실시간 알림 시스템
"""

import json
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import WebSocket

from ..core.logging import get_service_logger

logger = get_service_logger("websocket_manager")


def serialize_for_json(obj):
    """JSON 직렬화를 위한 헬퍼 함수"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {key: serialize_for_json(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [serialize_for_json(item) for item in obj]
    else:
        return obj


class ConnectionManager:
    """WebSocket 연결 관리자"""

    def __init__(self):
        # 활성 연결들을 저장 {connection_id: websocket}
        self.active_connections: Dict[str, WebSocket] = {}
        # 사용자별 연결을 저장 {user_id: [connection_ids]}
        self.user_connections: Dict[str, List[str]] = {}
        # 스크립트별 구독자를 저장 {script_id: [connection_ids]}
        self.script_subscribers: Dict[int, List[str]] = {}

    def generate_connection_id(self) -> str:
        """고유한 연결 ID 생성"""
        return f"conn_{datetime.now().timestamp()}_{id(object())}"

    async def connect(self, websocket: WebSocket, user_id: Optional[str] = None) -> str:
        """새로운 WebSocket 연결 수락"""
        await websocket.accept()
        connection_id = self.generate_connection_id()

        self.active_connections[connection_id] = websocket

        # 사용자 연결 추가
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(connection_id)

        logger.info(f"새 WebSocket 연결: {connection_id} (사용자: {user_id})")
        logger.info(f"현재 활성 연결 수: {len(self.active_connections)}")

        # 연결 확인 메시지 전송
        await self.send_personal_message(
            connection_id,
            {
                "type": "connection_established",
                "connection_id": connection_id,
                "timestamp": datetime.now().isoformat(),
                "message": "WebSocket 연결이 성공적으로 설정되었습니다.",
            },
        )

        return connection_id

    def disconnect(self, connection_id: str, user_id: Optional[str] = None):
        """WebSocket 연결 해제"""
        # 활성 연결에서 제거
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]

        # 사용자 연결에서 제거
        if user_id and user_id in self.user_connections:
            if connection_id in self.user_connections[user_id]:
                self.user_connections[user_id].remove(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        # 스크립트 구독에서 제거
        for script_id in list(self.script_subscribers.keys()):
            if connection_id in self.script_subscribers[script_id]:
                self.script_subscribers[script_id].remove(connection_id)
            if not self.script_subscribers[script_id]:
                del self.script_subscribers[script_id]

        logger.info(f"WebSocket 연결 해제: {connection_id} (사용자: {user_id})")
        logger.info(f"현재 활성 연결 수: {len(self.active_connections)}")

    async def send_personal_message(self, connection_id: str, message: dict):
        """특정 연결에 메시지 전송"""
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            try:
                # 메시지를 JSON 직렬화 가능한 형태로 변환
                serialized_message = serialize_for_json(message)
                await websocket.send_text(
                    json.dumps(serialized_message, ensure_ascii=False)
                )
                logger.debug(
                    f"메시지 전송 성공: {connection_id} - {message.get('type', 'unknown')}"
                )
            except Exception as e:
                logger.error(f"메시지 전송 실패: {connection_id} - {e}")
                # 연결이 끊어진 경우 정리
                self.disconnect(connection_id)
        else:
            logger.warning(f"존재하지 않는 연결 ID: {connection_id}")

    async def send_user_message(self, user_id: str, message: dict):
        """특정 사용자의 모든 연결에 메시지 전송"""
        if user_id in self.user_connections:
            connection_ids = self.user_connections[user_id].copy()
            for connection_id in connection_ids:
                await self.send_personal_message(connection_id, message)

    async def broadcast_message(self, message: dict):
        """모든 연결에 메시지 브로드캐스트"""
        if not self.active_connections:
            logger.debug("브로드캐스트할 활성 연결이 없습니다.")
            return

        connection_ids = list(self.active_connections.keys())
        for connection_id in connection_ids:
            await self.send_personal_message(connection_id, message)

        logger.info(
            f"브로드캐스트 완료: {len(connection_ids)}개 연결 - {message.get('type', 'unknown')}"
        )

    def subscribe_to_script(self, connection_id: str, script_id: int):
        """스크립트 업데이트 구독"""
        if script_id not in self.script_subscribers:
            self.script_subscribers[script_id] = []

        if connection_id not in self.script_subscribers[script_id]:
            self.script_subscribers[script_id].append(connection_id)
            logger.info(f"스크립트 구독: {connection_id} -> script_id={script_id}")

    def unsubscribe_from_script(self, connection_id: str, script_id: int):
        """스크립트 업데이트 구독 해제"""
        if script_id in self.script_subscribers:
            if connection_id in self.script_subscribers[script_id]:
                self.script_subscribers[script_id].remove(connection_id)
                logger.info(
                    f"스크립트 구독 해제: {connection_id} -> script_id={script_id}"
                )

            if not self.script_subscribers[script_id]:
                del self.script_subscribers[script_id]

    async def broadcast_script_update(self, script_id: int, update_data: dict):
        """특정 스크립트 구독자들에게 업데이트 브로드캐스트"""
        if script_id in self.script_subscribers:
            message = {
                "type": "script_update",
                "script_id": script_id,
                "timestamp": datetime.now().isoformat(),
                "data": update_data,
            }

            subscribers = self.script_subscribers[script_id].copy()
            for connection_id in subscribers:
                await self.send_personal_message(connection_id, message)

            logger.info(
                f"스크립트 업데이트 브로드캐스트: script_id={script_id}, 구독자={len(subscribers)}"
            )

    async def broadcast_upload_progress(self, script_id: int, progress_data: dict):
        """업로드 진행률 브로드캐스트"""
        if script_id in self.script_subscribers:
            message = {
                "type": "upload_progress",
                "script_id": script_id,
                "timestamp": datetime.now().isoformat(),
                "progress": progress_data,
            }

            subscribers = self.script_subscribers[script_id].copy()
            for connection_id in subscribers:
                await self.send_personal_message(connection_id, message)

            logger.debug(
                (
                    f"업로드 진행률 브로드캐스트: script_id={script_id}, "
                    f"진행률={progress_data.get('progress_percentage', 0)}%"
                )
            )

    async def broadcast_system_notification(self, notification: dict):
        """시스템 알림 브로드캐스트"""
        message = {
            "type": "system_notification",
            "timestamp": datetime.now().isoformat(),
            "notification": notification,
        }

        await self.broadcast_message(message)

    def get_connection_stats(self) -> dict:
        """연결 통계 반환"""
        return {
            "total_connections": len(self.active_connections),
            "total_users": len(self.user_connections),
            "total_script_subscriptions": len(self.script_subscribers),
            "active_script_ids": list(self.script_subscribers.keys()),
            "connections_per_user": {
                user_id: len(connections)
                for user_id, connections in self.user_connections.items()
            },
        }


# 전역 연결 관리자 인스턴스
connection_manager = ConnectionManager()


class WebSocketNotificationService:
    """WebSocket 알림 서비스"""

    def __init__(self, manager: ConnectionManager):
        self.manager = manager

    async def notify_script_created(self, script_data: dict):
        """새 스크립트 생성 알림"""
        await self.manager.broadcast_system_notification(
            {
                "title": "새 스크립트 업로드",
                "message": (
                    f"새로운 스크립트 '{script_data.get('title', 'Unknown')}'가 "
                    f"업로드되었습니다."
                ),
                "type": "info",
                "script_id": script_data.get("id"),
                "data": script_data,
            }
        )

    async def notify_video_uploaded(self, script_id: int, script_data: dict):
        """비디오 업로드 완료 알림"""
        await self.manager.broadcast_script_update(
            script_id,
            {
                "status": "video_ready",
                "message": "비디오 업로드가 완료되었습니다.",
                "script_data": script_data,
            },
        )

        await self.manager.broadcast_system_notification(
            {
                "title": "비디오 업로드 완료",
                "message": f"'{script_data.get('title', 'Unknown')}' 비디오 업로드가 완료되었습니다.",
                "type": "success",
                "script_id": script_id,
            }
        )

    async def notify_youtube_upload_started(self, script_id: int, script_data: dict):
        """YouTube 업로드 시작 알림"""
        await self.manager.broadcast_script_update(
            script_id,
            {
                "status": "uploading",
                "message": "YouTube 업로드를 시작합니다.",
                "script_data": script_data,
            },
        )

    async def notify_youtube_upload_completed(
        self, script_id: int, script_data: dict, youtube_url: str
    ):
        """YouTube 업로드 완료 알림"""
        await self.manager.broadcast_script_update(
            script_id,
            {
                "status": "uploaded",
                "message": "YouTube 업로드가 완료되었습니다.",
                "youtube_url": youtube_url,
                "script_data": script_data,
            },
        )

        await self.manager.broadcast_system_notification(
            {
                "title": "YouTube 업로드 완료",
                "message": (
                    f"'{script_data.get('title', 'Unknown')}'가 YouTube에 "
                    f"성공적으로 업로드되었습니다."
                ),
                "type": "success",
                "script_id": script_id,
                "youtube_url": youtube_url,
            }
        )

    async def notify_upload_error(
        self, script_id: int, error_message: str, script_data: dict
    ):
        """업로드 오류 알림"""
        await self.manager.broadcast_script_update(
            script_id,
            {
                "status": "error",
                "message": f"업로드 오류: {error_message}",
                "script_data": script_data,
            },
        )

        await self.manager.broadcast_system_notification(
            {
                "title": "업로드 오류",
                "message": (
                    f"'{script_data.get('title', 'Unknown')}' 업로드 중 "
                    f"오류가 발생했습니다: {error_message}"
                ),
                "type": "error",
                "script_id": script_id,
            }
        )

    async def send_upload_progress(self, script_id: int, progress_data: dict):
        """업로드 진행률 전송"""
        await self.manager.broadcast_upload_progress(script_id, progress_data)


# 전역 알림 서비스 인스턴스
websocket_notification_service = WebSocketNotificationService(connection_manager)
