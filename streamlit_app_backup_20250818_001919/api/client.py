"""
완전한 YouTube 자동화 API 클라이언트

백엔드의 모든 API 엔드포인트를 지원하는 클라이언트 클래스
"""

import requests
import streamlit as st
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
import io


class APIError(Exception):
    """API 오류 예외"""
    def __init__(self, message: str, status_code: int = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class YouTubeAutomationAPI:
    """YouTube 자동화 API 클라이언트"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.timeout = 30
    
    def _handle_response(self, response: requests.Response) -> Dict[str, Any]:
        """API 응답 처리"""
        try:
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            try:
                error_data = response.json()
                error_msg = error_data.get('detail', str(e))
            except:
                error_msg = f"HTTP {response.status_code}: {response.text}"
            raise APIError(error_msg, response.status_code)
        except requests.exceptions.RequestException as e:
            raise APIError(f"요청 오류: {str(e)}")
    
    # ===============================
    # 시스템 상태 API
    # ===============================
    
    def health_check(self) -> Dict[str, Any]:
        """시스템 상태 확인"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            return {"status": "healthy", "data": self._handle_response(response)}
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    def get_api_status(self) -> Dict[str, Any]:
        """API 루트 상태 확인"""
        try:
            response = self.session.get(f"{self.base_url}/")
            return {"status": "healthy", "data": self._handle_response(response)}
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    # ===============================
    # 스크립트 관리 API
    # ===============================
    
    def upload_script(self, file_path: Union[str, Path, io.BytesIO], filename: str = None) -> Dict[str, Any]:
        """스크립트 파일 업로드"""
        try:
            if isinstance(file_path, (str, Path)):
                with open(file_path, 'rb') as f:
                    files = {'file': (Path(file_path).name, f, 'text/plain')}
                    response = self.session.post(f"{self.base_url}/api/scripts/upload", files=files)
            else:
                # BytesIO 객체인 경우 (Streamlit file uploader)
                files = {'file': (filename or 'script.txt', file_path, 'text/plain')}
                response = self.session.post(f"{self.base_url}/api/scripts/upload", files=files)
            
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"스크립트 업로드 오류: {str(e)}")
    
    def get_scripts(self, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> Dict[str, Any]:
        """스크립트 목록 조회"""
        try:
            params = {"skip": skip, "limit": limit}
            if status:
                params["status"] = status
            
            response = self.session.get(f"{self.base_url}/api/scripts/", params=params)
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"스크립트 목록 조회 오류: {str(e)}")
    
    def get_script(self, script_id: int) -> Dict[str, Any]:
        """특정 스크립트 조회"""
        try:
            response = self.session.get(f"{self.base_url}/api/scripts/{script_id}")
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"스크립트 조회 오류: {str(e)}")
    
    def update_script(self, script_id: int, **kwargs) -> Dict[str, Any]:
        """스크립트 메타데이터 수정"""
        try:
            # None 값 제거
            data = {k: v for k, v in kwargs.items() if v is not None}
            
            response = self.session.put(f"{self.base_url}/api/scripts/{script_id}", data=data)
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"스크립트 수정 오류: {str(e)}")
    
    def delete_script(self, script_id: int) -> Dict[str, Any]:
        """스크립트 삭제"""
        try:
            response = self.session.delete(f"{self.base_url}/api/scripts/{script_id}")
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"스크립트 삭제 오류: {str(e)}")
    
    def get_script_stats(self) -> Dict[str, Any]:
        """스크립트 통계 조회"""
        try:
            response = self.session.get(f"{self.base_url}/api/scripts/stats/summary")
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"스크립트 통계 조회 오류: {str(e)}")
    
    # ===============================
    # 업로드 관리 API  
    # ===============================
    
    def upload_video_file(self, script_id: int, video_file: Union[str, Path, io.BytesIO], filename: str = None) -> Dict[str, Any]:
        """비디오 파일 업로드"""
        try:
            if isinstance(video_file, (str, Path)):
                with open(video_file, 'rb') as f:
                    files = {'video_file': (Path(video_file).name, f, 'video/mp4')}
                    response = self.session.post(f"{self.base_url}/api/upload/video/{script_id}", files=files)
            else:
                # BytesIO 객체인 경우 (Streamlit file uploader)
                files = {'video_file': (filename or 'video.mp4', video_file, 'video/mp4')}
                response = self.session.post(f"{self.base_url}/api/upload/video/{script_id}", files=files)
            
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"비디오 업로드 오류: {str(e)}")
    
    def upload_to_youtube(self, script_id: int, publish_at: Optional[str] = None, 
                         privacy_status: Optional[str] = None, category_id: Optional[int] = None) -> Dict[str, Any]:
        """YouTube 업로드"""
        try:
            data = {}
            if publish_at:
                data['publish_at'] = publish_at
            if privacy_status:
                data['privacy_status'] = privacy_status
            if category_id:
                data['category_id'] = category_id
            
            response = self.session.post(f"{self.base_url}/api/upload/youtube/{script_id}", data=data)
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"YouTube 업로드 오류: {str(e)}")
    
    def get_upload_status(self, script_id: int) -> Dict[str, Any]:
        """업로드 상태 조회"""
        try:
            response = self.session.get(f"{self.base_url}/api/upload/status/{script_id}")
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"업로드 상태 조회 오류: {str(e)}")
    
    def delete_video_file(self, script_id: int) -> Dict[str, Any]:
        """비디오 파일 삭제"""
        try:
            response = self.session.delete(f"{self.base_url}/api/upload/video/{script_id}")
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"비디오 파일 삭제 오류: {str(e)}")
    
    def get_upload_progress(self, script_id: int) -> Dict[str, Any]:
        """업로드 진행률 조회"""
        try:
            response = self.session.get(f"{self.base_url}/api/upload/progress/{script_id}")
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"업로드 진행률 조회 오류: {str(e)}")
    
    def get_upload_health(self) -> Dict[str, Any]:
        """업로드 시스템 상태 확인"""
        try:
            response = self.session.get(f"{self.base_url}/api/upload/health")
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"업로드 시스템 상태 확인 오류: {str(e)}")
    
    # ===============================
    # WebSocket 관리 API
    # ===============================
    
    def get_websocket_stats(self) -> Dict[str, Any]:
        """WebSocket 연결 통계"""
        try:
            response = self.session.get(f"{self.base_url}/ws/stats")
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"WebSocket 통계 조회 오류: {str(e)}")
    
    def broadcast_message(self, message: str, message_type: str = "system_notification") -> Dict[str, Any]:
        """브로드캐스트 메시지 전송"""
        try:
            data = {
                "message": message,
                "message_type": message_type
            }
            response = self.session.post(f"{self.base_url}/ws/broadcast", json=data)
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"브로드캐스트 오류: {str(e)}")
    
    def notify_script(self, script_id: int, message: str, message_type: str = "script_update") -> Dict[str, Any]:
        """스크립트별 알림 전송"""
        try:
            data = {
                "message": message,
                "message_type": message_type
            }
            response = self.session.post(f"{self.base_url}/ws/notify/script/{script_id}", json=data)
            return self._handle_response(response)
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"스크립트 알림 오류: {str(e)}")
    
    # ===============================
    # 유틸리티 메소드
    # ===============================
    
    def get_scripts_by_status(self, status: str) -> List[Dict[str, Any]]:
        """상태별 스크립트 목록 조회"""
        try:
            result = self.get_scripts(status=status, limit=1000)
            return result.get('scripts', [])
        except APIError:
            raise
        except Exception as e:
            raise APIError(f"상태별 스크립트 조회 오류: {str(e)}")
    
    def get_ready_for_video_upload(self) -> List[Dict[str, Any]]:
        """비디오 업로드 준비된 스크립트 목록"""
        return self.get_scripts_by_status("script_ready")
    
    def get_ready_for_youtube_upload(self) -> List[Dict[str, Any]]:
        """YouTube 업로드 준비된 스크립트 목록"""
        return self.get_scripts_by_status("video_ready")
    
    def get_uploaded_videos(self) -> List[Dict[str, Any]]:
        """업로드 완료된 비디오 목록"""
        return self.get_scripts_by_status("uploaded")
    
    def batch_youtube_upload(self, script_ids: List[int], privacy_status: str = "private") -> List[Dict[str, Any]]:
        """배치 YouTube 업로드"""
        results = []
        for script_id in script_ids:
            try:
                result = self.upload_to_youtube(script_id, privacy_status=privacy_status)
                results.append({"script_id": script_id, "status": "success", "data": result})
            except Exception as e:
                results.append({"script_id": script_id, "status": "error", "error": str(e)})
        return results


# 싱글톤 패턴으로 API 클라이언트 관리
@st.cache_resource
def get_api_client() -> YouTubeAutomationAPI:
    """캐시된 API 클라이언트 인스턴스 반환"""
    return YouTubeAutomationAPI()


def test_api_connection() -> Dict[str, Any]:
    """API 연결 테스트"""
    try:
        api = get_api_client()
        health = api.health_check()
        if health.get("status") == "healthy":
            return {"status": "success", "message": "API 연결 성공"}
        else:
            return {"status": "error", "message": f"API 상태 오류: {health.get('error', 'Unknown error')}"}
    except Exception as e:
        return {"status": "error", "message": f"API 연결 실패: {str(e)}"}