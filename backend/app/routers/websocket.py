"""
WebSocket 라우터 - 실시간 통신 엔드포인트
"""

import json
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session

from ..core.logging import get_router_logger
from ..database import get_db
from ..services.websocket_manager import connection_manager, websocket_notification_service
from ..repositories.script_repository import ScriptRepository

router = APIRouter()
logger = get_router_logger("websocket")


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    WebSocket 메인 엔드포인트
    
    연결 URL 예시:
    - ws://localhost:8000/ws
    - ws://localhost:8000/ws?user_id=user123
    """
    connection_id = None
    
    try:
        # 연결 수락 및 등록
        connection_id = await connection_manager.connect(websocket, user_id)
        
        # 환영 메시지 및 초기 데이터 전송
        await send_initial_data(connection_id, db)
        
        # 메시지 루프
        while True:
            try:
                # 클라이언트로부터 메시지 수신
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # 메시지 처리
                await handle_client_message(connection_id, message, user_id, db)
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await connection_manager.send_personal_message(connection_id, {
                    "type": "error",
                    "message": "잘못된 JSON 형식입니다."
                })
            except Exception as e:
                logger.error(f"메시지 처리 중 오류: {e}")
                # 연결 무한 루프 방지 - 오류 메시지 전송 안함
                break
    
    except Exception as e:
        logger.error(f"WebSocket 연결 오류: {e}")
    
    finally:
        # 연결 정리
        if connection_id:
            connection_manager.disconnect(connection_id, user_id)


async def send_initial_data(connection_id: str, db: Session):
    """초기 데이터 전송"""
    try:
        script_repository = ScriptRepository(db)
        
        # 스크립트 통계 전송
        stats = script_repository.get_statistics()
        
        # datetime 객체가 있을 수 있으므로 안전하게 처리
        safe_stats = {}
        if stats:
            for key, value in stats.items():
                if isinstance(value, dict):
                    safe_stats[key] = {k: (v.isoformat() if hasattr(v, 'isoformat') else v) for k, v in value.items()}
                else:
                    safe_stats[key] = value.isoformat() if hasattr(value, 'isoformat') else value
        
        await connection_manager.send_personal_message(connection_id, {
            "type": "initial_data",
            "data": {
                "script_stats": safe_stats,
                "connection_stats": connection_manager.get_connection_stats()
            }
        })
        
        logger.info(f"초기 데이터 전송 완료: {connection_id}")
        
    except Exception as e:
        logger.error(f"초기 데이터 전송 실패: {e}")
        # 초기 데이터 전송 실패시 간단한 연결 확인 메시지만 전송
        try:
            await connection_manager.send_personal_message(connection_id, {
                "type": "initial_data",
                "data": {
                    "script_stats": {"total_scripts": 0, "by_status": {}},
                    "connection_stats": connection_manager.get_connection_stats()
                }
            })
        except Exception as fallback_error:
            logger.error(f"폴백 초기 데이터 전송도 실패: {fallback_error}")


async def handle_client_message(connection_id: str, message: dict, user_id: Optional[str], db: Session):
    """클라이언트 메시지 처리"""
    message_type = message.get("type")
    
    if message_type == "subscribe_script":
        # 스크립트 구독
        script_id = message.get("script_id")
        if script_id:
            connection_manager.subscribe_to_script(connection_id, script_id)
            await connection_manager.send_personal_message(connection_id, {
                "type": "subscription_confirmed",
                "script_id": script_id,
                "message": f"스크립트 {script_id} 구독이 완료되었습니다."
            })
    
    elif message_type == "unsubscribe_script":
        # 스크립트 구독 해제
        script_id = message.get("script_id")
        if script_id:
            connection_manager.unsubscribe_from_script(connection_id, script_id)
            await connection_manager.send_personal_message(connection_id, {
                "type": "unsubscription_confirmed",
                "script_id": script_id,
                "message": f"스크립트 {script_id} 구독이 해제되었습니다."
            })
    
    elif message_type == "get_script_status":
        # 스크립트 상태 조회
        script_id = message.get("script_id")
        if script_id:
            await send_script_status(connection_id, script_id, db)
    
    elif message_type == "get_connection_stats":
        # 연결 통계 조회
        stats = connection_manager.get_connection_stats()
        await connection_manager.send_personal_message(connection_id, {
            "type": "connection_stats",
            "data": stats
        })
    
    elif message_type == "ping":
        # 핑/퐁 응답
        await connection_manager.send_personal_message(connection_id, {
            "type": "pong",
            "timestamp": message.get("timestamp")
        })
    
    else:
        await connection_manager.send_personal_message(connection_id, {
            "type": "error",
            "message": f"알 수 없는 메시지 타입: {message_type}"
        })


async def send_script_status(connection_id: str, script_id: int, db: Session):
    """스크립트 상태 정보 전송"""
    try:
        script_repository = ScriptRepository(db)
        script = script_repository.get_by_id(script_id)
        
        if script:
            script_data = {
                "id": script.id,
                "title": script.title,
                "status": script.status,
                "created_at": script.created_at.isoformat(),
                "updated_at": script.updated_at.isoformat(),
                "video_file_path": script.video_file_path,
                "youtube_video_id": script.youtube_video_id,
                "scheduled_time": script.scheduled_time.isoformat() if script.scheduled_time else None,
            }
            
            await connection_manager.send_personal_message(connection_id, {
                "type": "script_status",
                "script_id": script_id,
                "data": script_data
            })
        else:
            await connection_manager.send_personal_message(connection_id, {
                "type": "error",
                "message": f"스크립트 {script_id}를 찾을 수 없습니다."
            })
    
    except Exception as e:
        logger.error(f"스크립트 상태 조회 실패: {e}")
        await connection_manager.send_personal_message(connection_id, {
            "type": "error",
            "message": f"스크립트 상태 조회 오류: {str(e)}"
        })


@router.get("/ws/stats")
async def get_websocket_stats():
    """WebSocket 연결 통계 API"""
    return {
        "status": "success",
        "data": connection_manager.get_connection_stats()
    }


@router.post("/ws/broadcast")
async def broadcast_message(message: dict):
    """관리자용 브로드캐스트 API"""
    try:
        await connection_manager.broadcast_system_notification({
            "title": message.get("title", "시스템 알림"),
            "message": message.get("message", ""),
            "type": message.get("type", "info")
        })
        
        return {
            "status": "success",
            "message": "브로드캐스트가 전송되었습니다.",
            "recipients": len(connection_manager.active_connections)
        }
    
    except Exception as e:
        logger.error(f"브로드캐스트 전송 실패: {e}")
        return {
            "status": "error",
            "message": f"브로드캐스트 전송 실패: {str(e)}"
        }


@router.post("/ws/notify/script/{script_id}")
async def notify_script_update(script_id: int, update_data: dict, db: Session = Depends(get_db)):
    """특정 스크립트 업데이트 알림 API"""
    try:
        script_repository = ScriptRepository(db)
        script = script_repository.get_by_id(script_id)
        
        if not script:
            return {
                "status": "error",
                "message": f"스크립트 {script_id}를 찾을 수 없습니다."
            }
        
        await connection_manager.broadcast_script_update(script_id, update_data)
        
        return {
            "status": "success",
            "message": f"스크립트 {script_id} 업데이트 알림이 전송되었습니다.",
            "subscribers": len(connection_manager.script_subscribers.get(script_id, []))
        }
    
    except Exception as e:
        logger.error(f"스크립트 업데이트 알림 실패: {e}")
        return {
            "status": "error",
            "message": f"알림 전송 실패: {str(e)}"
        }