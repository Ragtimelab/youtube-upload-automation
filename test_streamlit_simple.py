#!/usr/bin/env python3
"""
간단한 Streamlit 앱 기능 검증 테스트
"""
import asyncio
import re
from playwright.async_api import async_playwright
import requests


async def simple_test():
    """간단한 기능 테스트"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=2000)
        page = await browser.new_page()
        
        print("🚀 Streamlit 앱 기본 기능 테스트")
        
        try:
            # 앱 접속
            await page.goto("http://localhost:8503")
            await page.wait_for_load_state('networkidle')
            print("✅ 앱 로딩 성공")
            
            # 헤더 확인
            header = await page.text_content("h1")
            if "YouTube 자동화 대시보드" in header:
                print("✅ 헤더 확인 완료")
            
            # 네비게이션 확인
            nav_labels = page.locator("label").filter(has_text=re.compile(r"📊|📝|🎬"))
            nav_count = await nav_labels.count()
            print(f"✅ 네비게이션 버튼: {nav_count}개 발견")
            
            # 대시보드 섹션 확인
            system_text = page.locator("text=🔧 시스템")
            if await system_text.count() > 0:
                print("✅ 대시보드 시스템 상태 표시 확인")
            
            # 스크립트 관리 섹션으로 이동
            script_nav = page.locator("label", has_text="📝 스크립트 관리")
            await script_nav.click()
            await page.wait_for_timeout(2000)
            print("✅ 스크립트 관리 섹션 이동")
            
            # 업로드 관리 섹션으로 이동
            upload_nav = page.locator("label", has_text="🎬 업로드 관리")
            await upload_nav.click()
            await page.wait_for_timeout(2000)
            print("✅ 업로드 관리 섹션 이동")
            
            # 대시보드로 복귀
            dashboard_nav = page.locator("label", has_text="📊 대시보드")
            await dashboard_nav.click()
            await page.wait_for_timeout(2000)
            print("✅ 대시보드로 복귀")
            
            # 최종 스크린샷
            await page.screenshot(path="streamlit_basic_test.png", full_page=True)
            print("📸 스크린샷 저장 완료")
            
            print("🎉 모든 기본 기능 테스트 성공!")
            
        except Exception as e:
            print(f"❌ 테스트 실패: {e}")
            await page.screenshot(path="test_error.png")
            
        finally:
            await browser.close()


if __name__ == "__main__":
    # 백엔드 상태 확인
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ 백엔드 서버 실행 중")
        else:
            print("⚠️ 백엔드 서버 응답 이상")
    except:
        print("⚠️ 백엔드 서버 미실행")
    
    # 테스트 실행
    asyncio.run(simple_test())