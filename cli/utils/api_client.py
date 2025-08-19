"""
YouTube 자동화 백엔드 API 클라이언트
"""

import json
import os
import sys
from typing import Dict, List, Optional, Any
import requests
from pathlib import Path

# 백엔드 constants 임포트
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))
    
from backend.app.core.constants import FileConstants, NetworkConstants, PaginationConstants


class YouTubeAutomationAPI:
    """백엔드 API 클라이언트"""
    
    def __init__(self, base_url: str = None):
        if base_url is None:
            base_url = os.getenv('YOUTUBE_AUTOMATION_API_URL', NetworkConstants.DEFAULT_API_BASE_URL)
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """HTTP 요청 실행"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            
            if response.headers.get('content-type', '').startswith('application/json'):
                data = response.json()
                
                # 새로운 표준화된 응답 형식 처리
                if isinstance(data, dict) and 'success' in data:
                    if not data.get('success', True):
                        # 에러 응답 처리
                        error_msg = data.get('message', '알 수 없는 오류가 발생했습니다.')
                        error_code = data.get('error_code', 'UNKNOWN_ERROR')
                        raise APIError(f"[{error_code}] {error_msg}")
                    
                    # 성공 응답에서 data 필드 반환 (하위 호환성 위해)
                    return data.get('data', data)
                else:
                    # 레거시 응답 형식 지원
                    return data
            else:
                return {"message": response.text}
                
        except requests.exceptions.HTTPError as e:
            # HTTP 에러 응답 처리
            try:
                error_data = e.response.json()
                if 'message' in error_data:
                    raise APIError(error_data['message'])
            except:
                pass
            raise APIError(f"HTTP {e.response.status_code}: {str(e)}")
        except requests.exceptions.RequestException as e:
            raise APIError(f"네트워크 오류: {str(e)}")
    
    def health_check(self) -> Dict[str, Any]:
        """API 서버 상태 확인"""
        return self._make_request('GET', '/health')
    
    def upload_health_check(self) -> Dict[str, Any]:
        """업로드 시스템 상태 확인"""
        return self._make_request('GET', '/api/upload/health')
    
    # 스크립트 관련 API
    def upload_script(self, file_path: str) -> Dict[str, Any]:
        """대본 파일 업로드"""
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")
        
        if file_path.suffix not in FileConstants.ALLOWED_SCRIPT_EXTENSIONS:
            raise ValueError(f"지원하지 않는 파일 형식입니다. ({', '.join(FileConstants.ALLOWED_SCRIPT_EXTENSIONS)}만 지원)")
        
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'text/plain')}
            
            # Content-Type 헤더 제거 (multipart/form-data를 위해)
            headers = dict(self.session.headers)
            if 'Content-Type' in headers:
                del headers['Content-Type']
            
            response = requests.post(
                f"{self.base_url}/api/scripts/upload",
                files=files,
                headers=headers
            )
            response.raise_for_status()
            return response.json()
    
    def get_scripts(self, skip: int = 0, limit: int = PaginationConstants.DEFAULT_PAGE_LIMIT, status: Optional[str] = None) -> Dict[str, Any]:
        """스크립트 목록 조회"""
        params = {'skip': skip, 'limit': limit}
        if status:
            params['status'] = status
        
        return self._make_request('GET', '/api/scripts/', params=params)
    
    def get_script(self, script_id: int) -> Dict[str, Any]:
        """특정 스크립트 조회"""
        return self._make_request('GET', f'/api/scripts/{script_id}')
    
    def update_script(self, script_id: int, title: str = None, description: str = None, 
                     tags: str = None, thumbnail_text: str = None, imagefx_prompt: str = None) -> Dict[str, Any]:
        """스크립트 메타데이터 수정"""
        data = {}
        if title is not None:
            data['title'] = title
        if description is not None:
            data['description'] = description
        if tags is not None:
            data['tags'] = tags
        if thumbnail_text is not None:
            data['thumbnail_text'] = thumbnail_text
        if imagefx_prompt is not None:
            data['imagefx_prompt'] = imagefx_prompt
        
        response = requests.put(
            f"{self.base_url}/api/scripts/{script_id}",
            data=data
        )
        response.raise_for_status()
        return response.json()
    
    def delete_script(self, script_id: int) -> Dict[str, Any]:
        """스크립트 삭제"""
        return self._make_request('DELETE', f'/api/scripts/{script_id}')
    
    def get_scripts_stats(self) -> Dict[str, Any]:
        """스크립트 통계 조회"""
        return self._make_request('GET', '/api/scripts/stats/summary')
    
    # 업로드 관련 API
    def upload_video(self, script_id: int, video_file_path: str) -> Dict[str, Any]:
        """비디오 파일 업로드"""
        video_path = Path(video_file_path)
        
        if not video_path.exists():
            raise FileNotFoundError(f"비디오 파일을 찾을 수 없습니다: {video_path}")
        
        if video_path.suffix.lower() not in FileConstants.ALLOWED_VIDEO_EXTENSIONS:
            raise ValueError(f"지원하지 않는 비디오 형식입니다. 지원 형식: {', '.join(FileConstants.ALLOWED_VIDEO_EXTENSIONS)}")
        
        with open(video_path, 'rb') as f:
            files = {'video_file': (video_path.name, f, 'video/mp4')}
            
            response = requests.post(
                f"{self.base_url}/api/upload/video/{script_id}",
                files=files
            )
            response.raise_for_status()
            return response.json()
    
    def upload_to_youtube(
        self, 
        script_id: int, 
        publish_at: Optional[str] = None,
        privacy_status: Optional[str] = None,
        category_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """YouTube에 업로드"""
        data = {}
        if publish_at:
            data['publish_at'] = publish_at
        if privacy_status:
            data['privacy_status'] = privacy_status
        if category_id:
            data['category_id'] = category_id
        
        return self._make_request('POST', f'/api/upload/youtube/{script_id}', data=data)
    
    def get_upload_status(self, script_id: int) -> Dict[str, Any]:
        """업로드 상태 조회"""
        return self._make_request('GET', f'/api/upload/status/{script_id}')
    
    def get_upload_progress(self, script_id: int) -> Dict[str, Any]:
        """업로드 진행률 조회"""
        return self._make_request('GET', f'/api/upload/progress/{script_id}')
    
    def delete_video_file(self, script_id: int) -> Dict[str, Any]:
        """비디오 파일 삭제"""
        return self._make_request('DELETE', f'/api/upload/video/{script_id}')
    


class APIError(Exception):
    """API 호출 관련 예외"""
    pass


# 기본 클라이언트 인스턴스
api = YouTubeAutomationAPI()