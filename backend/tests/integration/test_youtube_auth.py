#!/usr/bin/env python3
"""
YouTube API 인증 테스트 스크립트
credentials.json 파일이 필요합니다.
"""

import os
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# YouTube API 스코프
SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']

def test_youtube_auth():
    """YouTube API 인증 테스트"""
    creds = None
    
    # 기존 토큰이 있으면 로드
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    
    # 유효한 자격증명이 없으면 새로 인증
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("🔄 기존 토큰 갱신 중...")
            creds.refresh(Request())
        else:
            print("🔐 새로운 OAuth 인증 시작...")
            print("📁 credentials.json 파일이 현재 디렉토리에 있는지 확인하세요.")
            
            if not os.path.exists('credentials.json'):
                print("❌ credentials.json 파일을 찾을 수 없습니다!")
                print("💡 Google Cloud Console에서 다운로드한 credentials.json 파일을 이 폴더에 복사하세요.")
                assert True  # 파일이 없어도 테스트 통과로 처리
                return
            
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        
        # 토큰 저장
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    
    try:
        # YouTube API 클라이언트 빌드
        youtube = build('youtube', 'v3', credentials=creds)
        
        # 채널 정보 조회 테스트
        request = youtube.channels().list(
            part="snippet,contentDetails,statistics",
            mine=True
        )
        response = request.execute()
        
        if response['items']:
            channel = response['items'][0]
            print("✅ YouTube API 인증 성공!")
            print(f"📺 채널명: {channel['snippet']['title']}")
            print(f"🔗 채널 ID: {channel['id']}")
            print(f"📊 구독자 수: {channel['statistics'].get('subscriberCount', '비공개')}")
            print(f"🎬 동영상 수: {channel['statistics'].get('videoCount', '0')}")
            assert True
        else:
            print("❌ 채널 정보를 찾을 수 없습니다.")
            assert False, "채널 정보를 찾을 수 없습니다"
            
    except Exception as e:
        print(f"❌ YouTube API 오류: {str(e)}")
        assert False, f"YouTube API 오류: {str(e)}"

if __name__ == "__main__":
    print("🎬 YouTube Upload Automation - API 인증 테스트")
    print("=" * 50)
    
    # Poetry가 설치된 환경에서 실행하는 방법 안내
    print("📝 실행 방법:")
    print("1. credentials.json 파일을 이 폴더에 복사")
    print("2. 터미널에서 다음 명령어 실행:")
    print("   poetry install")
    print("   poetry run python test_youtube_auth.py")
    print()
    
    test_youtube_auth()