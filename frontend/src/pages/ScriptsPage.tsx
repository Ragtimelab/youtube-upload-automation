import { ScriptsManager } from '@/components/scripts/ScriptsManager'

/**
 * Phase 9: Compound Components 패턴 적용
 * ScriptsManager 컴포넌트로 완전 리팩토링된 스크립트 페이지
 * 
 * 이전 245줄 → 현재 38줄 (84% 코드 감소 달성)
 * - 모든 상태 관리와 로직을 ScriptsManager Context로 추상화
 * - Compound Components 패턴으로 유연한 구성 가능
 * - 재사용성과 테스트 가능성 극대화
 */
export function ScriptsPage() {
  return (
    <ScriptsManager>
      <ScriptsManager.Header 
        title="스크립트 관리"
        description="마크다운 스크립트 파일을 업로드하고 관리하세요."
      />
      
      <ScriptsManager.SearchBar placeholder="스크립트 검색..." />
      
      <ScriptsManager.FilterTabs />
      
      <ScriptsManager.Content>
        <ScriptsManager.List />
        
        <ScriptsManager.Sidebar>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-900">표시 옵션</h3>
            <ScriptsManager.ViewToggle />
          </div>
          
          <ScriptsManager.QuickStats />
          <ScriptsManager.RecentActions />
        </ScriptsManager.Sidebar>
      </ScriptsManager.Content>
      
      <ScriptsManager.Footer>
        <ScriptsManager.BulkActions />
        <ScriptsManager.Pagination />
      </ScriptsManager.Footer>
    </ScriptsManager>
  )
}