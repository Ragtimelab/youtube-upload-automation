"""
간소화된 API 클라이언트
"""
import requests
import streamlit as st
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
import io

import sys
from pathlib import Path

# 상위 디렉토리 import를 위한 경로 설정
parent_dir = Path(__file__).parent.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

from config import Config


class APIError(Exception):
    """API 오류 예외"""
    def __init__(self, message: str, status_code: int = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class APIClient:
    """간소화된 YouTube 자동화 API 클라이언트"""
    
    def __init__(self, base_url: str = None):
        self.base_url = (base_url or Config.API_BASE_URL).rstrip('/')
        self.session = requests.Session()
        self.session.timeout = Config.API_TIMEOUT
    
    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """API 요청 처리"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.session.request(method, url, **kwargs)
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
    
    # ===================
    # 시스템 상태 API
    # ===================
    
    def health_check(self) -> Dict[str, Any]:
        """시스템 상태 확인"""
        try:
            return self._request("GET", "/health")
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    def get_upload_health(self) -> Dict[str, Any]:
        """업로드 시스템 상태 확인"""
        try:
            return self._request("GET", "/api/upload/health")
        except Exception as e:
            return {"upload_system": "error", "error": str(e)}
    
    # ===================
    # 스크립트 관리 API
    # ===================
    
    def get_scripts(self, limit: int = 100, status: Optional[str] = None) -> Dict[str, Any]:
        """스크립트 목록 조회"""
        params = {"limit": limit}
        if status:
            params["status"] = status
        return self._request("GET", "/api/scripts/", params=params)
    
    def get_script(self, script_id: int) -> Dict[str, Any]:
        """특정 스크립트 조회"""
        return self._request("GET", f"/api/scripts/{script_id}")
    
    def upload_script(self, file_content: Union[str, io.BytesIO], filename: str) -> Dict[str, Any]:
        """스크립트 파일 업로드"""
        if isinstance(file_content, str):
            file_content = io.BytesIO(file_content.encode('utf-8'))
        
        files = {'file': (filename, file_content, 'text/plain')}
        return self._request("POST", "/api/scripts/upload", files=files)
    
    def update_script(self, script_id: int, **kwargs) -> Dict[str, Any]:
        """스크립트 메타데이터 수정"""
        data = {k: v for k, v in kwargs.items() if v is not None}
        return self._request("PUT", f"/api/scripts/{script_id}", data=data)
    
    def delete_script(self, script_id: int) -> Dict[str, Any]:
        """스크립트 삭제"""
        return self._request("DELETE", f"/api/scripts/{script_id}")
    
    def get_script_stats(self) -> Dict[str, Any]:
        """스크립트 통계 조회"""
        return self._request("GET", "/api/scripts/stats/summary")
    
    # ===================
    # 업로드 관리 API
    # ===================
    
    def upload_video_file(self, script_id: int, video_file: io.BytesIO, filename: str) -> Dict[str, Any]:
        """비디오 파일 업로드"""
        files = {'video_file': (filename, video_file, 'video/mp4')}
        return self._request("POST", f"/api/upload/video/{script_id}", files=files)
    
    def upload_to_youtube(self, script_id: int, **kwargs) -> Dict[str, Any]:
        """YouTube 업로드"""
        data = {k: v for k, v in kwargs.items() if v is not None}
        return self._request("POST", f"/api/upload/youtube/{script_id}", data=data)
    
    def get_upload_status(self, script_id: int) -> Dict[str, Any]:
        """업로드 상태 조회"""
        return self._request("GET", f"/api/upload/status/{script_id}")
    
    def delete_video_file(self, script_id: int) -> Dict[str, Any]:
        """비디오 파일 삭제"""
        return self._request("DELETE", f"/api/upload/video/{script_id}")
    
    # ===================
    # 편의 메소드
    # ===================
    
    def get_scripts_by_status(self, status: str) -> List[Dict[str, Any]]:
        """상태별 스크립트 목록 조회"""
        result = self.get_scripts(status=status, limit=1000)
        return result.get('scripts', [])
    
    def get_ready_for_video_upload(self) -> List[Dict[str, Any]]:
        """비디오 업로드 준비된 스크립트"""
        return self.get_scripts_by_status("script_ready")
    
    def get_ready_for_youtube_upload(self) -> List[Dict[str, Any]]:
        """YouTube 업로드 준비된 스크립트"""
        return self.get_scripts_by_status("video_ready")
    


@st.cache_resource
def get_api_client() -> APIClient:
    """캐시된 API 클라이언트 인스턴스 반환"""
    return APIClient()