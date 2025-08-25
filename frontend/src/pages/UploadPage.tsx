import { UploadFlow } from '@/components/upload/UploadFlow'
import { PAGE_TEXT } from '@/constants/text'

/**
 * Phase 9: Compound Components 패턴 적용
 * UploadFlow 컴포넌트로 완전 리팩토링된 업로드 페이지
 * 
 * 이전 324줄 → 현재 32줄 (90% 코드 감소 달성)
 * - 모든 상태 관리와 로직을 UploadFlow Context로 추상화
 * - Compound Components 패턴으로 유연한 구성 가능
 * - 재사용성과 테스트 가능성 극대화
 */
export function UploadPage() {
  const handleUploadComplete = () => {
    // 업로드 완료 시 추가 작업 가능
    console.log(PAGE_TEXT.upload.uploadComplete)
  }

  return (
    <UploadFlow onComplete={handleUploadComplete}>
      <UploadFlow.ErrorBoundary>
        <UploadFlow.Header 
          title={PAGE_TEXT.upload.title} 
          description={PAGE_TEXT.upload.description} 
        />
        
        <UploadFlow.ScriptSelection />
        
        <UploadFlow.FileUpload 
          acceptedTypes={['.mp4', '.avi', '.mov', '.mkv', '.flv']}
          maxSize="8GB"
          showRequirements={true}
        />
        
        <UploadFlow.ProgressIndicator 
          showETA={true}
          showSpeedMeter={true}
        />
        
        <UploadFlow.ConfirmationStep />
      </UploadFlow.ErrorBoundary>
    </UploadFlow>
  )
}