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
import { PAGE_TEXT, UI_TEXT } from '@/constants/text'

export function SettingsPage() {
  return (
    <div className={LAYOUT_STYLES.spacing.section}>
      <div>
        <h1 className={COMMON_STYLES.text.pageTitle}>{PAGE_TEXT.settings.title}</h1>
        <p className={COMMON_STYLES.text.pageDescription}>{PAGE_TEXT.settings.description}</p>
      </div>

      {/* YouTube 설정 */}
      <div className={COMMON_STYLES.card}>
        <div className={COMMON_STYLES.cardHeader}>
          <div className={COMMON_STYLES.iconContainer.default}>
            <Youtube className="h-6 w-6 text-red-600" />
            <h3 className={COMMON_STYLES.text.sectionTitle}>{PAGE_TEXT.settings.youtubeSettings}</h3>
          </div>
        </div>
        <div className={COMMON_STYLES.cardContentSpaced}>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>{PAGE_TEXT.settings.apiConnection}</h4>
              <p className={COMMON_STYLES.text.cardDescription}>{PAGE_TEXT.settings.apiDescription}</p>
            </div>
            <div className={COMMON_STYLES.iconContainer.small}>
              <div className={COMMON_STYLES.indicator.online}></div>
              <span className={COMMON_STYLES.text.success}>{UI_TEXT.common.connected}</span>
            </div>
          </div>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>{PAGE_TEXT.settings.defaultPrivacy}</h4>
              <p className={COMMON_STYLES.text.cardDescription}>{PAGE_TEXT.settings.privacyDescription}</p>
            </div>
            <select className={COMMON_STYLES.input.select}>
              <option value="private">{PAGE_TEXT.settings.private}</option>
              <option value="unlisted">{PAGE_TEXT.settings.unlisted}</option>
              <option value="public">{PAGE_TEXT.settings.public}</option>
            </select>
          </div>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>{PAGE_TEXT.settings.defaultCategory}</h4>
              <p className={COMMON_STYLES.text.cardDescription}>{PAGE_TEXT.settings.categoryDescription}</p>
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
            <h3 className={COMMON_STYLES.text.sectionTitle}>{PAGE_TEXT.settings.fileSettings}</h3>
          </div>
        </div>
        <div className={COMMON_STYLES.cardContentSpaced}>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>{PAGE_TEXT.settings.uploadDirectory}</h4>
              <p className={COMMON_STYLES.text.cardDescription}>uploads/videos</p>
            </div>
            <Button variant="outline" size="sm">{PAGE_TEXT.settings.change}</Button>
          </div>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>{PAGE_TEXT.settings.maxFileSize}</h4>
              <p className={COMMON_STYLES.text.cardDescription}>8GB {PAGE_TEXT.settings.fileSizeNote}</p>
            </div>
            <span className={COMMON_STYLES.text.label}>{PAGE_TEXT.settings.cannotModify}</span>
          </div>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>{PAGE_TEXT.settings.autoBackup}</h4>
              <p className={COMMON_STYLES.text.cardDescription}>{PAGE_TEXT.settings.backupDescription}</p>
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
            <h3 className={COMMON_STYLES.text.sectionTitle}>{PAGE_TEXT.settings.notificationSettings}</h3>
          </div>
        </div>
        <div className={COMMON_STYLES.cardContentSpaced}>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>{PAGE_TEXT.settings.uploadComplete}</h4>
              <p className={COMMON_STYLES.text.cardDescription}>{PAGE_TEXT.settings.uploadCompleteDescription}</p>
            </div>
            <label className={COMMON_STYLES.toggle.container}>
              <input type="checkbox" className={COMMON_STYLES.toggle.hiddenInput} defaultChecked />
              <div className={COMMON_STYLES.toggle.switch}></div>
            </label>
          </div>
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>{PAGE_TEXT.settings.errorNotification}</h4>
              <p className={COMMON_STYLES.text.cardDescription}>{PAGE_TEXT.settings.errorDescription}</p>
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
            <h3 className={COMMON_STYLES.text.sectionTitle}>{PAGE_TEXT.settings.systemInfo}</h3>
          </div>
        </div>
        <div className={COMMON_STYLES.cardContentSpaced}>
          <div className={LAYOUT_STYLES.grid.systemInfo}>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>{PAGE_TEXT.settings.version}</h4>
              <p className={COMMON_STYLES.text.cardDescription}>v1.2.1</p>
            </div>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>{PAGE_TEXT.settings.buildDate}</h4>
              <p className={COMMON_STYLES.text.cardDescription}>2025-08-22</p>
            </div>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>{PAGE_TEXT.settings.pythonVersion}</h4>
              <p className={COMMON_STYLES.text.cardDescription}>3.13</p>
            </div>
            <div>
              <h4 className={COMMON_STYLES.text.cardTitle}>{PAGE_TEXT.settings.fastapiVersion}</h4>
              <p className={COMMON_STYLES.text.cardDescription}>0.116.0</p>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {PAGE_TEXT.settings.downloadLogs}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}