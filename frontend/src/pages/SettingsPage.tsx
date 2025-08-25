import { Button } from '@/components/ui/button'
import { 
  Youtube, 
  Database,
  Bell,
  Shield,
  Download
} from 'lucide-react'
import { YOUTUBE_CATEGORIES, DEFAULT_CATEGORY_ID } from '@/constants/youtube'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-600 mt-1">시스템 설정을 관리하고 환경을 구성하세요.</p>
      </div>

      {/* YouTube 설정 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Youtube className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-medium text-gray-900">YouTube 설정</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">API 연결 상태</h4>
              <p className="text-sm text-gray-600">YouTube Data API v3 연결 상태</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600">연결됨</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">기본 공개 설정</h4>
              <p className="text-sm text-gray-600">새 업로드의 기본 공개 설정</p>
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="private">비공개</option>
              <option value="unlisted">목록에 없음</option>
              <option value="public">공개</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">기본 카테고리</h4>
              <p className="text-sm text-gray-600">업로드할 비디오의 기본 카테고리</p>
            </div>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm" 
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
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">파일 설정</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">업로드 디렉토리</h4>
              <p className="text-sm text-gray-600">uploads/videos</p>
            </div>
            <Button variant="outline" size="sm">변경</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">최대 파일 크기</h4>
              <p className="text-sm text-gray-600">8GB (YouTube 제한)</p>
            </div>
            <span className="text-sm text-gray-500">수정 불가</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">자동 백업</h4>
              <p className="text-sm text-gray-600">업로드된 파일 자동 백업</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-medium text-gray-900">알림 설정</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">업로드 완료 알림</h4>
              <p className="text-sm text-gray-600">YouTube 업로드 완료 시 알림</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">오류 알림</h4>
              <p className="text-sm text-gray-600">업로드 오류 발생 시 알림</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 시스템 정보 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">시스템 정보</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900">버전</h4>
              <p className="text-sm text-gray-600">v1.2.1</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">빌드 날짜</h4>
              <p className="text-sm text-gray-600">2025-08-22</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Python 버전</h4>
              <p className="text-sm text-gray-600">3.13</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">FastAPI 버전</h4>
              <p className="text-sm text-gray-600">0.116.0</p>
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