"""
🎬 YouTube 업로드 자동화 - Streamlit 웹 인터페이스 런처

새로운 멀티페이지 구조의 Streamlit 앱을 실행합니다.
"""

import subprocess
import sys
from pathlib import Path

def main():
    """Streamlit 앱 실행"""
    
    # 프로젝트 루트 디렉토리
    project_root = Path(__file__).parent
    streamlit_app_path = project_root / "streamlit_app" / "main.py"
    
    print("🎬 YouTube 업로드 자동화 - Streamlit 웹 인터페이스 시작")
    print(f"📍 앱 경로: {streamlit_app_path}")
    print("🌐 웹 브라우저에서 http://localhost:8501 로 접속하세요")
    print("=" * 60)
    
    try:
        # Streamlit 앱 실행
        subprocess.run([
            sys.executable, "-m", "streamlit", "run", 
            str(streamlit_app_path),
            "--server.port=8501",
            "--server.address=localhost",
            "--browser.gatherUsageStats=false"
        ], check=True)
    
    except KeyboardInterrupt:
        print("\n👋 Streamlit 앱이 종료되었습니다.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Streamlit 실행 오류: {e}")
        print("💡 Streamlit이 설치되어 있는지 확인하세요: pip install streamlit")
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")

if __name__ == "__main__":
    main()