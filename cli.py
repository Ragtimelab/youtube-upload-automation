# !/usr/bin/env python3
"""
YouTube 자동화 CLI 실행 스크립트
"""

import sys
import os
from pathlib import Path

# CLI 모듈 경로 추가

cli_dir = Path(__file__).parent / 'cli'
sys.path.insert(0, str(cli_dir))

# 메인 CLI 실행

if __name__ == '__main__':
    from main import cli
    cli()
