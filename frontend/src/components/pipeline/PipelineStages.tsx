/**
 * 파이프라인 단계 카드 컴포넌트
 * 4개 주요 처리 단계를 시각적으로 표시
 */

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock
} from 'lucide-react'

export interface PipelineStage {
  id: string
  name: string
  count: number
  percentage: number
  status: 'normal' | 'warning' | 'error' | 'processing'
  icon: React.ComponentType<{ className?: string }>
  description: string
  avgProcessingTime: number
  lastProcessed?: string
}

interface PipelineStagesProps {
  stages: PipelineStage[]
  selectedStage: string | null
  onStageSelect: (stageId: string) => void
  animationEnabled: boolean
}

export function PipelineStages({
  stages,
  selectedStage,
  onStageSelect,
  animationEnabled
}: PipelineStagesProps) {
  const getStatusColor = (status: PipelineStage['status']) => {
    switch (status) {
      case 'error':
        return 'bg-red-50 border-red-200 hover:bg-red-100'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
      case 'processing':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100'
      default:
        return 'bg-green-50 border-green-200 hover:bg-green-100'
    }
  }

  const getIconColor = (status: PipelineStage['status']) => {
    switch (status) {
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'processing':
        return 'text-blue-600'
      default:
        return 'text-green-600'
    }
  }

  const getStatusIcon = (status: PipelineStage['status']) => {
    switch (status) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'processing':
        return <div className="animate-pulse">
          <div className="h-4 w-4 bg-blue-600 rounded-full" />
        </div>
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stages.map((stage, index) => {
        const Icon = stage.icon
        const isSelected = selectedStage === stage.id
        
        return (
          <Card
            key={stage.id}
            className={`
              cursor-pointer transition-all duration-300 
              ${getStatusColor(stage.status)}
              ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}
              ${animationEnabled ? 'hover:scale-105 hover:shadow-md' : ''}
            `}
            onClick={() => onStageSelect(stage.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white shadow-sm ${getIconColor(stage.status)}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{stage.name}</h3>
                    <p className="text-sm text-gray-600">{stage.description}</p>
                  </div>
                </div>
                {getStatusIcon(stage.status)}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-gray-900">
                    {stage.count}
                  </span>
                  <Badge
                    className={
                      stage.status === 'error' ? 'bg-red-100 text-red-800' :
                      stage.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      stage.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }
                  >
                    {stage.percentage}%
                  </Badge>
                </div>

                {stage.avgProcessingTime > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>평균 {stage.avgProcessingTime}초</span>
                  </div>
                )}

                {stage.lastProcessed && stage.lastProcessed !== '-' && (
                  <div className="text-xs text-gray-500">
                    마지막: {stage.lastProcessed}
                  </div>
                )}
              </div>

              {/* 연결선 애니메이션 (마지막 단계가 아닌 경우) */}
              {animationEnabled && index < stages.length - 1 && (
                <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 hidden lg:block">
                  <div className="flex items-center">
                    <div className="w-6 h-0.5 bg-gray-300"></div>
                    <div className="w-0 h-0 border-l-4 border-l-gray-300 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}