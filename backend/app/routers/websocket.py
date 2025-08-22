"""
WebSocket Router

글로벌 원칙 준수:
- 근본 해결: 연결 안정성과 에러 처리를 고려한 견고한 WebSocket 구현
- 검증 우선: 모든 메시지와 연결 상태를 철저히 검증
- 실시간 정보: 즉시적 상태 업데이트와 양방향 통신 보장
"""

import json
import asyncio
from typing import Optional, Dict, Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError

from ..core.logging import get_logger
from ..services.websocket_manager import websocket_manager, MessageType


logger = get_logger("websocket_router")

router = APIRouter(prefix="/ws", tags=["websocket"])


class WebSocketRequest(BaseModel):
    """클라이언트에서 받는 WebSocket 요청 형식"""
    
    action: str
    data: Dict[str, Any] = {}
    correlation_id: Optional[str] = None


class WebSocketResponse(BaseModel):
    """클라이언트에게 보내는 WebSocket 응답 형식"""
    
    success: bool
    message: str
    data: Dict[str, Any] = {}
    correlation_id: Optional[str] = None


@router.websocket("/")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: Optional[str] = Query(None, description="클라이언트 ID (선택사항)")
):
    """
    WebSocket 메인 엔드포인트
    
    연결 후 사용 가능한 액션:
    - subscribe: 특정 이벤트 타입 구독
    - unsubscribe: 구독 해제
    - heartbeat: 연결 확인
    - get_status: 현재 상태 조회
    """
    
    assigned_client_id = None
    
    try:
        # 연결 수락 및 클라이언트 ID 할당
        assigned_client_id = await websocket_manager.connect(websocket, client_id)
        logger.info(f"WebSocket 연결 성공: {assigned_client_id}")
        
        # 메시지 수신 루프
        while True:
            try:
                # 클라이언트로부터 메시지 수신 (검증 우선)
                raw_message = await websocket.receive_text()
                logger.debug(f"메시지 수신: {assigned_client_id} -> {raw_message}")
                
                # JSON 파싱 및 검증
                try:
                    message_data = json.loads(raw_message)
                    request = WebSocketRequest(**message_data)
                except (json.JSONDecodeError, ValidationError) as e:
                    # 잘못된 형식 메시지 처리
                    await send_error_response(
                        websocket, 
                        f"잘못된 메시지 형식: {str(e)}",
                        message_data.get('correlation_id') if isinstance(message_data, dict) else None
                    )
                    continue
                
                # 액션 처리
                await handle_websocket_action(websocket, assigned_client_id, request)
                
            except WebSocketDisconnect:
                logger.info(f"클라이언트 연결 종료: {assigned_client_id}")
                break
                
            except Exception as e:
                logger.error(f"메시지 처리 중 오류: {assigned_client_id}, {e}")
                await send_error_response(
                    websocket,
                    f"메시지 처리 실패: {str(e)}"
                )
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket 연결 해제: {assigned_client_id}")
        
    except Exception as e:
        logger.error(f"WebSocket 연결 오류: {e}")
        
    finally:
        # 연결 정리
        if assigned_client_id:
            await websocket_manager.disconnect(assigned_client_id)


async def handle_websocket_action(
    websocket: WebSocket, 
    client_id: str, 
    request: WebSocketRequest
):
    """WebSocket 액션 처리 (검증 우선 원칙)"""
    
    action = request.action
    data = request.data
    correlation_id = request.correlation_id
    
    try:
        if action == "subscribe":
            # 이벤트 구독
            await handle_subscribe_action(client_id, data, correlation_id)
            
        elif action == "unsubscribe":
            # 구독 해제
            await handle_unsubscribe_action(client_id, data, correlation_id)
            
        elif action == "heartbeat":
            # 하트비트 응답
            await handle_heartbeat_action(client_id, correlation_id)
            
        elif action == "get_status":
            # 상태 조회
            await handle_get_status_action(client_id, data, correlation_id)
            
        elif action == "get_upload_progress":
            # 업로드 진행률 조회
            await handle_get_upload_progress_action(client_id, data, correlation_id)
            
        else:
            # 지원하지 않는 액션
            await websocket_manager.send_message(
                client_id,
                MessageType.ERROR,
                {
                    "error": f"지원하지 않는 액션: {action}",
                    "supported_actions": [
                        "subscribe", "unsubscribe", "heartbeat", 
                        "get_status", "get_upload_progress"
                    ]
                },
                correlation_id
            )
            
    except Exception as e:
        logger.error(f"액션 처리 실패: {action}, {e}")
        await websocket_manager.send_message(
            client_id,
            MessageType.ERROR,
            {
                "error": f"액션 처리 실패: {str(e)}",
                "action": action
            },
            correlation_id
        )


async def handle_subscribe_action(client_id: str, data: Dict[str, Any], correlation_id: Optional[str]):
    """구독 액션 처리"""
    
    try:
        # 구독할 메시지 타입 추출 및 검증
        message_types_raw = data.get("message_types", [])
        if not isinstance(message_types_raw, list):
            raise ValueError("message_types는 배열이어야 합니다")
        
        # MessageType 변환
        message_types = []
        for msg_type in message_types_raw:
            try:
                message_types.append(MessageType(msg_type))
            except ValueError:
                logger.warning(f"잘못된 메시지 타입: {msg_type}")
                continue
        
        if not message_types:
            raise ValueError("유효한 메시지 타입이 없습니다")
        
        # 구독 처리
        await websocket_manager.subscribe(client_id, message_types)
        
        # 성공 응답
        await websocket_manager.send_message(
            client_id,
            MessageType.SYSTEM_NOTIFICATION,
            {
                "message": "구독이 완료되었습니다",
                "subscribed_types": [t.value for t in message_types],
                "success": True
            },
            correlation_id
        )
        
    except Exception as e:
        await websocket_manager.send_message(
            client_id,
            MessageType.ERROR,
            {
                "error": f"구독 실패: {str(e)}",
                "action": "subscribe"
            },
            correlation_id
        )


async def handle_unsubscribe_action(client_id: str, data: Dict[str, Any], correlation_id: Optional[str]):
    """구독 해제 액션 처리"""
    
    try:
        # 구독 해제할 메시지 타입 추출
        message_types_raw = data.get("message_types", [])
        
        if message_types_raw:
            # 특정 타입만 해제
            message_types = []
            for msg_type in message_types_raw:
                try:
                    message_types.append(MessageType(msg_type))
                except ValueError:
                    continue
            
            # 구독에서 제거
            if client_id in websocket_manager.subscriptions:
                for msg_type in message_types:
                    websocket_manager.subscriptions[client_id].discard(msg_type)
        else:
            # 모든 구독 해제
            if client_id in websocket_manager.subscriptions:
                websocket_manager.subscriptions[client_id].clear()
        
        await websocket_manager.send_message(
            client_id,
            MessageType.SYSTEM_NOTIFICATION,
            {
                "message": "구독 해제가 완료되었습니다",
                "success": True
            },
            correlation_id
        )
        
    except Exception as e:
        await websocket_manager.send_message(
            client_id,
            MessageType.ERROR,
            {
                "error": f"구독 해제 실패: {str(e)}",
                "action": "unsubscribe"
            },
            correlation_id
        )


async def handle_heartbeat_action(client_id: str, correlation_id: Optional[str]):
    """하트비트 액션 처리 (실시간 정보 활용)"""
    
    # 현재 서버 시간과 연결 정보 반환
    connection_info = websocket_manager.active_connections.get(client_id)
    
    if connection_info:
        uptime_seconds = (connection_info.last_heartbeat - connection_info.connected_at).total_seconds()
        
        await websocket_manager.send_message(
            client_id,
            MessageType.HEARTBEAT,
            {
                "server_time": connection_info.last_heartbeat.isoformat(),
                "uptime_seconds": uptime_seconds,
                "connection_healthy": True
            },
            correlation_id
        )
    else:
        await websocket_manager.send_message(
            client_id,
            MessageType.ERROR,
            {
                "error": "연결 정보를 찾을 수 없습니다",
                "action": "heartbeat"
            },
            correlation_id
        )


async def handle_get_status_action(client_id: str, data: Dict[str, Any], correlation_id: Optional[str]):
    """상태 조회 액션 처리"""
    
    try:
        # 조회할 대상 구분
        target_type = data.get("type", "system")
        
        if target_type == "system":
            # 시스템 전체 상태
            status_data = websocket_manager.get_connection_stats()
            
        elif target_type == "script":
            # 특정 스크립트 상태
            script_id = data.get("script_id")
            if not script_id:
                raise ValueError("script_id가 필요합니다")
            
            # 업로드 진행률 조회
            progress_info = websocket_manager.upload_progress.get(script_id, {})
            status_data = {
                "script_id": script_id,
                "progress": progress_info,
                "has_progress": bool(progress_info)
            }
            
        else:
            raise ValueError(f"지원하지 않는 상태 타입: {target_type}")
        
        await websocket_manager.send_message(
            client_id,
            MessageType.SYSTEM_NOTIFICATION,
            {
                "message": "상태 조회 완료",
                "status_data": status_data,
                "target_type": target_type
            },
            correlation_id
        )
        
    except Exception as e:
        await websocket_manager.send_message(
            client_id,
            MessageType.ERROR,
            {
                "error": f"상태 조회 실패: {str(e)}",
                "action": "get_status"
            },
            correlation_id
        )


async def handle_get_upload_progress_action(client_id: str, data: Dict[str, Any], correlation_id: Optional[str]):
    """업로드 진행률 조회 액션 처리"""
    
    try:
        script_id = data.get("script_id")
        
        if script_id:
            # 특정 스크립트의 진행률
            progress_info = websocket_manager.upload_progress.get(script_id, {})
            if not progress_info:
                progress_info = {
                    "script_id": script_id,
                    "progress_percentage": 0,
                    "status": "not_started",
                    "message": "업로드가 시작되지 않았습니다"
                }
        else:
            # 모든 진행중인 업로드
            progress_info = dict(websocket_manager.upload_progress)
        
        await websocket_manager.send_message(
            client_id,
            MessageType.UPLOAD_PROGRESS,
            progress_info,
            correlation_id
        )
        
    except Exception as e:
        await websocket_manager.send_message(
            client_id,
            MessageType.ERROR,
            {
                "error": f"진행률 조회 실패: {str(e)}",
                "action": "get_upload_progress"
            },
            correlation_id
        )


async def send_error_response(websocket: WebSocket, error_message: str, correlation_id: Optional[str] = None):
    """에러 응답 전송"""
    
    try:
        response = WebSocketResponse(
            success=False,
            message=error_message,
            correlation_id=correlation_id
        )
        
        await websocket.send_text(response.model_dump_json())
        
    except Exception as e:
        logger.error(f"에러 응답 전송 실패: {e}")


# HTTP 엔드포인트 (WebSocket 상태 조회용)
@router.get("/status")
async def get_websocket_status():
    """WebSocket 서버 상태 조회 (HTTP)"""
    
    try:
        stats = websocket_manager.get_connection_stats()
        
        return JSONResponse({
            "success": True,
            "data": {
                "websocket_server": "operational",
                "connection_stats": stats,
                "supported_message_types": [t.value for t in MessageType]
            },
            "message": "WebSocket 서버가 정상 작동 중입니다"
        })
        
    except Exception as e:
        logger.error(f"WebSocket 상태 조회 실패: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"WebSocket 서버 상태 조회 실패: {str(e)}"
        )


class BroadcastRequest(BaseModel):
    """브로드캐스트 요청 형식"""
    message_type: str
    data: Dict[str, Any]
    target_subscriptions: Optional[list] = None


@router.post("/broadcast")
async def broadcast_message(request: BroadcastRequest):
    """메시지 브로드캐스트 (테스트/관리용 HTTP 엔드포인트)"""
    
    try:
        # 메시지 타입 검증
        msg_type = MessageType(request.message_type)
        
        # 타겟 구독 변환
        target_subs = None
        if request.target_subscriptions:
            target_subs = {MessageType(t) for t in request.target_subscriptions}
        
        # 브로드캐스트 실행
        await websocket_manager.broadcast_message(msg_type, request.data, target_subs)
        
        return JSONResponse({
            "success": True,
            "message": f"메시지 브로드캐스트 완료: {request.message_type}",
            "data": {
                "message_type": request.message_type,
                "target_clients": len(websocket_manager.active_connections)
            }
        })
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"잘못된 메시지 타입: {e}")
        
    except Exception as e:
        logger.error(f"브로드캐스트 실패: {e}")
        raise HTTPException(status_code=500, detail=f"브로드캐스트 실패: {str(e)}")


# 정기적인 연결 정리 작업
async def cleanup_connections_periodically():
    """주기적으로 비활성 연결 정리"""
    
    while True:
        try:
            await websocket_manager.cleanup_stale_connections()
            await asyncio.sleep(60)  # 1분마다 실행
        except Exception as e:
            logger.error(f"연결 정리 작업 실패: {e}")
            await asyncio.sleep(60)