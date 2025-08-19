# 🔌 API 문서

> **YouTube 업로드 자동화 시스템 REST API 가이드**

## 📋 목차

- [API 개요](#-api-개요)
- [인증](#-인증)
- [스크립트 관리](#-스크립트-관리-api)
- [업로드 관리](#-업로드-관리-api)
- [WebSocket](#-websocket-api)
- [시스템](#-시스템-api)
- [오류 처리](#-오류-처리)
- [예제 코드](#-예제-코드)

---

## 🌐 API 개요

### 기본 정보

- **Base URL**: `http://localhost:8000`
- **API 버전**: v1
- **데이터 형식**: JSON
- **문자 인코딩**: UTF-8

### 지원 HTTP 메서드

- `GET`: 데이터 조회
- `POST`: 데이터 생성/업로드
- `PUT`: 데이터 수정
- `DELETE`: 데이터 삭제

### 표준화된 응답 형식

모든 API 엔드포인트는 일관된 응답 형식을 사용합니다:

#### 성공 응답

```json
{
  "success": true,
  "message": "작업이 성공적으로 완료되었습니다",
  "timestamp": "2025-08-19T16:58:53.321429+00:00",
  "data": {
    // 실제 데이터 객체
  }
}
```

#### 목록 응답 (페이지네이션)

```json
{
  "success": true,
  "message": "대본 목록을 조회했습니다. (총 5개)",
  "timestamp": "2025-08-19T16:58:53.321429+00:00",
  "data": [
    // 데이터 배열
  ],
  "pagination": {
    "total": 5,
    "count": 5,
    "skip": 0,
    "limit": 100,
    "has_more": false
  }
}
```

#### 에러 응답

```json
{
  "success": false,
  "message": "대본 파싱 실패: 대본 내용이 없습니다",
  "timestamp": "2025-08-19T16:58:53.379383+00:00",
  "error_code": "ScriptParsingError",
  "error_details": null
}
```

### JSON 직렬화 시스템

모든 SQLAlchemy 모델은 JSON 직렬화를 위해 dictionary로 변환됩니다:

#### Script 모델 필드

- **상세 조회** (`GET /api/scripts/{id}`)에서는 모든 필드 포함
- **목록 조회** (`GET /api/scripts/`)에서는 요약 필드만 포함

**상세 필드:**
```json
{
  "id": 1,
  "title": "스크립트 제목",
  "content": "전체 스크립트 내용",
  "description": "비디오 설명",
  "tags": "태그1, 태그2",
  "thumbnail_text": "썸네일 텍스트",
  "imagefx_prompt": "AI 프롬프트",
  "status": "script_ready",
  "video_file_path": null,
  "youtube_video_id": null,
  "scheduled_time": null,
  "created_at": "2025-08-17T10:30:00",
  "updated_at": "2025-08-17T10:30:00"
}
```

**요약 필드 (목록용):**
```json
{
  "id": 1,
  "title": "스크립트 제목",
  "status": "script_ready",
  "created_at": "2025-08-17T10:30:00",
  "updated_at": "2025-08-17T10:30:00",
  "has_video": false,
  "youtube_uploaded": false
}
```

---

## 🔐 인증

### YouTube API 인증

YouTube 업로드를 위한 OAuth 2.0 인증이 필요합니다.

```bash
# 인증 상태 확인
GET /api/auth/youtube/status

# 응답 예시
{
  "status": "success",
  "data": {
    "authenticated": true,
    "channel_title": "내 채널",
    "channel_id": "UCxxxxxxxxxxxxxxx"
  }
}
```

---

## 📝 스크립트 관리 API

### 스크립트 목록 조회

```bash
GET /api/scripts/
```

**Query Parameters:**

- `skip` (int): 건너뛸 개수 (기본값: 0)
- `limit` (int): 가져올 개수 (기본값: 100, 최대: 1000)
- `status` (string): 상태 필터 (script_ready, video_ready, uploaded, error)

**응답:**

```json
{
  "success": true,
  "message": "대본 목록을 조회했습니다. (총 10개)",
  "timestamp": "2025-08-19T16:58:53.321429+00:00",
  "data": [
    {
      "id": 1,
      "title": "비디오 제목",
      "status": "script_ready",
      "created_at": "2025-08-17T10:30:00",
      "updated_at": "2025-08-17T10:30:00",
      "has_video": false,
      "youtube_uploaded": false
    }
  ],
  "pagination": {
    "total": 10,
    "count": 1,
    "skip": 0,
    "limit": 100,
    "has_more": true
  }
}
```

### 단일 스크립트 조회

```bash
GET /api/scripts/{script_id}
```

**응답:**

```json
{
  "success": true,
  "message": "대본을 조회했습니다. (ID: 1)",
  "timestamp": "2025-08-19T16:58:53.335763+00:00",
  "data": {
    "id": 1,
    "title": "비디오 제목",
    "content": "스크립트 내용",
    "description": "비디오 설명",
    "tags": "태그1, 태그2",
    "thumbnail_text": "썸네일 텍스트",
    "imagefx_prompt": "AI 프롬프트",
    "status": "script_ready",
    "video_file_path": null,
    "youtube_video_id": null,
    "scheduled_time": null,
    "created_at": "2025-08-17T10:30:00",
    "updated_at": "2025-08-17T10:30:00"
  }
}
```

### 스크립트 업로드

```bash
POST /api/scripts/upload
Content-Type: multipart/form-data
```

**Form Data:**

- `file`: 스크립트 파일 (.txt, .md)

**응답:**

```json
{
  "success": true,
  "message": "대본이 성공적으로 업로드되었습니다.",
  "timestamp": "2025-08-19T16:58:53.335763+00:00",
  "data": {
    "id": 1,
    "title": "추출된 제목",
    "status": "script_ready",
    "filename": "script.txt",
    "created_at": "2025-08-19T16:58:53.328977"
  }
}
```

### 스크립트 수정

```bash
PUT /api/scripts/{script_id}
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "수정된 제목",
  "description": "수정된 설명",
  "tags": "새로운, 태그"
}
```

### 스크립트 삭제

```bash
DELETE /api/scripts/{script_id}
```

**응답:**

```json
{
  "status": "success",
  "message": "스크립트 삭제 완료"
}
```

### 스크립트 통계

```bash
GET /api/scripts/stats/summary
```

**응답:**

```json
{
  "status": "success",
  "data": {
    "total_scripts": 25,
    "script_ready": 5,
    "video_ready": 3,
    "uploaded": 15,
    "error": 2,
    "success_rate": 75.0
  }
}
```

---

## 🎬 업로드 관리 API

### 비디오 파일 업로드

```bash
POST /api/upload/video/{script_id}
Content-Type: multipart/form-data
```

**Form Data:**

- `file`: 비디오 파일 (.mp4, .avi, .mov, .mkv, .webm, 최대 8GB)

**응답:**

```json
{
  "status": "success",
  "data": {
    "script_id": 1,
    "file_path": "/uploads/videos/script_1_video.mp4",
    "file_size": 1073741824
  },
  "message": "비디오 업로드 완료"
}
```

### YouTube 업로드

```bash
POST /api/upload/youtube/{script_id}
Content-Type: application/json
```

**Request Body:**

```json
{
  "privacy_status": "private",
  "category_id": 22,
  "made_for_kids": false
}
```

**Privacy Status 옵션:**

- `private`: 비공개
- `unlisted`: 링크 공유
- `public`: 공개

**Category ID 옵션:**

- `22`: People & Blogs (기본값)
- `24`: Entertainment
- `26`: Howto & Style
- `27`: Education
- `28`: Science & Technology

**응답:**

```json
{
  "status": "success",
  "data": {
    "script_id": 1,
    "youtube_video_id": "dQw4w9WgXcQ",
    "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "upload_time": "2025-08-17T10:30:00Z"
  },
  "message": "YouTube 업로드 완료"
}
```

### 업로드 상태 조회

```bash
GET /api/upload/status/{script_id}
```

**응답:**

```json
{
  "status": "success",
  "data": {
    "script_id": 1,
    "current_status": "uploaded",
    "video_uploaded": true,
    "youtube_uploaded": true,
    "youtube_video_id": "dQw4w9WgXcQ",
    "last_updated": "2025-08-17T10:30:00Z"
  }
}
```

### 업로드 진행률 조회

```bash
GET /api/upload/progress/{script_id}
```

**응답:**

```json
{
  "status": "success",
  "data": {
    "script_id": 1,
    "progress_percentage": 75,
    "current_step": "uploading_to_youtube",
    "estimated_remaining": "2 minutes",
    "bytes_uploaded": 805306368,
    "total_bytes": 1073741824
  }
}
```

### 비디오 파일 삭제

```bash
DELETE /api/upload/video/{script_id}
```

**응답:**

```json
{
  "status": "success",
  "message": "비디오 파일 삭제 완료"
}
```

---

## 🌐 WebSocket API

### WebSocket 연결

```
WS /ws
```

**연결 파라미터:**

- `user_id` (query): 사용자 식별자

**예시:**

```javascript
const ws = new WebSocket('ws://localhost:8000/ws?user_id=user123');
```

### 메시지 프로토콜

#### 클라이언트 → 서버

**스크립트 구독:**

```json
{
  "type": "subscribe_script",
  "script_id": 1
}
```

**스크립트 구독 해제:**

```json
{
  "type": "unsubscribe_script",
  "script_id": 1
}
```

**상태 확인:**

```json
{
  "type": "get_script_status",
  "script_id": 1
}
```

**연결 확인:**

```json
{
  "type": "ping"
}
```

#### 서버 → 클라이언트

**업로드 진행률:**

```json
{
  "type": "upload_progress",
  "script_id": 1,
  "data": {
    "progress_percentage": 50,
    "current_step": "uploading_video",
    "bytes_uploaded": 536870912,
    "total_bytes": 1073741824
  },
  "timestamp": "2025-08-17T10:30:00Z"
}
```

**업로드 완료:**

```json
{
  "type": "upload_completed",
  "script_id": 1,
  "data": {
    "youtube_video_id": "dQw4w9WgXcQ",
    "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  "timestamp": "2025-08-17T10:30:00Z"
}
```

**오류 알림:**

```json
{
  "type": "upload_error",
  "script_id": 1,
  "data": {
    "error_message": "YouTube API 할당량 초과",
    "error_code": "quota_exceeded"
  },
  "timestamp": "2025-08-17T10:30:00Z"
}
```

### WebSocket 통계

```bash
GET /ws/stats
```

**응답:**

```json
{
  "status": "success",
  "data": {
    "active_connections": 3,
    "total_connections": 15,
    "subscriptions": {
      "script_1": 2,
      "script_2": 1
    }
  }
}
```

---

## 🔧 시스템 API

### 헬스 체크

```bash
GET /health
```

**응답:**

```json
{
  "status": "healthy",
  "timestamp": "2025-08-17T10:30:00Z",
  "version": "1.0.0",
  "database": "connected",
  "youtube_api": "authenticated"
}
```

### API 상태

```bash
GET /
```

**응답:**

```json
{
  "message": "YouTube 업로드 자동화 API",
  "version": "1.0.0",
  "docs_url": "/docs",
  "timestamp": "2025-08-17T10:30:00Z"
}
```

---

## ❌ 오류 처리

### HTTP 상태 코드

- `200`: 성공
- `201`: 생성 완료
- `400`: 잘못된 요청
- `401`: 인증 필요
- `404`: 리소스 없음
- `422`: 유효성 검사 실패
- `500`: 서버 오류

### 오류 응답 형식

```json
{
  "status": "error",
  "error": {
    "code": "SCRIPT_NOT_FOUND",
    "message": "스크립트를 찾을 수 없습니다",
    "details": "ID 999에 해당하는 스크립트가 존재하지 않습니다"
  },
  "timestamp": "2025-08-17T10:30:00Z"
}
```

### 주요 오류 코드

- `SCRIPT_NOT_FOUND`: 스크립트 없음
- `SCRIPT_PARSING_ERROR`: 스크립트 파싱 실패
- `FILE_VALIDATION_ERROR`: 파일 검증 실패
- `INVALID_SCRIPT_STATUS`: 잘못된 상태 전환
- `YOUTUBE_AUTH_ERROR`: YouTube 인증 실패
- `YOUTUBE_UPLOAD_ERROR`: YouTube 업로드 실패
- `DATABASE_ERROR`: 데이터베이스 오류
- `QUOTA_EXCEEDED`: API 할당량 초과

---

## 💻 예제 코드

### Python 예제

```python
import requests
import json

# API 클라이언트 클래스
class YouTubeAutomationAPI:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        
    def upload_script(self, file_path):
        """스크립트 파일 업로드"""
        with open(file_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(f"{self.base_url}/api/scripts/upload", files=files)
        return response.json()
    
    def upload_video(self, script_id, video_path):
        """비디오 파일 업로드"""
        with open(video_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(f"{self.base_url}/api/upload/video/{script_id}", files=files)
        return response.json()
    
    def upload_to_youtube(self, script_id, privacy="private"):
        """YouTube 업로드"""
        data = {"privacy_status": privacy, "category_id": 22}
        response = requests.post(f"{self.base_url}/api/upload/youtube/{script_id}", json=data)
        return response.json()

# 사용 예시
api = YouTubeAutomationAPI()

# 1. 스크립트 업로드
result = api.upload_script("my_script.txt")
script_id = result['data']['script_id']

# 2. 비디오 업로드
api.upload_video(script_id, "my_video.mp4")

# 3. YouTube 업로드
api.upload_to_youtube(script_id, "private")
```

### JavaScript 예제

```javascript
// API 클라이언트 클래스
class YouTubeAutomationAPI {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }
    
    async uploadScript(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${this.baseUrl}/api/scripts/upload`, {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
    }
    
    async getScripts(skip = 0, limit = 100) {
        const response = await fetch(`${this.baseUrl}/api/scripts/?skip=${skip}&limit=${limit}`);
        return await response.json();
    }
    
    async uploadToYoutube(scriptId, privacy = 'private') {
        const response = await fetch(`${this.baseUrl}/api/upload/youtube/${scriptId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                privacy_status: privacy,
                category_id: 22
            })
        });
        
        return await response.json();
    }
}

// WebSocket 예시
const ws = new WebSocket('ws://localhost:8000/ws?user_id=user123');

ws.onopen = () => {
    console.log('WebSocket 연결됨');
    
    // 스크립트 구독
    ws.send(JSON.stringify({
        type: 'subscribe_script',
        script_id: 1
    }));
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('메시지 수신:', message);
    
    if (message.type === 'upload_progress') {
        updateProgressBar(message.data.progress_percentage);
    }
};
```

### cURL 예제

```bash
# 스크립트 업로드
curl -X POST "http://localhost:8000/api/scripts/upload" \
     -F "file=@my_script.txt"

# 스크립트 목록 조회
curl -X GET "http://localhost:8000/api/scripts/?limit=10"

# 비디오 업로드
curl -X POST "http://localhost:8000/api/upload/video/1" \
     -F "file=@my_video.mp4"

# YouTube 업로드
curl -X POST "http://localhost:8000/api/upload/youtube/1" \
     -H "Content-Type: application/json" \
     -d '{"privacy_status": "private", "category_id": 22}'

# 업로드 상태 확인
curl -X GET "http://localhost:8000/api/upload/status/1"
```

---

## 📚 추가 정보

### API 문서 (Swagger)

- **URL**: `http://localhost:8000/docs`
- **Interactive**: 브라우저에서 직접 API 테스트 가능
- **스키마**: OpenAPI 3.0 호환

### 할당량 제한

- **YouTube API**: 일일 10,000 units
- **업로드당 소모**: 1,600 units
- **최대 일일 업로드**: 6개 비디오

### 파일 크기 제한

- **스크립트 파일**: 최대 100MB
- **비디오 파일**: 최대 8GB
- **지원 형식**: .mp4, .avi, .mov, .mkv, .webm

---

**API 문서 버전**: 1.0.0  
**마지막 업데이트**: 2025-08-17
