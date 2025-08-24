import { Card, CardContent } from '@/components/ui/card'
import { FileText, Video, CheckCircle, Activity } from 'lucide-react'

interface SystemStatusCard {
  title: string
  value: number
  icon: typeof FileText
  color: string
  bgColor: string
}

interface SystemStatusCardsProps {
  totalScripts: number
  videoReady: number
  uploaded: number
  activeUploads: number
}

export function SystemStatusCards({
  totalScripts,
  videoReady,
  uploaded,
  activeUploads
}: SystemStatusCardsProps) {
  const systemStatusCards: SystemStatusCard[] = [
    {
      title: '전체 스크립트',
      value: totalScripts,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200'
    },
    {
      title: '업로드 준비됨',
      value: videoReady,
      icon: Video,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200'
    },
    {
      title: '업로드 완료',
      value: uploaded,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200'
    },
    {
      title: '실시간 업로드',
      value: activeUploads,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {systemStatusCards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className={`${card.bgColor} border`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                </div>
                <Icon className={`h-10 w-10 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}