/**
 * YouTubeScriptCard 컴포넌트 단위 테스트
 * Phase 7: 테스트 전략 및 품질 보증 - 실제 컴포넌트 구조 기반
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { YouTubeScriptCard } from '../youtube/YouTubeScriptCard'
import type { Script, YouTubeUploadProgress } from '@/types/index'

// 실제 컴포넌트 props에 맞는 모의 데이터
const mockScript: Script = {
  id: 1,
  title: '테스트 스크립트 제목',
  description: '테스트 스크립트 설명입니다.',
  content: '스크립트 내용',
  tags: ['테스트', '샘플'],
  status: 'video_ready',
  filename: 'test-script.md',
  video_filename: 'test-video.mp4',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
}

const mockUploadState: YouTubeUploadProgress = {
  scriptId: 1,
  isUploading: false,
  progress: 0,
  message: '',
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
      expect(screen.getByText('비디오 준비됨')).toBeInTheDocument()
    })

    it('should render file information', () => {
      render(<YouTubeScriptCard {...defaultProps} />)

      expect(screen.getByText('test-script.md')).toBeInTheDocument()
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
    })

    it('should render tags', () => {
      render(<YouTubeScriptCard {...defaultProps} />)

      expect(screen.getByText('테스트')).toBeInTheDocument()
      expect(screen.getByText('샘플')).toBeInTheDocument()
    })
  })

  describe('배치 모드', () => {
    it('should show checkbox in batch mode', () => {
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          isBatchMode={true}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).not.toBeChecked()
    })

    it('should call onToggleSelection when checkbox clicked', () => {
      const mockOnToggleSelection = jest.fn()
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          isBatchMode={true}
          onToggleSelection={mockOnToggleSelection}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      expect(mockOnToggleSelection).toHaveBeenCalledWith(1)
    })

    it('should show selected badge when isSelected is true', () => {
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          isBatchMode={true}
          isSelected={true}
        />
      )

      expect(screen.getByText('선택됨')).toBeInTheDocument()
    })

    it('should disable checkbox for non-video_ready scripts', () => {
      const scriptNotReady = {
        ...mockScript,
        status: 'script_ready' as const
      }

      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          script={scriptNotReady}
          isBatchMode={true}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeDisabled()
    })
  })

  describe('상태별 표시', () => {
    it('should show correct status for video_ready', () => {
      render(<YouTubeScriptCard {...defaultProps} />)
      expect(screen.getByText('비디오 준비됨')).toBeInTheDocument()
    })

    it('should show correct status for uploaded', () => {
      const uploadedScript = {
        ...mockScript,
        status: 'uploaded' as const,
        youtube_url: 'https://youtube.com/watch?v=test'
      }

      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          script={uploadedScript}
        />
      )

      expect(screen.getByText('업로드 완료')).toBeInTheDocument()
      expect(screen.getByText('YouTube에서 보기')).toBeInTheDocument()
    })

    it('should show correct status for script_ready', () => {
      const scriptOnlyScript = {
        ...mockScript,
        status: 'script_ready' as const
      }

      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          script={scriptOnlyScript}
        />
      )

      expect(screen.getByText('스크립트만 있음')).toBeInTheDocument()
      expect(screen.getByText('비디오 업로드 필요')).toBeInTheDocument()
    })

    it('should show error status', () => {
      const errorScript = {
        ...mockScript,
        status: 'error' as const
      }

      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          script={errorScript}
        />
      )

      expect(screen.getByText('error')).toBeInTheDocument()
      expect(screen.getByText('오류 발생')).toBeInTheDocument()
    })
  })

  describe('업로드 기능', () => {
    it('should show upload button for video_ready scripts', () => {
      render(<YouTubeScriptCard {...defaultProps} />)

      const uploadButton = screen.getByText('YouTube 업로드')
      expect(uploadButton).toBeInTheDocument()
    })

    it('should call onYouTubeUpload when upload button clicked', () => {
      const mockOnYouTubeUpload = jest.fn()
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          onYouTubeUpload={mockOnYouTubeUpload}
        />
      )

      const uploadButton = screen.getByText('YouTube 업로드')
      fireEvent.click(uploadButton)

      expect(mockOnYouTubeUpload).toHaveBeenCalledWith(mockScript)
    })

    it('should show upload progress when uploading', () => {
      const uploadingState = {
        ...mockUploadState,
        isUploading: true,
        progress: 45,
        message: '업로드 중...',
        step: 'uploading' as const
      }

      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          uploadState={uploadingState}
        />
      )

      expect(screen.getByText('실시간 업로드 진행률')).toBeInTheDocument()
      expect(screen.getByText('45%')).toBeInTheDocument()
      expect(screen.getByText('업로드 중...')).toBeInTheDocument()
      expect(screen.getByText('WebSocket 실시간 연결됨')).toBeInTheDocument()
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

  describe('예약 발행', () => {
    it('should show schedule input for video_ready scripts in single mode', () => {
      render(<YouTubeScriptCard {...defaultProps} />)

      expect(screen.getByText('예약 발행 시간 (선택사항)')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('즉시 업로드하려면 비워두세요')).toBeInTheDocument()
    })

    it('should call onScheduleChange when schedule input changes', () => {
      const mockOnScheduleChange = jest.fn()
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          onScheduleChange={mockOnScheduleChange}
        />
      )

      const scheduleInput = screen.getByPlaceholderText('즉시 업로드하려면 비워두세요')
      fireEvent.change(scheduleInput, { target: { value: '2025-12-31T23:59' } })

      expect(mockOnScheduleChange).toHaveBeenCalledWith(1, '2025-12-31T23:59')
    })

    it('should show scheduled upload button when schedule is set', () => {
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          singleUploadSchedule="2025-12-31T23:59"
        />
      )

      expect(screen.getByText('예약 발행 설정')).toBeInTheDocument()
    })

    it('should not show schedule input in batch mode', () => {
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          isBatchMode={true}
        />
      )

      expect(screen.queryByText('예약 발행 시간 (선택사항)')).not.toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('should have proper semantic structure', () => {
      render(<YouTubeScriptCard {...defaultProps} />)

      // Card 구조가 의미론적으로 올바른지 확인
      expect(screen.getByRole('button', { name: /YouTube 업로드/ })).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          isBatchMode={true}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()
      expect(document.activeElement).toBe(checkbox)

      // Enter 키로 체크박스 토글
      fireEvent.keyDown(checkbox, { key: 'Enter' })
      // 실제 체크박스는 스페이스바로 토글되므로 스페이스바도 테스트
      fireEvent.keyDown(checkbox, { key: ' ' })
    })
  })

  describe('에러 처리', () => {
    it('should handle missing optional fields gracefully', () => {
      const minimalScript = {
        id: 1,
        title: '최소 정보만 있는 스크립트',
        status: 'video_ready' as const,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      } as Script

      expect(() => {
        render(
          <YouTubeScriptCard 
            {...defaultProps} 
            script={minimalScript}
          />
        )
      }).not.toThrow()

      expect(screen.getByText('최소 정보만 있는 스크립트')).toBeInTheDocument()
      expect(screen.getByText('설명 없음')).toBeInTheDocument()
    })

    it('should handle empty tags array', () => {
      const scriptWithoutTags = {
        ...mockScript,
        tags: []
      }

      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          script={scriptWithoutTags}
        />
      )

      // 태그 섹션이 렌더링되지 않아야 함
      expect(screen.queryByText('테스트')).not.toBeInTheDocument()
    })

    it('should truncate long descriptions', () => {
      const longDescription = 'a'.repeat(150)
      const scriptWithLongDescription = {
        ...mockScript,
        description: longDescription
      }

      render(
        <YouTubeScriptCard 
          {...defaultProps} 
          script={scriptWithLongDescription}
        />
      )

      const displayedText = screen.getByText(/aaa.*\.\.\./)
      expect(displayedText.textContent?.length).toBeLessThan(150)
      expect(displayedText.textContent).toMatch(/\.\.\./)
    })
  })
})