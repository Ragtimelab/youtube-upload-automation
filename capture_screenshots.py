#!/usr/bin/env python3
"""
Streamlit 앱 스크린샷 캡처 스크립트
사용법 가이드용 스크린샷을 자동으로 생성합니다.
"""
import asyncio
from playwright.async_api import async_playwright
import os


async def capture_screenshots():
    """각 섹션별 스크린샷 캡처"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        page = await browser.new_page()
        
        # 스크린샷 저장 디렉토리 생성
        os.makedirs("docs/screenshots", exist_ok=True)
        
        print("📸 Streamlit 앱 스크린샷 캡처 시작")
        
        try:
            # 앱 접속
            await page.goto("http://localhost:8503")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(3000)
            
            # 1. 대시보드 전체 화면
            await page.screenshot(
                path="docs/screenshots/01_dashboard_overview.png",
                full_page=True
            )
            print("✅ 대시보드 전체 화면 캡처")
            
            # 2. 대시보드 상세 - 시스템 상태
            system_section = page.locator("text=🔧 시스템").locator("..")
            await system_section.screenshot(
                path="docs/screenshots/02_dashboard_system_status.png"
            )
            print("✅ 시스템 상태 섹션 캡처")
            
            # 3. 스크립트 관리 - 업로드 탭
            script_nav = page.locator("label", has_text="📝 스크립트 관리")
            await script_nav.click()
            await page.wait_for_timeout(2000)
            
            await page.screenshot(
                path="docs/screenshots/03_script_management_upload.png",
                full_page=True
            )
            print("✅ 스크립트 관리 - 업로드 탭 캡처")
            
            # 4. 스크립트 관리 - 직접 입력 모드
            direct_input = page.locator("label", has_text="직접 입력")
            await direct_input.click()
            await page.wait_for_timeout(1000)
            
            await page.screenshot(
                path="docs/screenshots/04_script_direct_input.png",
                full_page=True
            )
            print("✅ 스크립트 직접 입력 모드 캡처")
            
            # 5. 스크립트 관리 - 관리 탭
            manage_tab = page.locator("button", has_text="📋 관리")
            await manage_tab.click()
            await page.wait_for_timeout(2000)
            
            await page.screenshot(
                path="docs/screenshots/05_script_management_list.png",
                full_page=True
            )
            print("✅ 스크립트 관리 - 목록 탭 캡처")
            
            # 6. 업로드 관리 - 비디오 업로드
            upload_nav = page.locator("label", has_text="🎬 업로드 관리")
            await upload_nav.click()
            await page.wait_for_timeout(2000)
            
            await page.screenshot(
                path="docs/screenshots/06_upload_management_video.png",
                full_page=True
            )
            print("✅ 업로드 관리 - 비디오 업로드 캡처")
            
            # 7. 업로드 관리 - YouTube 업로드
            youtube_tab = page.locator("button", has_text="📺 YouTube 업로드")
            await youtube_tab.click()
            await page.wait_for_timeout(1000)
            
            await page.screenshot(
                path="docs/screenshots/07_upload_management_youtube.png",
                full_page=True
            )
            print("✅ 업로드 관리 - YouTube 업로드 캡처")
            
            # 8. 네비게이션 바 상세
            nav_section = page.locator("div").filter(has_text=re.compile(r"📊 대시보드.*📝 스크립트 관리.*🎬 업로드 관리")).first
            await nav_section.screenshot(
                path="docs/screenshots/08_navigation_bar.png"
            )
            print("✅ 네비게이션 바 캡처")
            
            print("🎉 모든 스크린샷 캡처 완료!")
            print("📁 저장 위치: docs/screenshots/")
            
        except Exception as e:
            print(f"❌ 스크린샷 캡처 실패: {e}")
            
        finally:
            await browser.close()


if __name__ == "__main__":
    import re
    asyncio.run(capture_screenshots())