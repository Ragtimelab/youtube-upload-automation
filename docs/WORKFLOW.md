# 📋 대본-영상 매칭 워크플로우

## 🔄 완전한 프로세스

### 1️⃣ **대본 생성 및 파일 저장**
```
Claude Desktop + @prompt.md
↓
표준화된 출력 형식:
=== 대본 ===
=== 메타데이터 ===  
=== 썸네일 제작 ===
↓
파일로 저장 (script_001.txt 또는 script_001.md)
```

### 2️⃣ **웹 시스템에 대본 등록**
```
웹 대시보드 접속
↓
"새 대본 등록" 클릭
↓
대본 파일 업로드 (.txt/.md)
↓
시스템 자동 파싱:
- 대본 내용 추출
- 메타데이터 (제목, 설명, 태그) 추출
- 썸네일 문구 + ImageFX 프롬프트 추출
↓
DB 저장 (status: 'script_ready', 고유 ID 생성)
```

### 3️⃣ **영상 제작 (수동)**
```
대본을 참고하여 영상 제작
↓
ImageFX 프롬프트로 썸네일 배경 생성 (선택사항)
↓ 
영상 파일 완성 (video.mp4)
```

### 4️⃣ **영상-대본 매칭**
```
웹 대시보드 "영상 업로드" 페이지
↓
대기중인 대본 목록 표시:
□ [SCRIPT_001] 할머니의 숨겨진 이야기 - 2025.01.15
□ [SCRIPT_002] 아버지의 마지막 편지 - 2025.01.16
↓
원하는 대본 선택
↓
"영상 파일 업로드" 클릭
↓
파일 선택 다이얼로그에서 영상 선택
↓
시스템이 자동 매칭 및 상태 업데이트 (status: 'video_ready')
```

### 5️⃣ **자동 업로드 및 스케줄링**
```
매칭 완료된 대본-영상 확인
↓
업로드 옵션 선택:
- 즉시 업로드
- 예약 업로드 (날짜/시간 설정)
↓
"업로드 시작" 클릭
↓
시스템 자동 처리:
- YouTube API 호출
- 영상 업로드
- 메타데이터 적용
- 스케줄링 설정
↓
완료 후 상태 업데이트 (status: 'scheduled' 또는 'uploaded')
```

## 🖥️ 웹 인터페이스 UI 구성

### **대본 관리 페이지**
```
┌─────────────────────────────────────┐
│ 📝 대본 관리                         │
├─────────────────────────────────────┤
│ [파일 선택] [등록하기]               │
├─────────────────────────────────────┤
│ 📋 등록된 대본 목록                  │
│ ✅ SCRIPT_001 - 업로드 완료          │
│ 🎬 SCRIPT_002 - 영상 대기중          │ 
│ 📝 SCRIPT_003 - 대본만 등록          │
└─────────────────────────────────────┘
```

### **영상 업로드 페이지**
```
┌─────────────────────────────────────┐
│ 🎬 영상 업로드                       │
├─────────────────────────────────────┤
│ 연결할 대본: [드롭다운 선택]          │
│ 영상 파일: [파일 선택]               │
│ 업로드 옵션:                        │
│ ○ 즉시 업로드                       │
│ ○ 예약 업로드 [날짜] [시간]          │
│                                    │
│ [업로드 시작]                       │
└─────────────────────────────────────┘
```

## 📊 상태 추적 시스템

### **대본-영상 상태별 구분**
- `script_ready`: 대본만 등록됨
- `video_ready`: 영상도 매칭 완료
- `scheduled`: YouTube에 예약 업로드됨
- `uploaded`: 업로드 완료

### **실시간 모니터링**
WebSocket을 통한 실시간 상태 업데이트:
- 파일 업로드 진행률
- YouTube API 호출 상태  
- 업로드 성공/실패 알림

## 🔧 백엔드 처리 로직

### **대본 파일 파싱**
```python
def parse_script_file(file_content: str) -> Dict:
    sections = {
        'content': extract_section(file_content, '=== 대본 ==='),
        'title': extract_metadata(file_content, '제목:'),
        'description': extract_metadata(file_content, '설명:'),
        'tags': extract_metadata(file_content, '태그:'),
        'thumbnail_text': extract_metadata(file_content, '썸네일 문구:'),
        'imagefx_prompt': extract_metadata(file_content, 'ImageFX 프롬프트:')
    }
    return sections
```

### **영상-대본 매칭 검증**
```python
def match_video_to_script(script_id: int, video_file: UploadFile) -> bool:
    script = get_script_by_id(script_id)
    if script.status != 'script_ready':
        raise ValueError("대본이 준비 상태가 아닙니다")
    
    # 영상 파일 저장 및 경로 업데이트
    video_path = save_video_file(video_file)
    update_script_status(script_id, 'video_ready', video_path)
    return True
```

이 워크플로우로 대본-영상 매칭과 추적이 완벽하게 자동화됩니다! 🚀