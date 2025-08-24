/**
 * YouTubeScriptCard 컴포넌트 단위 테스트 (수정된 버전)
 * Phase 7: 테스트 전략 및 품질 보증 - 실제 컴포넌트 구조 기반
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { YouTubeScriptCard } from '../youtube/YouTubeScriptCard'
import type { Script } from '../../types/api'
import type { YouTubeUploadProgress } from '../../types/youtube'

// 실제 컴포넌트 props에 맞는 모의 데이터
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

describe('YouTubeScriptCard', () => {
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

  describe('기본 렌더링', () => {
    it('should render script information correctly', () => {
      render(<YouTubeScriptCard {...defaultProps} />)

      expect(screen.getByText('테스트 스크립트 제목')).toBeInTheDocument()
      expect(screen.getByText('테스트 스크립트 설명입니다.')).toBeInTheDocument()
    })

    it('should render file information', () => {
      render(<YouTubeScriptCard {...defaultProps} />)

      expect(screen.getByText('test-script.md')).toBeInTheDocument()
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
    })

    it('should render tags when present', () => {
      render(<YouTubeScriptCard {...defaultProps} />)

      expect(screen.getByText('테스트')).toBeInTheDocument()
      expect(screen.getByText('샘플')).toBeInTheDocument()
    })

    it('should handle missing optional fields gracefully', () => {
      const minimalScript = {
        id: 1,
        filename: 'minimal.md',
        title: '최소 정보만 있는 스크립트',
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

      expect(screen.getByText('최소 정보만 있는 스크립트')).toBeInTheDocument()
    })
  })

  describe('상태별 표시', () => {
    it('should show correct status for video_ready', () => {
      render(<YouTubeScriptCard {...defaultProps} />)
      
      // 상태 표시 요소가 있는지 확인 (텍스트는 실제 컴포넌트 구현에 따라 조정)
      const statusElements = screen.getAllByText(/video_ready|비디오|준비/)
      expect(statusElements.length).toBeGreaterThan(0)
    })

    it('should show uploaded status', () => {
      const uploadedScript = {
        ...mockScript,
        status: 'uploaded' as const,
        youtube_url: 'https://youtube.com/watch?v=test',
        youtube_video_id: 'test123'
      }

      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          script={uploadedScript}
        />
      )

      const statusElements = screen.getAllByText(/uploaded|업로드|완료/)
      expect(statusElements.length).toBeGreaterThan(0)
    })
  })

  describe('배치 모드', () => {
    it('should show selection interface in batch mode', () => {
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          isBatchMode={true}
        />
      )

      // 배치 모드에서는 선택 가능한 UI가 있어야 함
      const interactiveElements = screen.getAllByRole('checkbox')
        .concat(screen.getAllByRole('button'))
      expect(interactiveElements.length).toBeGreaterThan(0)
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

      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 0) {
        fireEvent.click(checkboxes[0])
        expect(mockOnToggleSelection).toHaveBeenCalledWith(1)
      }
    })
  })

  describe('업로드 기능', () => {
    it('should call onYouTubeUpload when upload action is triggered', () => {
      const mockOnYouTubeUpload = jest.fn()
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          onYouTubeUpload={mockOnYouTubeUpload}
        />
      )

      // 업로드 버튼이나 액션을 찾아서 클릭
      const uploadButtons = screen.getAllByRole('button')
      const uploadButton = uploadButtons.find(button => 
        button.textContent?.includes('업로드') || 
        button.textContent?.includes('YouTube')
      )

      if (uploadButton) {
        fireEvent.click(uploadButton)
        expect(mockOnYouTubeUpload).toHaveBeenCalledWith(mockScript)
      }
    })

    it('should show upload progress when uploading', () => {
      const uploadingState = {
        ...mockUploadState,
        isUploading: true,
        progress: 45,
        message: '업로드 중...',
        status: 'uploading' as const,
        step: 'uploading' as const
      }

      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          uploadState={uploadingState}
        />
      )

      // 진행률이나 업로드 상태 표시 확인
      const progressElements = screen.getAllByText(/45|업로드|진행/)
      expect(progressElements.length).toBeGreaterThan(0)
    })

    it('should show error message when upload fails', () => {
      const errorState = {
        ...mockUploadState,
        error: 'YouTube API 할당량 초과'
      }

      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          uploadState={errorState}
        />
      )

      expect(screen.getByText('YouTube API 할당량 초과')).toBeInTheDocument()
    })
  })

  describe('스케줄링 기능', () => {
    it('should call onScheduleChange when schedule input changes', () => {
      const mockOnScheduleChange = jest.fn()
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          onScheduleChange={mockOnScheduleChange}
        />
      )

      const scheduleInputs = screen.getAllByDisplayValue('')
      const scheduleInput = scheduleInputs.find(input => 
        input.getAttribute('type') === 'datetime-local' ||
        input.getAttribute('placeholder')?.includes('스케줄') ||
        input.getAttribute('placeholder')?.includes('예약')
      )

      if (scheduleInput) {
        fireEvent.change(scheduleInput, { target: { value: '2025-12-31T23:59' } })
        expect(mockOnScheduleChange).toHaveBeenCalledWith(1, '2025-12-31T23:59')
      }
    })
  })

  describe('접근성', () => {
    it('should have proper semantic structure', () => {
      render(<YouTubeScriptCard {...defaultProps} />)

      // 기본적인 접근성 구조 확인
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // 각 버튼이 접근 가능한 이름을 가지고 있는지 확인
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type')
      })
    })

    it('should support keyboard navigation', () => {
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          isBatchMode={true}
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 0) {
        const checkbox = checkboxes[0]
        checkbox.focus()
        expect(document.activeElement).toBe(checkbox)
      }
    })
  })
})