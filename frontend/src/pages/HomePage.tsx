import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Upload, 
  Youtube, 
  BarChart3,
  Clock,
  CheckCircle2,
  Activity,
  AlertTriangle
} from 'lucide-react'
import { scriptApi } from '@/services/api'
import { PAGE_TEXT, UI_TEXT } from '@/constants/text'

export function HomePage() {
  const navigate = useNavigate()
  const [statistics, setStatistics] = useState<{
    total: number
    script_ready: number
    video_ready: number
    uploaded: number
    scheduled: number
    error: number
  } | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)

  // API 데이터 로드
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const data = await scriptApi.getStatistics()
        setStatistics(data.statistics)
      } catch (error) {
        console.error(PAGE_TEXT.home.statisticsLoadError, error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatistics()
  }, [])

  const quickActions = [
    {
      title: PAGE_TEXT.home.newScriptUpload,
      description: PAGE_TEXT.home.scriptUploadDescription,
      icon: FileText,
      href: '/scripts',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: PAGE_TEXT.home.videoUpload,
      description: PAGE_TEXT.home.videoUploadDescription,
      icon: Upload,
      href: '/upload',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: PAGE_TEXT.home.youtubePublish,
      description: PAGE_TEXT.home.youtubePublishDescription,
      icon: Youtube,
      href: '/youtube',
      color: 'bg-red-500 hover:bg-red-600',
    },
  ]

  // 실제 데이터 기반 통계 (더미 데이터 제거)
  const recentStats = statistics ? [
    { label: PAGE_TEXT.home.totalScripts, value: statistics.total.toString(), icon: FileText },
    { label: PAGE_TEXT.home.uploadComplete, value: statistics.uploaded.toString(), icon: CheckCircle2 },
    { label: PAGE_TEXT.home.processing, value: (statistics.video_ready).toString(), icon: Clock },
    { label: PAGE_TEXT.home.errorOccurred, value: statistics.error.toString(), icon: AlertTriangle },
  ] : [
    { label: PAGE_TEXT.home.totalScripts, value: '-', icon: FileText },
    { label: PAGE_TEXT.home.uploadComplete, value: '-', icon: CheckCircle2 },
    { label: PAGE_TEXT.home.processing, value: '-', icon: Clock },
    { label: PAGE_TEXT.home.errorOccurred, value: '-', icon: AlertTriangle },
  ]

  return (
    <div className="space-y-8">
      {/* 헤더 섹션 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {PAGE_TEXT.home.title}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {PAGE_TEXT.home.description}
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {recentStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  {isLoading ? (
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  )}
                </div>
                <Icon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          )
        })}
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center space-y-4">
                <div className={`inline-flex p-4 rounded-full ${action.color} text-white`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    {action.description}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate(action.href)}
                >
                  {PAGE_TEXT.home.startNow}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 실시간 상태 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{PAGE_TEXT.home.realTimeStatus}</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/status')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {UI_TEXT.button.viewDetails}
          </Button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>{PAGE_TEXT.home.realTimeDescription}</p>
          <p className="text-sm mt-2">{PAGE_TEXT.home.realTimeSubDescription}</p>
        </div>
      </div>
    </div>
  )
}