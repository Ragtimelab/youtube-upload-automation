# 📺 YouTube 채널 정보

## 업로드 대상 채널
- **채널 ID**: UC9Ng3G-y6A-PtPuIddjIcMg  
- **YouTube Studio**: https://studio.youtube.com/channel/UC9Ng3G-y6A-PtPuIddjIcMg
- **콘텐츠 타겟**: 50-80세 시니어층 대상 콘텐츠
- **업로드 목적**: 자동화된 콘텐츠 업로드 및 관리

## OAuth 2.0 인증 설정
1. Google Cloud Console에서 해당 채널에 대한 OAuth 동의 필요
2. credentials.json 파일이 이 채널에 대한 액세스 권한을 가져야 함
3. token.pickle 파일 재생성 시 올바른 채널 연결 확인 필요

## 테스트 방법
```bash
# 채널 연결 테스트
poetry run python test_youtube_auth.py

# 채널 정보 확인
poetry run python test_youtube_client.py
```

## 주의사항
- 업로드 전 반드시 올바른 채널 연결 확인
- API 할당량 관리 필요 (일일 제한 확인)
- 시니어 대상 콘텐츠 가이드라인 준수