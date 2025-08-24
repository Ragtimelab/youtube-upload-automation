import { Card, CardContent } from '@/components/ui/card'
import { FileText, Video, CheckCircle, Activity } from 'lucide-react'
import { commonLayouts, statusColors } from '@/utils/classNames'

interface SystemStatusCard {
  title: string
  value: number
  icon: typeof FileText
  colorKey: 'info' | 'warning' | 'success' | 'purple'
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
      colorKey: 'info'
    },
    {
      title: '업로드 준비됨',
      value: videoReady,
      icon: Video,
      colorKey: 'warning'
    },
    {
      title: '업로드 완료',
      value: uploaded,
      icon: CheckCircle,
      colorKey: 'success'
    },
    {
      title: '실시간 업로드',
      value: activeUploads,
      icon: Activity,
      colorKey: 'purple'
    }
  ]

  return (
    <div className={`${commonLayouts.gridCols4} ${commonLayouts.gapLg} mb-8`}>
      {systemStatusCards.map((card, index) => {
        const Icon = card.icon
        const colors = statusColors[card.colorKey]
        return (
          <Card key={index} className={`${colors.bg} ${colors.border} border`}>
            <CardContent className={commonLayouts.cardPadding}>
              <div className={commonLayouts.flexBetween}>
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className={`text-3xl font-bold ${colors.text}`}>{card.value}</p>
                </div>
                <Icon className={`h-10 w-10 ${colors.text}`} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}