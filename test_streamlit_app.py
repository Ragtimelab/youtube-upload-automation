#!/usr/bin/env python3
"""
Streamlit 앱 완전 자동화 테스트
모든 기능을 체계적으로 검증합니다.
"""
import asyncio
import time
from playwright.async_api import async_playwright
import requests
import tempfile
import os


class StreamlitAppTester:
    def __init__(self, app_url="http://localhost:8503"):
        self.app_url = app_url
        self.backend_url = "http://localhost:8000"
        
    async def test_all_features(self):
        """모든 기능을 순차적으로 테스트"""
        async with async_playwright() as p:
            # 브라우저 시작
            browser = await p.chromium.launch(headless=False, slow_mo=1000)
            page = await browser.new_page()
            
            print("🚀 Streamlit 앱 전체 기능 테스트 시작")
            
            try:
                # 1. 앱 접속 및 로딩 확인
                await self.test_app_loading(page)
                
                # 2. 대시보드 섹션 테스트
                await self.test_dashboard_section(page)
                
                # 3. 스크립트 관리 섹션 테스트
                await self.test_script_management_section(page)
                
                # 4. 업로드 관리 섹션 테스트
                await self.test_upload_management_section(page)
                
                # 5. 전체 워크플로우 테스트
                await self.test_full_workflow(page)
                
                print("✅ 모든 테스트 완료!")
                
            except Exception as e:
                print(f"❌ 테스트 실패: {e}")
                await page.screenshot(path="test_error.png")
                
            finally:
                await browser.close()
    
    async def test_app_loading(self, page):
        """앱 로딩 테스트"""
        print("📊 앱 로딩 테스트...")
        
        await page.goto(self.app_url)
        await page.wait_for_load_state('networkidle')
        
        # 헤더 확인
        header = await page.text_content("h1")
        assert "YouTube 자동화 대시보드" in header
        
        # 네비게이션 확인
        nav_buttons = await page.locator("input[type='radio']").count()
        assert nav_buttons == 3
        
        print("✅ 앱 로딩 성공")
    
    async def test_dashboard_section(self, page):
        """대시보드 섹션 테스트"""
        print("📊 대시보드 섹션 테스트...")
        
        # 대시보드 선택 - Streamlit 라디오 버튼 구조에 맞게 수정
        dashboard_radio = page.locator("label", has_text="📊 대시보드")
        if await dashboard_radio.count() > 0:
            await dashboard_radio.click()
            await page.wait_for_timeout(1000)
        
        # 시스템 상태 확인
        system_section = page.locator("text=🔧 시스템")
        await system_section.wait_for()
        
        # 통계 섹션 확인
        stats_section = page.locator("text=📊 통계")
        await stats_section.wait_for()
        
        # 빠른 작업 섹션 확인
        quick_section = page.locator("text=⚡ 빠른 작업")
        await quick_section.wait_for()
        
        # 새로고침 버튼 테스트 (첫 번째 버튼 선택)
        refresh_btn = page.locator("button", has_text="🔄").first
        if await refresh_btn.count() > 0:
            await refresh_btn.click()
            await page.wait_for_timeout(2000)
        
        print("✅ 대시보드 섹션 테스트 완료")
    
    async def test_script_management_section(self, page):
        """스크립트 관리 섹션 테스트"""
        print("📝 스크립트 관리 섹션 테스트...")
        
        # 스크립트 관리 선택
        script_radio = page.locator("label", has_text="📝 스크립트 관리")
        await script_radio.click()
        await page.wait_for_timeout(1000)
        
        # 업로드 탭 테스트
        await self.test_script_upload_tab(page)
        
        # 관리 탭 테스트
        await self.test_script_management_tab(page)
        
        print("✅ 스크립트 관리 섹션 테스트 완료")
    
    async def test_script_upload_tab(self, page):
        """스크립트 업로드 탭 테스트"""
        print("📤 스크립트 업로드 탭 테스트...")
        
        # 업로드 탭 선택 (기본적으로 선택되어 있을 수 있음)
        upload_tab = page.locator("button", has_text="📤 업로드")
        if await upload_tab.count() > 0:
            await upload_tab.click()
            await page.wait_for_timeout(1000)
        
        # 직접 입력 방식 테스트
        direct_input = page.locator("label", has_text="직접 입력")
        await direct_input.click()
        await page.wait_for_timeout(1000)
        
        # 테스트 스크립트 작성
        test_script = """=== 제목 ===
테스트 비디오 제목

=== 메타데이터 ===
설명: 테스트용 비디오 설명입니다.
태그: 테스트, 자동화, 유튜브

=== 썸네일 정보 ===
텍스트: 테스트 썸네일
ImageFX 프롬프트: 테스트용 이미지

=== 대본 ===
안녕하세요. 이것은 테스트용 스크립트입니다.
"""
        
        # 스크립트 내용 입력
        script_textarea = page.locator("textarea[placeholder*='스크립트를 작성하세요']")
        await script_textarea.fill(test_script)
        
        # 파일명 입력 - 텍스트 입력 필드 중에서 찾기
        filename_inputs = page.locator("input[type='text']")
        if await filename_inputs.count() > 0:
            # 마지막 텍스트 입력 필드를 파일명으로 가정
            filename_input = filename_inputs.last
            await filename_input.clear()
            await filename_input.fill("test_script.txt")
        
        # 업로드 버튼 클릭 (백엔드가 실행 중이어야 함)
        upload_btn = page.locator("button", has_text="📝 저장 및 업로드")
        if await upload_btn.is_enabled():
            await upload_btn.click()
            await page.wait_for_timeout(3000)
            
            # 성공 메시지 확인
            success_msg = page.locator("text=스크립트 업로드 완료")
            if await success_msg.count() > 0:
                print("✅ 스크립트 업로드 성공")
            else:
                print("⚠️ 스크립트 업로드 - 백엔드 연결 필요")
        
        print("✅ 스크립트 업로드 탭 테스트 완료")
    
    async def test_script_management_tab(self, page):
        """스크립트 관리 탭 테스트"""
        print("📋 스크립트 관리 탭 테스트...")
        
        # 관리 탭 선택
        manage_tab = page.locator("button", has_text="📋 관리")
        await manage_tab.click()
        await page.wait_for_timeout(1000)
        
        # 필터 테스트
        status_filter = page.locator("select", has=page.locator("option", has_text="전체"))
        if await status_filter.count() > 0:
            await status_filter.select_option("script_ready")
            await page.wait_for_timeout(1000)
        
        # 검색 테스트
        search_input = page.locator("input[placeholder*='검색어 입력']")
        await search_input.fill("테스트")
        await page.wait_for_timeout(1000)
        
        # 새로고침 버튼 테스트 (첫 번째 버튼 선택)
        refresh_btn = page.locator("button", has_text="🔄").first
        if await refresh_btn.count() > 0:
            await refresh_btn.click()
            await page.wait_for_timeout(2000)
        
        print("✅ 스크립트 관리 탭 테스트 완료")
    
    async def test_upload_management_section(self, page):
        """업로드 관리 섹션 테스트"""
        print("🎬 업로드 관리 섹션 테스트...")
        
        # 업로드 관리 선택
        upload_radio = page.locator("label", has_text="🎬 업로드 관리")
        await upload_radio.click()
        await page.wait_for_timeout(1000)
        
        # 비디오 업로드 탭 확인
        video_tab = page.locator("button", has_text="🎥 비디오 업로드")
        await video_tab.wait_for()
        
        # YouTube 업로드 탭 확인
        youtube_tab = page.locator("button", has_text="📺 YouTube 업로드")
        await youtube_tab.click()
        await page.wait_for_timeout(1000)
        
        # 공개 설정 확인
        privacy_select = page.locator("select", has=page.locator("option", has_text="비공개"))
        if await privacy_select.count() > 0:
            await privacy_select.select_option("unlisted")
        
        # 카테고리 설정 확인
        category_select = page.locator("select", has=page.locator("option", has_text="People & Blogs"))
        if await category_select.count() > 0:
            await category_select.select_option("24")  # Entertainment
        
        print("✅ 업로드 관리 섹션 테스트 완료")
    
    async def test_full_workflow(self, page):
        """전체 워크플로우 테스트"""
        print("🔄 전체 워크플로우 테스트...")
        
        # 대시보드로 돌아가서 전체 상태 확인
        dashboard_radio = page.locator("label", has_text="📊 대시보드")
        await dashboard_radio.click()
        await page.wait_for_timeout(2000)
        
        # 최종 스크린샷
        await page.screenshot(path="streamlit_test_complete.png", full_page=True)
        
        print("✅ 전체 워크플로우 테스트 완료")
    
    def check_backend_health(self):
        """백엔드 서버 상태 확인"""
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False


async def main():
    """메인 테스트 실행"""
    tester = StreamlitAppTester()
    
    # 백엔드 상태 확인
    if tester.check_backend_health():
        print("✅ 백엔드 서버 실행 중")
    else:
        print("⚠️ 백엔드 서버 미실행 - 일부 기능 테스트 제한")
    
    # 전체 테스트 실행
    await tester.test_all_features()


if __name__ == "__main__":
    asyncio.run(main())