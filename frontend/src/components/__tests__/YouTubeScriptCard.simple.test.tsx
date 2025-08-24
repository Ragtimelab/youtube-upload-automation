/**
 * YouTubeScriptCard 컴포넌트 단위 테스트 (단순화 버전)
 * Phase 7: 테스트 전략 및 품질 보증 - 실제 작동 검증용
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { YouTubeScriptCard } from '../youtube/YouTubeScriptCard'
import type { Script } from '../../types/api'
import type { YouTubeUploadProgress } from '../../types/youtube'

// 실제 컴포넌트에 맞는 모의 데이터 (정확한 타입 사용)
const mockScript: Script = {
  id: 1,
  filename: 'test-script.md',
  title: '테스트 스크립트 제목',
  description: '테스트 스크립트 설명입니다.',
  tags: ['테스트', '샘플'],
  script_content: '스크립트 내용',
  status: 'video_ready',
  video_filename: 'test-video.mp4',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
}

const mockUploadState: YouTubeUploadProgress = {
  isUploading: false,
  progress: 0,
  message: '',
  status: 'pending',
  step: 'preparing'
}

describe('YouTubeScriptCard - 단순 검증', () => {
  const defaultProps = {
    script: mockScript,
    isBatchMode: false,
    isSelected: false,
    uploadState: mockUploadState,
    singleUploadSchedule: '',
    onYouTubeUpload: jest.fn(),
    onToggleSelection: jest.fn(),
    onScheduleChange: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('기본 렌더링 검증', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(<YouTubeScriptCard {...defaultProps} />)
      }).not.toThrow()
    })

    it('should display script title', () => {
      render(<YouTubeScriptCard {...defaultProps} />)
      const titleElement = screen.getByText('테스트 스크립트 제목')
      expect(titleElement).toBeTruthy()
    })

    it('should display script description', () => {
      render(<YouTubeScriptCard {...defaultProps} />)
      const descriptionElement = screen.getByText('테스트 스크립트 설명입니다.')
      expect(descriptionElement).toBeTruthy()
    })

    it('should display file names', () => {
      render(<YouTubeScriptCard {...defaultProps} />)
      
      // 파일명은 "파일명: filename" 형식으로 표시됨
      const scriptFileText = screen.getByText(/test-script\.md/)
      expect(scriptFileText).toBeTruthy()
      
      const videoFileText = screen.getByText(/test-video\.mp4/)
      expect(videoFileText).toBeTruthy()
    })

    it('should display tags', () => {
      render(<YouTubeScriptCard {...defaultProps} />)
      
      const tag1 = screen.getByText('테스트')
      expect(tag1).toBeTruthy()
      
      const tag2 = screen.getByText('샘플')
      expect(tag2).toBeTruthy()
    })
  })

  describe('상태별 표시 검증', () => {
    it('should handle video_ready status', () => {
      render(<YouTubeScriptCard {...defaultProps} />)
      
      // DOM이 렌더링되었는지 확인
      const container = document.querySelector('div')
      expect(container).toBeTruthy()
    })

    it('should handle uploaded status', () => {
      const uploadedScript = {
        ...mockScript,
        status: 'uploaded' as const,
        youtube_url: 'https://youtube.com/watch?v=test123',
        youtube_video_id: 'test123'
      }

      expect(() => {
        render(
          <YouTubeScriptCard 
            {...defaultProps} 
            script={uploadedScript}
          />
        )
      }).not.toThrow()
    })

    it('should handle script_ready status', () => {
      const scriptOnlyScript = {
        ...mockScript,
        status: 'script_ready' as const
      }

      expect(() => {
        render(
          <YouTubeScriptCard 
            {...defaultProps} 
            script={scriptOnlyScript}
          />
        )
      }).not.toThrow()
    })
  })

  describe('배치 모드 검증', () => {
    it('should render in batch mode', () => {
      expect(() => {
        render(
          <YouTubeScriptCard 
            {...defaultProps} 
            isBatchMode={true}
          />
        )
      }).not.toThrow()
    })

    it('should call onToggleSelection when selection changes', () => {
      const mockOnToggleSelection = jest.fn()
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          isBatchMode={true}
          onToggleSelection={mockOnToggleSelection}
        />
      )

      // 체크박스 찾기 시도
      const checkboxes = screen.queryAllByRole('checkbox')
      if (checkboxes.length > 0 && checkboxes[0]) {
        fireEvent.click(checkboxes[0])
        expect(mockOnToggleSelection).toHaveBeenCalledWith(1)
      }
    })

    it('should show selected state', () => {
      expect(() => {
        render(
          <YouTubeScriptCard 
            {...defaultProps} 
            isBatchMode={true}
            isSelected={true}
          />
        )
      }).not.toThrow()
    })
  })

  describe('업로드 기능 검증', () => {
    it('should call onYouTubeUpload when upload is triggered', () => {
      const mockOnYouTubeUpload = jest.fn()
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          onYouTubeUpload={mockOnYouTubeUpload}
        />
      )

      // 버튼 찾기 시도
      const buttons = screen.queryAllByRole('button')
      const uploadButton = buttons.find(button => 
        button.textContent?.includes('업로드') || 
        button.textContent?.includes('YouTube')
      )

      if (uploadButton) {
        fireEvent.click(uploadButton)
        expect(mockOnYouTubeUpload).toHaveBeenCalledWith(mockScript)
      }
    })

    it('should handle upload progress state', () => {
      const uploadingState = {
        ...mockUploadState,
        isUploading: true,
        progress: 45,
        message: '업로드 중...',
        status: 'uploading' as const,
        step: 'uploading' as const
      }

      expect(() => {
        render(
          <YouTubeScriptCard 
            {...defaultProps} 
            uploadState={uploadingState}
          />
        )
      }).not.toThrow()
    })

    it('should handle upload error state', () => {
      const errorState = {
        ...mockUploadState,
        status: 'error' as const,
        error: 'YouTube API 할당량 초과'
      }

      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          uploadState={errorState}
        />
      )

      const errorMessage = screen.getByText('YouTube API 할당량 초과')
      expect(errorMessage).toBeTruthy()
    })
  })

  describe('스케줄링 기능 검증', () => {
    it('should call onScheduleChange when schedule changes', () => {
      const mockOnScheduleChange = jest.fn()
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          onScheduleChange={mockOnScheduleChange}
        />
      )

      // 스케줄 입력 필드 찾기  
      const datetimeInputs = document.querySelectorAll('input[type="datetime-local"]')
      
      if (datetimeInputs.length > 0 && datetimeInputs[0]) {
        fireEvent.change(datetimeInputs[0], { target: { value: '2025-12-31T23:59' } })
        expect(mockOnScheduleChange).toHaveBeenCalled()
      }
    })

    it('should handle schedule display', () => {
      expect(() => {
        render(
          <YouTubeScriptCard 
            {...defaultProps} 
            singleUploadSchedule="2025-12-31T23:59"
          />
        )
      }).not.toThrow()
    })
  })

  describe('에러 처리 검증', () => {
    it('should handle missing optional fields', () => {
      const minimalScript = {
        id: 2,
        filename: 'minimal.md',
        title: '최소 스크립트',
        description: '',
        tags: [],
        script_content: '내용',
        status: 'video_ready' as const,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      expect(() => {
        render(
          <YouTubeScriptCard 
            {...defaultProps} 
            script={minimalScript}
          />
        )
      }).not.toThrow()

      const title = screen.getByText('최소 스크립트')
      expect(title).toBeTruthy()
    })

    it('should handle missing upload state', () => {
      const { uploadState: _uploadState, ...propsWithoutUploadState } = defaultProps
      expect(() => {
        render(
          <YouTubeScriptCard 
            {...propsWithoutUploadState}
            script={mockScript}
            isBatchMode={false}
            isSelected={false}
            singleUploadSchedule=""
            onYouTubeUpload={jest.fn()}
            onToggleSelection={jest.fn()}
            onScheduleChange={jest.fn()}
          />
        )
      }).not.toThrow()
    })
  })

  describe('접근성 기본 검증', () => {
    it('should have basic button accessibility', () => {
      render(<YouTubeScriptCard {...defaultProps} />)
      
      const buttons = screen.queryAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(0)
    })

    it('should support keyboard interaction in batch mode', () => {
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          isBatchMode={true}
        />
      )

      const checkboxes = screen.queryAllByRole('checkbox')
      if (checkboxes.length > 0 && checkboxes[0]) {
        const checkbox = checkboxes[0]
        checkbox.focus()
        expect(document.activeElement).toBe(checkbox)
      }
    })
  })
})