import { ScriptsManager } from '@/components/scripts/ScriptsManager'
import { Environment } from '@/utils/ssrHelpers'
import { ProfiledComponent } from '@/utils/performanceAnalyzer'
import { COMMON_STYLES, LAYOUT_STYLES } from '@/constants/styles'
import { PAGE_TEXT, UI_TEXT } from '@/constants/text'

/**
 * Phase 11: SSR 호환성 및 성능 모니터링 추가
 * ScriptsManager 컴포넌트로 완전 리팩토링된 스크립트 페이지
 * 
 * Phase 9 성과: 이전 245줄 → 38줄 (84% 코드 감소 달성)
 * - 모든 상태 관리와 로직을 ScriptsManager Context로 추상화
 * - Compound Components 패턴으로 유연한 구성 가능
 * - 재사용성과 테스트 가능성 극대화
 * 
 * Phase 11 추가:
 * - SSR 안전성 보장
 * - 성능 프로파일링 자동화
 */
export function ScriptsPage() {
  // SSR 호환성 체크
  if (Environment.isServer()) {
    return (
      <div className={`${LAYOUT_STYLES.container.page} p-8`}>
        <div className={LAYOUT_STYLES.container.main}>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{PAGE_TEXT.scripts.title}</h1>
          <p className={`${COMMON_STYLES.text.pageDescription} mb-8`}>{PAGE_TEXT.scripts.description}</p>
          <div className="text-center py-12">
            <p className={COMMON_STYLES.text.label}>{PAGE_TEXT.dashboard.serverRendering}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProfiledComponent name="ScriptsPage">
      <ScriptsManager>
      <ScriptsManager.Header 
        title={PAGE_TEXT.scripts.title}
        description={PAGE_TEXT.scripts.description}
      />
      
      <ScriptsManager.SearchBar placeholder={PAGE_TEXT.scripts.searchPlaceholder} />
      
      <ScriptsManager.FilterTabs />
      
      <ScriptsManager.Content>
        <ScriptsManager.List />
        
        <ScriptsManager.Sidebar>
          <div className={`${LAYOUT_STYLES.flex.between} mb-4`}>
            <h3 className={`${COMMON_STYLES.text.small} font-medium text-gray-900`}>{UI_TEXT.common.displayOptions}</h3>
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
    </ProfiledComponent>
  )
}