// 텍스트 상수 중앙화 시스템
// Phase 1.2: 하드코딩된 UI 텍스트, 레이블, 메시지 통합 관리

/**
 * 공통 UI 텍스트 (버튼, 액션, 상태 등)
 */
export const UI_TEXT = {
  // 공통 액션
  common: {
    save: '저장',
    cancel: '취소',
    delete: '삭제',
    edit: '편집',
    upload: '업로드',
    download: '다운로드',
    refresh: '새로고침',
    search: '검색',
    filter: '필터',
    clear: '지우기',
    confirm: '확인',
    retry: '다시 시도',
    close: '닫기',
    back: '뒤로',
    next: '다음',
    submit: '제출',
    loading: '로딩 중...',
    connecting: '연결 중...',
    connected: '연결됨',
    disconnected: '연결 끊김',
    success: '성공',
    error: '오류',
    warning: '경고',
    info: '정보',
    displayOptions: '표시 옵션'
  },

  // 버튼 텍스트
  button: {
    newUpload: '새 스크립트 업로드',
    selectFile: '파일 선택',
    uploadVideo: '비디오 업로드',
    youtubeUpload: 'YouTube 업로드',
    viewDetails: '상세보기',
    goHome: '홈으로',
    goBack: '뒤로가기',
    viewAll: '전체 보기',
    manage: '관리',
    settings: '설정',
    monitoringOn: '모니터링 중',
    monitoringOff: '모니터링 중지',
    autoScrollOn: '자동 스크롤 켜짐',
    autoScrollOff: '자동 스크롤 꺼짐',
    clearLogs: '로그 지우기',
    remove: '제거',
    selectOther: '다른 파일 선택'
  },

  // 상태 메시지
  status: {
    loading: '불러오는 중...',
    noData: '데이터가 없습니다',
    empty: '비어있음',
    processing: '처리 중...',
    uploading: '업로드 중...',
    completed: '완료',
    failed: '실패',
    pending: '대기 중',
    ready: '준비됨',
    error: '오류 발생',
    offline: '오프라인',
    online: '온라인'
  },

  // 검증 및 오류 메시지
  validation: {
    required: '필수 입력 항목입니다',
    invalidFile: '올바르지 않은 파일 형식입니다',
    fileTooLarge: '파일 크기가 너무 큽니다',
    networkError: '네트워크 오류가 발생했습니다',
    uploadFailed: '업로드에 실패했습니다',
    connectionError: '연결 오류가 발생했습니다'
  }
} as const

/**
 * 페이지별 전용 텍스트
 */
export const PAGE_TEXT = {
  // Dashboard 페이지
  dashboard: {
    title: '시스템 대시보드',
    description: 'YouTube 업로드 자동화 시스템 실시간 모니터링',
    lastUpdate: '마지막 업데이트',
    realTimeOn: '실시간 켜짐',
    realTimeOff: '실시간 꺼짐',
    serverRendering: '서버에서 렌더링 중...',
    systemLoading: '시스템 상태를 불러오는 중...'
  },

  // Scripts 페이지
  scripts: {
    title: '스크립트 관리',
    description: '마크다운 스크립트 파일을 업로드하고 관리하세요.',
    searchPlaceholder: '스크립트 검색...',
    noScripts: '스크립트가 없습니다',
    noScriptsDescription: '첫 번째 스크립트를 업로드하여 시작하세요.',
    uploadFirst: '스크립트 업로드',
    totalCount: '개',
    showingResults: '개 표시',
    searchResults: '검색 결과'
  },

  // Upload 페이지
  upload: {
    title: '비디오 업로드',
    description: '스크립트에 맞는 비디오 파일을 업로드하세요.',
    selectScript: '1. 스크립트 선택',
    uploadFile: '2. 비디오 파일 업로드',
    executeUpload: '3. 업로드 실행',
    uploadComplete: '업로드가 완료되었습니다!',
    noAvailableScripts: '업로드 가능한 스크립트가 없습니다',
    uploadScriptsFirst: '먼저 스크립트를 업로드해주세요.',
    goToScriptsManage: '스크립트 관리로 이동',
    dragOrClick: '비디오 파일을 드래그하거나 클릭하여 업로드',
    dropFilesHere: '파일을 여기에 놓으세요',
    requirementsTitle: '파일 요구사항',
    maxFileSize: '최대 파일 크기',
    supportedFormats: '지원 형식',
    recommendedFilename: '권장 파일명 형식',
    uploadProgress: '업로드 진행률',
    estimatedTime: '예상 남은 시간',
    uploadSpeed: '업로드 속도',
    calculating: '계산 중...',
    uploadError: '업로드 오류가 발생했습니다',
    selectBoth: '스크립트와 비디오 파일을 모두 선택해주세요.'
  },

  // YouTube 페이지
  youtube: {
    title: 'YouTube 업로드 관리',
    description: '스크립트를 선택하여 YouTube에 업로드하세요.',
    uploading: '개 업로드 중'
  },

  // Status 페이지
  status: {
    title: '실시간 모니터링',
    description: '시스템 상태와 업로드 진행 상황을 실시간으로 모니터링',
    systemStatus: '시스템 상태',
    systemDescription: '모든 서비스 구성요소의 실시간 상태',
    performanceMonitoring: '실시간 성능 모니터링',
    performanceDescription: 'CPU, 메모리, 네트워크 사용률',
    activeUploads: '활성 업로드',
    activeUploadsDescription: '현재 진행 중인 업로드 작업',
    noActiveUploads: '현재 진행 중인 업로드가 없습니다.',
    uploadsWillShow: '업로드가 시작되면 실시간으로 표시됩니다.',
    logStream: '실시간 로그 스트림',
    logStreamDescription: '시스템 활동 및 이벤트 로그',
    realTimeStatusLoading: '실시간 상태를 불러오는 중...',
    delay: '지연'
  },

  // Home 페이지
  home: {
    title: 'YouTube 업로드 자동화 시스템',
    description: '한국 시니어 대상 콘텐츠 제작을 위한 통합 관리 시스템입니다. 스크립트 작성부터 YouTube 업로드까지 모든 과정을 자동화하세요.',
    totalScripts: '전체 스크립트',
    uploadComplete: '업로드 완료',
    processing: '처리 중',
    errorOccurred: '오류 발생',
    newScriptUpload: '새 스크립트 업로드',
    scriptUploadDescription: '마크다운 스크립트 파일을 업로드하여 관리합니다.',
    videoUpload: '비디오 업로드',
    videoUploadDescription: '스크립트에 맞는 비디오 파일을 업로드합니다.',
    youtubePublish: 'YouTube 게시',
    youtubePublishDescription: '완성된 콘텐츠를 YouTube에 자동으로 업로드합니다.',
    startNow: '시작하기',
    realTimeStatus: '실시간 상태',
    realTimeDescription: 'WebSocket 연결을 통한 실시간 상태 모니터링',
    realTimeSubDescription: '업로드 진행 상황과 시스템 상태를 실시간으로 확인하세요.',
    statisticsLoadError: '통계 데이터 로드 실패:'
  },

  // Pipeline 페이지
  pipeline: {
    scriptReady: '스크립트 준비',
    scriptReadyDescription: '업로드된 스크립트 파일들',
    videoReady: '비디오 준비',
    videoReadyDescription: '비디오 파일이 연결된 스크립트',
    uploading: '업로드 중',
    uploadingDescription: 'YouTube에 업로드 진행 중',
    uploadCompleted: '업로드 완료',
    uploadCompletedDescription: '성공적으로 업로드된 콘텐츠'
  },

  // Settings 페이지
  settings: {
    title: '설정',
    description: '시스템 설정을 관리하고 환경을 구성하세요.',
    youtubeSettings: 'YouTube 설정',
    apiConnection: 'API 연결 상태',
    apiDescription: 'YouTube Data API v3 연결 상태',
    defaultPrivacy: '기본 공개 설정',
    privacyDescription: '새 업로드의 기본 공개 설정',
    defaultCategory: '기본 카테고리',
    categoryDescription: '업로드할 비디오의 기본 카테고리',
    fileSettings: '파일 설정',
    uploadDirectory: '업로드 디렉토리',
    maxFileSize: '최대 파일 크기',
    fileSizeNote: '(YouTube 제한)',
    autoBackup: '자동 백업',
    backupDescription: '업로드된 파일 자동 백업',
    notificationSettings: '알림 설정',
    uploadComplete: '업로드 완료 알림',
    uploadCompleteDescription: 'YouTube 업로드 완료 시 알림',
    errorNotification: '오류 알림',
    errorDescription: '업로드 오류 발생 시 알림',
    systemInfo: '시스템 정보',
    version: '버전',
    buildDate: '빌드 날짜',
    pythonVersion: 'Python 버전',
    fastapiVersion: 'FastAPI 버전',
    downloadLogs: '로그 다운로드',
    change: '변경',
    cannotModify: '수정 불가',
    // Privacy options
    private: '비공개',
    unlisted: '목록에 없음',
    public: '공개'
  }
} as const

/**
 * 시스템 메시지 및 알림
 */
export const SYSTEM_TEXT = {
  // 성공 메시지
  success: {
    uploadComplete: '업로드가 성공적으로 완료되었습니다',
    fileUploaded: '파일이 성공적으로 업로드되었습니다',
    settingsSaved: '설정이 저장되었습니다',
    connectionEstablished: '연결이 설정되었습니다'
  },

  // 오류 메시지
  error: {
    uploadFailed: '업로드에 실패했습니다',
    connectionFailed: '연결에 실패했습니다',
    invalidFileFormat: '지원하지 않는 파일 형식입니다',
    fileSizeExceeded: '파일 크기 제한을 초과했습니다',
    networkError: '네트워크 오류가 발생했습니다',
    unknownError: '알 수 없는 오류가 발생했습니다',
    serverError: '서버 오류가 발생했습니다'
  },

  // 확인 메시지
  confirmation: {
    deleteScript: '이 스크립트를 삭제하시겠습니까?',
    deleteFile: '이 파일을 삭제하시겠습니까?',
    overwriteFile: '기존 파일을 덮어쓰시겠습니까?',
    resetSettings: '설정을 초기화하시겠습니까?'
  }
} as const

/**
 * 파일 관련 텍스트
 */
export const FILE_TEXT = {
  formats: {
    video: '.MP4, .AVI, .MOV, .MKV, .FLV',
    script: '.MD'
  },
  
  requirements: {
    maxSize: '8GB',
    recommendedNaming: 'YYYYMMDD_NN_story.mp4'
  },

  errors: {
    invalidFormat: '비디오 파일만 업로드할 수 있습니다. (.mp4, .avi, .mov, .mkv, .flv)',
    sizeExceeded: '파일 크기 오류'
  }
} as const

// 타입 안전성을 위한 유틸리티 타입
export type UITextKey = keyof typeof UI_TEXT
export type PageTextKey = keyof typeof PAGE_TEXT
export type SystemTextKey = keyof typeof SYSTEM_TEXT
export type FileTextKey = keyof typeof FILE_TEXT

// 텍스트 결합 헬퍼 함수
export const combineText = (...texts: (string | undefined)[]): string => {
  return texts.filter(Boolean).join(' ')
}

// 조건부 텍스트 헬퍼 함수
export const conditionalText = (condition: boolean, trueText: string, falseText = ''): string => {
  return condition ? trueText : falseText
}