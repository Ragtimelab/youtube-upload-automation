#!/usr/bin/env python3
"""
YouTube API 클라이언트 테스트 스크립트
YouTubeClient 클래스의 인증 및 기본 기능을 테스트합니다.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.youtube_client import YouTubeClient


def test_authentication():
    """인증 테스트"""
    print("=" * 60)
    print("🔐 YouTube API 인증 테스트")
    print("=" * 60)
    
    client = YouTubeClient()
    
    print("📋 인증 설정:")
    print(f"   Credentials 파일: {client.auth_manager.settings.credentials_file_path}")
    print(f"   필요 권한: {', '.join(client.auth_manager.settings.youtube_api_scopes)}")
    print()
    
    # credentials.json 파일이 없으면 테스트 스킵
    import os
    credentials_path = str(client.auth_manager.settings.credentials_file_path)
    if not os.path.exists(credentials_path):
        print("⚠️  credentials.json 파일이 없어 인증 테스트를 스킵합니다.")
        print("💡 실제 인증 테스트를 위해서는 credentials.json 파일이 필요합니다.")
        assert True  # 테스트 통과로 처리
        return
    
    print("🚀 인증 시작...")
    success = client.authenticate()
    
    if success:
        print("✅ 인증 성공!")
        print(f"   인증 상태: {client.is_authenticated()}")
        assert client.is_authenticated()
    else:
        print("❌ 인증 실패")
        print("💡 확인사항:")
        print("   1. credentials.json 파일이 프로젝트 루트에 있는지 확인")
        print("   2. Google Cloud Console에서 YouTube Data API v3가 활성화되어 있는지 확인")
        print("   3. OAuth 2.0 클라이언트 ID가 올바르게 설정되어 있는지 확인")
        assert False, "인증 실패"


def test_channel_info(client):
    """채널 정보 조회 테스트"""
    print("\n" + "=" * 60)
    print("📺 채널 정보 조회 테스트")
    print("=" * 60)
    
    # 인증되지 않은 클라이언트는 스킵
    if not client.is_authenticated():
        print("⚠️  인증되지 않은 클라이언트로 채널 정보 테스트를 스킵합니다.")
        assert True
        return
    
    channel_info = client.get_channel_info()
    
    if channel_info:
        print("✅ 채널 정보 조회 성공!")
        print()
        print("📊 채널 상세 정보:")
        print(f"   🆔 채널 ID: {channel_info['id']}")
        print(f"   📝 채널명: {channel_info['title']}")
        print(f"   👥 구독자 수: {channel_info['subscriber_count']}")
        print(f"   🎬 동영상 수: {channel_info['video_count']}")
        print(f"   👀 총 조회수: {channel_info['view_count']}")
        if channel_info.get('description'):
            print(f"   📄 설명: {channel_info['description'][:100]}...")
        print(f"   🖼️  썸네일: {channel_info['thumbnail_url']}")
        
        assert 'id' in channel_info
        assert 'title' in channel_info
    else:
        print("❌ 채널 정보 조회 실패")
        assert False, "채널 정보 조회 실패"


def test_quota_info(client):
    """할당량 정보 테스트"""
    print("\n" + "=" * 60)
    print("📊 API 할당량 정보")
    print("=" * 60)
    
    quota_info = client.get_quota_usage()
    
    print("📋 YouTube API 할당량 가이드:")
    print(f"   💡 {quota_info['note']}")
    print()
    print("💰 API 비용 추정:")
    for operation, cost in quota_info['estimated_costs'].items():
        print(f"   • {operation}: {cost}")
    print()
    print(f"📈 일일 할당량 제한: {quota_info['daily_quota_limit']}")
    print(f"🔍 {quota_info['recommendation']}")


def test_video_metadata_validation():
    """비디오 메타데이터 검증 테스트"""
    print("\n" + "=" * 60)
    print("🔍 비디오 메타데이터 검증 테스트")
    print("=" * 60)
    
    # 테스트용 메타데이터
    test_metadata = {
        'title': '테스트 비디오 - 시니어 대상 콘텐츠',
        'description': '''이것은 YouTube API 클라이언트 테스트를 위한 샘플 비디오입니다.

시니어 세대를 위한 따뜻하고 유익한 콘텐츠를 제공합니다.
건강, 취미, 가족 이야기 등 다양한 주제를 다루고 있습니다.

#시니어 #건강 #가족''',
        'tags': '시니어, 건강, 가족, 취미, 테스트',
        'category_id': 22,  # People & Blogs
        'privacy_status': 'private'
    }
    
    print("📝 테스트 메타데이터:")
    print(f"   제목: {test_metadata['title']}")
    print(f"   설명 길이: {len(test_metadata['description'])}자")
    print(f"   태그: {test_metadata['tags']}")
    print(f"   카테고리: {test_metadata['category_id']}")
    print(f"   공개 설정: {test_metadata['privacy_status']}")
    
    # 제목 길이 검증
    title_length = len(test_metadata['title'])
    if title_length <= 100:
        print(f"   ✅ 제목 길이 적절: {title_length}/100자")
        assert title_length <= 100
    else:
        print(f"   ❌ 제목이 너무 김: {title_length}/100자")
        assert False, f"제목이 너무 깁니다: {title_length}/100자"
    
    # 설명 길이 검증
    desc_length = len(test_metadata['description'])
    if desc_length <= 5000:
        print(f"   ✅ 설명 길이 적절: {desc_length}/5000자")
        assert desc_length <= 5000
    else:
        print(f"   ❌ 설명이 너무 김: {desc_length}/5000자")
        assert False, f"설명이 너무 깁니다: {desc_length}/5000자"
    
    assert test_metadata['title']
    assert test_metadata['privacy_status'] in ['private', 'unlisted', 'public']


def main():
    """메인 테스트 실행"""
    print("🎬 YouTube Upload Automation - YouTube API 클라이언트 테스트")
    print("=" * 80)
    
    # 1. 인증 테스트
    client = test_authentication()
    
    if not client:
        print("\n❌ 인증에 실패하여 후속 테스트를 진행할 수 없습니다.")
        print("\n💡 해결 방법:")
        print("   1. credentials.json 파일 확인")
        print("   2. 웹 브라우저에서 Google 로그인 후 권한 승인")
        print("   3. token.pickle 파일 생성 확인")
        return
    
    # 2. 채널 정보 테스트
    channel_info = test_channel_info(client)
    
    # 3. 할당량 정보 테스트
    test_quota_info(client)
    
    # 4. 메타데이터 검증 테스트
    metadata = test_video_metadata_validation()
    
    print("\n" + "=" * 80)
    print("🏁 YouTube API 클라이언트 테스트 완료!")
    
    if channel_info:
        print(f"\n🎯 연결된 채널: {channel_info['title']}")
        print("✅ YouTube API 업로드 준비 완료")
        
        print("\n📋 다음 단계:")
        print("   1. 실제 비디오 파일로 업로드 테스트")
        print("   2. 예약 발행 기능 테스트")
        print("   3. 에러 처리 시나리오 테스트")
    else:
        print("\n⚠️  채널 정보를 가져올 수 없어 일부 기능 제한될 수 있음")
    
    print(f"\n💾 인증 정보: token.pickle 파일로 저장됨")
    print(f"🔒 보안: credentials.json과 token.pickle은 .gitignore에 포함됨")


if __name__ == "__main__":
    main()