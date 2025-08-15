# YouTube 업로드 자동화 시스템 - Poetry 기반 Makefile

.PHONY: help install dev test lint format clean run migrate

help:  ## 사용 가능한 명령어 목록 표시
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:  ## Poetry로 의존성 설치
	poetry install

dev:  ## 개발 의존성 포함 설치
	poetry install --with dev,test

test:  ## 테스트 실행
	poetry run pytest tests/ -v

test-cov:  ## 커버리지 포함 테스트 실행
	poetry run pytest --cov=app tests/ --cov-report=html --cov-report=term

lint:  ## 코드 린팅 실행
	poetry run flake8 app/
	poetry run mypy app/

format:  ## 코드 포맷팅 실행
	poetry run black app/
	poetry run isort app/

format-check:  ## 포맷팅 체크 (CI용)
	poetry run black --check app/
	poetry run isort --check app/

clean:  ## 캐시 및 임시 파일 정리
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache/
	rm -rf htmlcov/
	rm -rf dist/
	rm -rf build/

run:  ## 개발 서버 실행
	poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run-prod:  ## 프로덕션 서버 실행
	poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000

migrate:  ## 데이터베이스 마이그레이션
	poetry run alembic upgrade head

migrate-auto:  ## 자동 마이그레이션 생성
	poetry run alembic revision --autogenerate -m "Auto migration"

migrate-create:  ## 빈 마이그레이션 생성 (수동 편집용)
	@read -p "Migration name: " name; \
	poetry run alembic revision -m "$$name"

shell:  ## Poetry shell 활성화
	poetry shell

deps-update:  ## 의존성 업데이트
	poetry update

deps-show:  ## 설치된 의존성 표시
	poetry show

deps-tree:  ## 의존성 트리 표시
	poetry show --tree

security:  ## 보안 취약점 검사
	poetry run safety check

pre-commit:  ## pre-commit 훅 설치
	poetry run pre-commit install

pre-commit-run:  ## pre-commit 수동 실행
	poetry run pre-commit run --all-files

build:  ## 패키지 빌드
	poetry build

version:  ## 현재 버전 표시
	poetry version

bump-patch:  ## 패치 버전 업
	poetry version patch

bump-minor:  ## 마이너 버전 업  
	poetry version minor

bump-major:  ## 메이저 버전 업
	poetry version major

docker-build:  ## Docker 이미지 빌드
	docker build -t youtube-automation-backend .

docker-run:  ## Docker 컨테이너 실행
	docker run -p 8000:8000 youtube-automation-backend

api-docs:  ## API 문서 브라우저에서 열기
	@echo "API 문서가 http://localhost:8000/docs 에서 제공됩니다"
	@echo "서버가 실행 중인지 확인하세요: make run"