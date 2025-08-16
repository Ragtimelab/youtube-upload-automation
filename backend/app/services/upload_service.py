"""
파일 업로드 및 YouTube 업로드 관련 비즈니스 로직을 처리하는 Service
"""

import os
import shutil
from datetime import datetime
from typing import Optional

from fastapi import UploadFile
from sqlalchemy.orm import Session

from ..config import get_settings
from ..core.exceptions import (
    DatabaseError,
    FileUploadError,
    FileValidationError,
    InvalidScriptStatusError,
    ScriptNotFoundError,
    VideoFileNotFoundError,
    YouTubeUploadError,
)
from ..models.script import Script
from ..repositories.script_repository import ScriptRepository
from .youtube_client import YouTubeClient
from .websocket_manager import websocket_notification_service


class UploadService:
    """업로드 관리 서비스"""

    def __init__(self, db: Session):
        self.db = db
        self.repository = ScriptRepository(db)
        self.settings = get_settings()

    async def upload_video_file(self, script_id: int, video_file: UploadFile) -> dict:
        """영상 파일 업로드 및 대본과 매칭"""
        # 대본 존재 확인
        script = self.repository.get_by_id(script_id)
        if not script:
            raise ScriptNotFoundError(script_id)

        if script.status != "script_ready":
            raise InvalidScriptStatusError(script.status, "script_ready")

        # 파일 검증
        self._validate_video_file(video_file)

        # 파일 저장
        file_path = self._save_video_file(script_id, video_file)

        try:
            # DB 업데이트
            script.video_file_path = file_path
            script.status = "video_ready"
            script.updated_at = datetime.utcnow()

            updated_script = self.repository.update(script)

            # WebSocket 알림 전송
            script_data = {
                "id": updated_script.id,
                "title": updated_script.title,
                "status": updated_script.status,
                "video_file_path": file_path,
                "file_size": os.path.getsize(file_path),
                "uploaded_filename": video_file.filename,
                "saved_filename": os.path.basename(file_path),
            }
            
            # 비디오 업로드 완료 알림
            try:
                await websocket_notification_service.notify_video_uploaded(
                    script_id, script_data
                )
            except Exception as e:
                # WebSocket 알림 실패는 메인 프로세스에 영향주지 않음
                print(f"WebSocket 알림 전송 실패: {e}")

            return {
                "id": updated_script.id,
                "title": updated_script.title,
                "status": updated_script.status,
                "video_file_path": file_path,
                "file_size": os.path.getsize(file_path),
                "message": "비디오 파일 업로드 및 대본 연결 완료",
                "uploaded_filename": video_file.filename,
                "saved_filename": os.path.basename(file_path),
            }

        except Exception as e:
            # 실패 시 업로드된 파일 정리
            if os.path.exists(file_path):
                os.remove(file_path)
            raise DatabaseError(f"데이터베이스 업데이트 실패: {str(e)}")

    async def upload_to_youtube(
        self,
        script_id: int,
        scheduled_time: Optional[str] = None,
        privacy_status: Optional[str] = None,
        category_id: Optional[int] = None,
    ) -> dict:
        """YouTube에 비디오 업로드"""
        # 대본 및 비디오 파일 확인
        script = self.repository.get_by_id(script_id)
        if not script:
            raise ScriptNotFoundError(script_id)

        if script.status != "video_ready":
            raise InvalidScriptStatusError(script.status, "video_ready")

        if not script.video_file_path or not os.path.exists(script.video_file_path):
            raise VideoFileNotFoundError(script.video_file_path or "Unknown")

        # 기본값 설정
        if privacy_status is None:
            privacy_status = self.settings.default_privacy_status
        if category_id is None:
            category_id = self.settings.default_category_id

        # 공개 설정 검증
        self._validate_privacy_status(privacy_status)

        try:
            # YouTube 업로드 시작 알림
            script_data = {
                "id": script.id,
                "title": script.title,
                "status": script.status,
            }
            
            try:
                await websocket_notification_service.notify_youtube_upload_started(
                    script_id, script_data
                )
            except Exception as e:
                print(f"WebSocket 알림 전송 실패: {e}")

            # YouTube 클라이언트 초기화 및 인증
            youtube_client = YouTubeClient()

            if not youtube_client.authenticate():
                raise YouTubeUploadError("YouTube API 인증에 실패했습니다.")

            # 업로드 메타데이터 구성
            metadata = self._build_upload_metadata(
                script, privacy_status, category_id, scheduled_time
            )

            # YouTube 업로드 실행
            video_id = youtube_client.upload_video(script.video_file_path, metadata)

            if not video_id:
                raise YouTubeUploadError("업로드 실패: 비디오 ID를 받을 수 없습니다.")

            # DB 업데이트
            script.youtube_video_id = video_id
            script.status = "scheduled" if scheduled_time else "uploaded"
            if scheduled_time:
                script.scheduled_time = datetime.fromisoformat(
                    scheduled_time.replace("Z", "+00:00")
                )
            script.updated_at = datetime.utcnow()

            updated_script = self.repository.update(script)

            # YouTube 업로드 완료 알림
            youtube_url = f"https://www.youtube.com/watch?v={video_id}"
            final_script_data = {
                "id": updated_script.id,
                "title": updated_script.title,
                "status": updated_script.status,
                "youtube_video_id": video_id,
                "youtube_url": youtube_url,
            }
            
            try:
                await websocket_notification_service.notify_youtube_upload_completed(
                    script_id, final_script_data, youtube_url
                )
            except Exception as e:
                print(f"WebSocket 알림 전송 실패: {e}")

            return {
                "id": updated_script.id,
                "title": updated_script.title,
                "status": updated_script.status,
                "youtube_video_id": video_id,
                "youtube_url": youtube_url,
                "privacy_status": metadata["privacy_status"],
                "scheduled_time": updated_script.scheduled_time,
                "message": "YouTube 업로드 성공",
                "upload_timestamp": updated_script.updated_at,
            }

        except YouTubeUploadError as e:
            # YouTube 업로드 실패 시 상태 업데이트
            script.status = "error"
            script.updated_at = datetime.utcnow()
            self.repository.update(script)
            
            # 에러 알림 전송
            try:
                await websocket_notification_service.notify_upload_error(
                    script_id, str(e), {"id": script.id, "title": script.title}
                )
            except Exception as notify_error:
                print(f"WebSocket 에러 알림 전송 실패: {notify_error}")
            
            raise
        except Exception as e:
            # 기타 예외 처리
            script.status = "error"
            script.updated_at = datetime.utcnow()
            self.repository.update(script)
            
            # 에러 알림 전송
            try:
                await websocket_notification_service.notify_upload_error(
                    script_id, str(e), {"id": script.id, "title": script.title}
                )
            except Exception as notify_error:
                print(f"WebSocket 에러 알림 전송 실패: {notify_error}")
            
            raise YouTubeUploadError(str(e))

    def get_upload_status(self, script_id: int) -> dict:
        """업로드 상태 조회"""
        script = self.repository.get_by_id(script_id)
        if not script:
            raise ScriptNotFoundError(script_id)

        result = {
            "id": script.id,
            "title": script.title,
            "status": script.status,
            "created_at": script.created_at,
            "updated_at": script.updated_at,
            "has_video_file": bool(
                script.video_file_path and os.path.exists(script.video_file_path)
            ),
            "youtube_video_id": script.youtube_video_id,
            "scheduled_time": script.scheduled_time,
        }

        # 파일 정보 추가
        if script.video_file_path and os.path.exists(script.video_file_path):
            result["video_file_info"] = {
                "file_path": script.video_file_path,
                "file_size": os.path.getsize(script.video_file_path),
                "filename": os.path.basename(script.video_file_path),
            }

        # YouTube URL 추가
        if script.youtube_video_id:
            result["youtube_url"] = (
                f"https://www.youtube.com/watch?v={script.youtube_video_id}"
            )

        return result

    def delete_video_file(self, script_id: int) -> dict:
        """업로드된 비디오 파일 삭제"""
        script = self.repository.get_by_id(script_id)
        if not script:
            raise ScriptNotFoundError(script_id)

        if not script.video_file_path:
            raise FileUploadError("삭제할 비디오 파일이 없습니다.")

        file_path = script.video_file_path
        file_existed = os.path.exists(file_path)

        try:
            # 파일 삭제
            if file_existed:
                os.remove(file_path)

            # DB 업데이트
            old_status = script.status
            script.video_file_path = None

            # 상태 조정
            if script.status == "video_ready":
                script.status = "script_ready"
            # uploaded나 scheduled 상태는 유지 (YouTube에는 이미 업로드됨)

            script.updated_at = datetime.utcnow()

            updated_script = self.repository.update(script)

            return {
                "id": updated_script.id,
                "title": updated_script.title,
                "previous_status": old_status,
                "current_status": updated_script.status,
                "file_path": file_path,
                "file_existed": file_existed,
                "message": "비디오 파일 삭제 완료",
                "note": (
                    "YouTube에 업로드된 비디오는 영향받지 않습니다."
                    if script.youtube_video_id
                    else None
                ),
            }

        except Exception as e:
            raise FileUploadError(f"파일 삭제 실패: {str(e)}")

    async def get_upload_progress(self, script_id: int) -> dict:
        """업로드 진행률 조회"""
        script = self.repository.get_by_id(script_id)
        if not script:
            raise ScriptNotFoundError(script_id)

        # 기본 진행률 정보
        progress = {
            "script_id": script.id,
            "title": script.title,
            "status": script.status,
            "progress_percentage": 0,
            "current_step": "",
            "total_steps": 3,  # script_ready -> video_ready -> uploaded
            "estimated_time_remaining": None,
            "created_at": script.created_at,
            "updated_at": script.updated_at
        }

        # 상태별 진행률 계산
        if script.status == "script_ready":
            progress["progress_percentage"] = 33
            progress["current_step"] = "대본 준비 완료 - 비디오 업로드 대기 중"
        elif script.status == "video_ready":
            progress["progress_percentage"] = 66
            progress["current_step"] = "비디오 업로드 완료 - YouTube 업로드 대기 중"
        elif script.status in ["uploaded", "scheduled"]:
            progress["progress_percentage"] = 100
            progress["current_step"] = "YouTube 업로드 완료"
        elif script.status == "error":
            progress["progress_percentage"] = 0
            progress["current_step"] = "오류 발생 - 재시도 필요"

        # 파일 정보 추가
        if script.video_file_path and os.path.exists(script.video_file_path):
            file_size = os.path.getsize(script.video_file_path)
            progress["video_file_info"] = {
                "file_size": file_size,
                "file_size_mb": round(file_size / (1024 * 1024), 2),
                "filename": os.path.basename(script.video_file_path)
            }

        # YouTube 정보 추가
        if script.youtube_video_id:
            progress["youtube_info"] = {
                "video_id": script.youtube_video_id,
                "url": f"https://www.youtube.com/watch?v={script.youtube_video_id}",
                "scheduled_time": script.scheduled_time
            }

        # WebSocket으로 진행률 브로드캐스트
        try:
            await websocket_notification_service.send_upload_progress(script_id, progress)
        except Exception as e:
            print(f"WebSocket 진행률 브로드캐스트 실패: {e}")

        return progress

    def _validate_video_file(self, video_file: UploadFile) -> None:
        """비디오 파일 검증"""
        if not video_file.filename:
            raise FileValidationError("파일명이 없습니다.")

        # 파일 확장자 검증
        file_extension = (
            "." + video_file.filename.split(".")[-1].lower()
            if "." in video_file.filename
            else ""
        )

        if file_extension not in self.settings.allowed_video_extensions:
            raise FileValidationError(
                f"YouTube FHD 최적화 권장 형식만 지원됩니다. "
                f"MP4 (H.264 1920×1080, AAC-LC 48kHz) 형식을 사용해주세요."
            )

        # 파일 크기 검증 
        if hasattr(video_file, 'size') and video_file.size:
            if video_file.size > self.settings.max_video_size_bytes:
                size_mb = video_file.size / (1024 * 1024)
                raise FileValidationError(
                    f"파일 크기가 너무 큽니다. 최대 {self.settings.max_video_size_mb}MB까지 업로드 가능합니다. "
                    f"현재 파일 크기: {size_mb:.1f}MB"
                )
        
        # 파일 내용 검증 (첫 바이트를 읽어서 파일이 비어있지 않은지 확인)
        current_position = video_file.file.tell()
        try:
            first_bytes = video_file.file.read(1024)  # 첫 1KB 읽기
            if not first_bytes:
                raise FileValidationError("업로드된 파일이 비어있습니다.")
        finally:
            video_file.file.seek(current_position)  # 파일 포인터 원위치

    def _save_video_file(self, script_id: int, video_file: UploadFile) -> str:
        """비디오 파일 저장"""
        upload_dir = self.settings.upload_dir
        os.makedirs(upload_dir, exist_ok=True)

        # 안전한 파일명 생성
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"script_{script_id}_{timestamp}_{video_file.filename}"
        file_path = os.path.join(upload_dir, safe_filename)

        try:
            # 청크 단위로 파일 저장 (진행률 추적 가능)
            chunk_size = 1024 * 1024  # 1MB 청크
            total_size = 0
            
            with open(file_path, "wb") as buffer:
                while True:
                    chunk = video_file.file.read(chunk_size)
                    if not chunk:
                        break
                    buffer.write(chunk)
                    total_size += len(chunk)
                    
            return file_path
        except Exception as e:
            # 실패시 부분 파일 정리
            if os.path.exists(file_path):
                os.remove(file_path)
            raise FileUploadError(f"파일 저장 실패: {str(e)}")

    def _validate_privacy_status(self, privacy_status: str) -> None:
        """공개 설정 검증"""
        valid_privacy_statuses = ["private", "unlisted", "public"]
        if privacy_status not in valid_privacy_statuses:
            raise FileValidationError(
                f"잘못된 공개 설정입니다. 가능한 값: {', '.join(valid_privacy_statuses)}"
            )

    def _build_upload_metadata(
        self,
        script: Script,
        privacy_status: str,
        category_id: int,
        scheduled_time: Optional[str],
    ) -> dict:
        """업로드 메타데이터 구성"""
        metadata = {
            "title": script.title,
            "description": script.description or "",
            "tags": script.tags or "",
            "category_id": category_id,
            "privacy_status": privacy_status,
        }

        # 예약 발행 시간 설정
        if scheduled_time:
            try:
                scheduled_datetime = datetime.fromisoformat(
                    scheduled_time.replace("Z", "+00:00")
                )
                metadata["scheduled_time"] = scheduled_datetime.isoformat()
                metadata["privacy_status"] = "private"  # 예약 발행시 일단 private
            except ValueError:
                raise FileValidationError(
                    "잘못된 날짜 형식입니다. ISO 8601 형식을 사용하세요 (예: 2025-01-20T14:00:00)"
                )

        return metadata
