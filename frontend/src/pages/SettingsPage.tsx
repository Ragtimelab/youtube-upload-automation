import { Button } from '@/components/ui/button'
import { 
  Youtube, 
  Database,
  Bell,
  Shield,
  Download
} from 'lucide-react'
import { YOUTUBE_CATEGORIES, DEFAULT_CATEGORY_ID } from '@/constants/youtube'
import { COMMON_STYLES, LAYOUT_STYLES } from '@/constants/styles'

export function SettingsPage() {
  return (
    <div className={LAYOUT_STYLES.spacing.section}>
      <div>
        <h1 className={COMMON_STYLES.text.pageTitle}>설정</h1>
        <p className={COMMON_STYLES.text.pageDescription}>시스템 설정을 관리하고 환경을 구성하세요.</p>
      </div>

      {/* YouTube 설정 */}
      <div className={COMMON_STYLES.card}>
        <div className={COMMON_STYLES.cardHeader}>
          <div className={COMMON_STYLES.iconContainer.default}>
            <Youtube className="h-6 w-6 text-red-600" />
            <h3 className={COMMON_STYLES.text.sectionTitle}>YouTube 설정</h3>
          </div>
        </div>
        <div className={COMMON_STYLES.cardContentSpaced}>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>API 연결 상태</h4>
              <p className={COMMON_STYLES.text.cardDescription}>YouTube Data API v3 연결 상태</p>
            </div>
            <div className={COMMON_STYLES.iconContainer.small}>
              <div className={COMMON_STYLES.indicator.online}></div>
              <span className={COMMON_STYLES.text.success}>연결됨</span>
            </div>
          </div>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>기본 공개 설정</h4>
              <p className={COMMON_STYLES.text.cardDescription}>새 업로드의 기본 공개 설정</p>
            </div>
            <select className={COMMON_STYLES.input.select}>
              <option value="private">비공개</option>
              <option value="unlisted">목록에 없음</option>
              <option value="public">공개</option>
            </select>
          </div>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>기본 카테고리</h4>
              <p className={COMMON_STYLES.text.cardDescription}>업로드할 비디오의 기본 카테고리</p>
            </div>
            <select 
              className={COMMON_STYLES.input.select} 
              defaultValue={DEFAULT_CATEGORY_ID}
            >
              {YOUTUBE_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 파일 설정 */}
      <div className={COMMON_STYLES.card}>
        <div className={COMMON_STYLES.cardHeader}>
          <div className={COMMON_STYLES.iconContainer.default}>
            <Database className="h-6 w-6 text-blue-600" />
            <h3 className={COMMON_STYLES.text.sectionTitle}>파일 설정</h3>
          </div>
        </div>
        <div className={COMMON_STYLES.cardContentSpaced}>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>업로드 디렉토리</h4>
              <p className={COMMON_STYLES.text.cardDescription}>uploads/videos</p>
            </div>
            <Button variant="outline" size="sm">변경</Button>
          </div>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>최대 파일 크기</h4>
              <p className={COMMON_STYLES.text.cardDescription}>8GB (YouTube 제한)</p>
            </div>
            <span className={COMMON_STYLES.text.label}>수정 불가</span>
          </div>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>자동 백업</h4>
              <p className={COMMON_STYLES.text.cardDescription}>업로드된 파일 자동 백업</p>
            </div>
            <label className={COMMON_STYLES.toggle.container}>
              <input type="checkbox" className={COMMON_STYLES.toggle.hiddenInput} defaultChecked />
              <div className={COMMON_STYLES.toggle.switch}></div>
            </label>
          </div>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className={COMMON_STYLES.card}>
        <div className={COMMON_STYLES.cardHeader}>
          <div className={COMMON_STYLES.iconContainer.default}>
            <Bell className="h-6 w-6 text-yellow-600" />
            <h3 className={COMMON_STYLES.text.sectionTitle}>알림 설정</h3>
          </div>
        </div>
        <div className={COMMON_STYLES.cardContentSpaced}>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>업로드 완료 알림</h4>
              <p className={COMMON_STYLES.text.cardDescription}>YouTube 업로드 완료 시 알림</p>
            </div>
            <label className={COMMON_STYLES.toggle.container}>
              <input type="checkbox" className={COMMON_STYLES.toggle.hiddenInput} defaultChecked />
              <div className={COMMON_STYLES.toggle.switch}></div>
            </label>
          </div>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>오류 알림</h4>
              <p className={COMMON_STYLES.text.cardDescription}>업로드 오류 발생 시 알림</p>
            </div>
            <label className={COMMON_STYLES.toggle.container}>
              <input type="checkbox" className={COMMON_STYLES.toggle.hiddenInput} defaultChecked />
              <div className={COMMON_STYLES.toggle.switch}></div>
            </label>
          </div>
        </div>
      </div>

      {/* 시스템 정보 */}
      <div className={COMMON_STYLES.card}>
        <div className={COMMON_STYLES.cardHeader}>
          <div className={COMMON_STYLES.iconContainer.default}>
            <Shield className="h-6 w-6 text-green-600" />
            <h3 className={COMMON_STYLES.text.sectionTitle}>시스템 정보</h3>
          </div>
        </div>
        <div className={COMMON_STYLES.cardContentSpaced}>
          <div className={LAYOUT_STYLES.grid.systemInfo}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>버전</h4>
              <p className={COMMON_STYLES.text.cardDescription}>v1.2.1</p>
            </div>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>빌드 날짜</h4>
              <p className={COMMON_STYLES.text.cardDescription}>2025-08-22</p>
            </div>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>Python 버전</h4>
              <p className={COMMON_STYLES.text.cardDescription}>3.13</p>
            </div>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>FastAPI 버전</h4>
              <p className={COMMON_STYLES.text.cardDescription}>0.116.0</p>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              로그 다운로드
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}