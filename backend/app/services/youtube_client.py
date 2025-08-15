import os
import pickle
from typing import Optional
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload


class YouTubeClient:
    """YouTube Data API v3 클라이언트
    
    OAuth 2.0 인증을 통해 YouTube API에 접근하고
    비디오 업로드 및 관리 기능을 제공합니다.
    """
    
    SCOPES = [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly'
    ]
    
    def __init__(self, credentials_path: str = "credentials.json"):
        """YouTube 클라이언트 초기화
        
        Args:
            credentials_path: Google Cloud Console에서 다운로드한 credentials.json 경로
        """
        self.credentials_path = credentials_path
        self.youtube = None
        self.credentials = None
        
    def authenticate(self) -> bool:
        """OAuth 2.0 인증 수행
        
        Returns:
            인증 성공 여부
        """
        creds = None
        token_path = 'token.pickle'
        
        # 기존 토큰이 있으면 로드
        if os.path.exists(token_path):
            with open(token_path, 'rb') as token:
                creds = pickle.load(token)
        
        # 유효한 자격증명이 없으면 새로 인증
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                print("🔄 기존 토큰 갱신 중...")
                try:
                    creds.refresh(Request())
                    print("✅ 토큰 갱신 성공")
                except Exception as e:
                    print(f"❌ 토큰 갱신 실패: {e}")
                    creds = None
            
            if not creds:
                print("🔐 새로운 OAuth 인증 시작...")
                
                if not os.path.exists(self.credentials_path):
                    print(f"❌ credentials.json 파일을 찾을 수 없습니다: {self.credentials_path}")
                    print("💡 Google Cloud Console에서 다운로드한 credentials.json 파일을 확인하세요.")
                    return False
                
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_path, self.SCOPES)
                    creds = flow.run_local_server(port=0)
                    print("✅ OAuth 인증 완료")
                except Exception as e:
                    print(f"❌ OAuth 인증 실패: {e}")
                    return False
            
            # 토큰 저장
            try:
                with open(token_path, 'wb') as token:
                    pickle.dump(creds, token)
                print(f"💾 토큰 저장 완료: {token_path}")
            except Exception as e:
                print(f"⚠️  토큰 저장 실패: {e}")
        
        # YouTube API 클라이언트 빌드
        try:
            self.youtube = build('youtube', 'v3', credentials=creds)
            self.credentials = creds
            print("🎬 YouTube API 클라이언트 준비 완료")
            return True
        except Exception as e:
            print(f"❌ YouTube API 클라이언트 생성 실패: {e}")
            return False
    
    def get_channel_info(self) -> Optional[dict]:
        """현재 인증된 채널 정보 조회
        
        Returns:
            채널 정보 딕셔너리 또는 None
        """
        if not self.youtube:
            print("❌ 인증이 필요합니다. authenticate()를 먼저 호출하세요.")
            return None
        
        try:
            request = self.youtube.channels().list(
                part="snippet,contentDetails,statistics",
                mine=True
            )
            response = request.execute()
            
            if response['items']:
                channel = response['items'][0]
                return {
                    'id': channel['id'],
                    'title': channel['snippet']['title'],
                    'description': channel['snippet'].get('description', ''),
                    'subscriber_count': channel['statistics'].get('subscriberCount', '비공개'),
                    'video_count': channel['statistics'].get('videoCount', '0'),
                    'view_count': channel['statistics'].get('viewCount', '0'),
                    'thumbnail_url': channel['snippet']['thumbnails']['default']['url']
                }
            else:
                print("❌ 채널 정보를 찾을 수 없습니다.")
                return None
                
        except Exception as e:
            print(f"❌ 채널 정보 조회 실패: {e}")
            return None
    
    def upload_video(self, video_path: str, metadata: dict) -> Optional[str]:
        """YouTube에 비디오 업로드
        
        Args:
            video_path: 업로드할 비디오 파일 경로
            metadata: 비디오 메타데이터
                - title: 제목 (필수)
                - description: 설명
                - tags: 태그 (문자열 또는 리스트)
                - category_id: 카테고리 ID (기본: 22 - People & Blogs)
                - privacy_status: 공개 설정 (private, unlisted, public)
                - scheduled_time: 예약 발행 시간 (ISO 8601 형식)
        
        Returns:
            업로드된 비디오 ID 또는 None
        """
        if not self.youtube:
            print("❌ 인증이 필요합니다. authenticate()를 먼저 호출하세요.")
            return None
        
        if not os.path.exists(video_path):
            print(f"❌ 비디오 파일을 찾을 수 없습니다: {video_path}")
            return None
        
        # 메타데이터 검증
        if not metadata.get('title'):
            print("❌ 비디오 제목이 필요합니다.")
            return None
        
        # 태그 처리
        tags = metadata.get('tags', '')
        if isinstance(tags, str):
            tags = [tag.strip() for tag in tags.split(',') if tag.strip()]
        elif not isinstance(tags, list):
            tags = []
        
        # 업로드 메타데이터 구성
        body = {
            'snippet': {
                'title': metadata['title'][:100],  # YouTube 제목 길이 제한
                'description': metadata.get('description', '')[:5000],  # YouTube 설명 길이 제한
                'tags': tags[:500],  # 태그 개수 제한
                'categoryId': str(metadata.get('category_id', 22)),  # People & Blogs
                'defaultLanguage': 'ko',
                'defaultAudioLanguage': 'ko'
            },
            'status': {
                'privacyStatus': metadata.get('privacy_status', 'private')
            }
        }
        
        # 예약 발행 시간 설정
        if metadata.get('scheduled_time'):
            body['status']['publishAt'] = metadata['scheduled_time']
            body['status']['privacyStatus'] = 'private'  # 예약 발행시 일단 private
        
        try:
            print(f"📤 비디오 업로드 시작: {video_path}")
            print(f"📝 제목: {metadata['title']}")
            
            # 미디어 파일 업로드 객체 생성
            media = MediaFileUpload(
                video_path,
                chunksize=-1,  # 한 번에 전체 파일 업로드
                resumable=True
            )
            
            # 업로드 요청 실행
            request = self.youtube.videos().insert(
                part=','.join(body.keys()),
                body=body,
                media_body=media
            )
            
            response = request.execute()
            video_id = response['id']
            
            print(f"✅ 업로드 성공! 비디오 ID: {video_id}")
            print(f"🔗 비디오 URL: https://www.youtube.com/watch?v={video_id}")
            
            return video_id
            
        except Exception as e:
            print(f"❌ 비디오 업로드 실패: {e}")
            return None
    
    def get_video_info(self, video_id: str) -> Optional[dict]:
        """비디오 정보 조회
        
        Args:
            video_id: YouTube 비디오 ID
            
        Returns:
            비디오 정보 딕셔너리 또는 None
        """
        if not self.youtube:
            print("❌ 인증이 필요합니다. authenticate()를 먼저 호출하세요.")
            return None
        
        try:
            request = self.youtube.videos().list(
                part="snippet,status,statistics",
                id=video_id
            )
            response = request.execute()
            
            if response['items']:
                video = response['items'][0]
                return {
                    'id': video['id'],
                    'title': video['snippet']['title'],
                    'description': video['snippet']['description'],
                    'published_at': video['snippet']['publishedAt'],
                    'privacy_status': video['status']['privacyStatus'],
                    'upload_status': video['status']['uploadStatus'],
                    'view_count': video['statistics'].get('viewCount', '0'),
                    'like_count': video['statistics'].get('likeCount', '0'),
                    'comment_count': video['statistics'].get('commentCount', '0')
                }
            else:
                print(f"❌ 비디오를 찾을 수 없습니다: {video_id}")
                return None
                
        except Exception as e:
            print(f"❌ 비디오 정보 조회 실패: {e}")
            return None
    
    def is_authenticated(self) -> bool:
        """인증 상태 확인
        
        Returns:
            인증 여부
        """
        return self.youtube is not None and self.credentials is not None
    
    def get_quota_usage(self) -> dict:
        """API 할당량 사용량 정보 (추정치)
        
        Returns:
            할당량 사용량 추정 정보
        """
        # YouTube API는 직접적인 할당량 조회 기능을 제공하지 않음
        # 대략적인 사용량 추정치만 제공
        return {
            "note": "YouTube API는 직접적인 할당량 조회를 지원하지 않습니다.",
            "estimated_costs": {
                "channel_info": "1 unit per request",
                "video_upload": "1600 units per request",
                "video_info": "1 unit per request"
            },
            "daily_quota_limit": "10,000 units (기본)",
            "recommendation": "Google Cloud Console에서 실제 사용량을 확인하세요."
        }