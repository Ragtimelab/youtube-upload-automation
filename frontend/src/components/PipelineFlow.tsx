import React, { useState, useEffect } from 'react'
import { ArrowRight, Activity, CheckCircle2, AlertTriangle, Clock, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PipelineFlowProps {
  stages: Array<{
    id: string
    name: string
    count: number
    status: 'normal' | 'warning' | 'error' | 'processing'
    icon: React.ComponentType<{ className?: string }>
    avgProcessingTime: number
  }>
  flows: Array<{
    from: string
    to: string
    throughput: number
    status: 'active' | 'blocked' | 'slow'
  }>
  isAnimated: boolean
  onStageClick?: (_stageId: string) => void
}

export function PipelineFlow({ stages, flows, isAnimated, onStageClick }: PipelineFlowProps) {
  const [_flowAnimation, setFlowAnimation] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (!isAnimated) return

    const interval = setInterval(() => {
      // 플로우 애니메이션 토글
      setFlowAnimation(prev => {
        const newState: { [key: string]: boolean } = {}
        flows.forEach((flow) => {
          if (flow.status === 'active' && flow.throughput > 0) {
            newState[`${flow.from}-${flow.to}`] = !prev[`${flow.from}-${flow.to}`]
          }
        })
        return newState
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [flows, isAnimated])

  const getStageStatusColor = (status: string, count: number) => {
    if (status === 'error') return 'border-red-500 bg-red-50 shadow-red-100'
    if (status === 'warning') return 'border-yellow-500 bg-yellow-50 shadow-yellow-100'
    if (status === 'processing') return 'border-blue-500 bg-blue-50 shadow-blue-100'
    if (count === 0) return 'border-gray-300 bg-gray-50 shadow-gray-100'
    return 'border-green-500 bg-green-50 shadow-green-100'
  }

  const getStageIconColor = (status: string, count: number) => {
    if (status === 'error') return 'text-red-600'
    if (status === 'warning') return 'text-yellow-600'
    if (status === 'processing') return 'text-blue-600'
    if (count === 0) return 'text-gray-400'
    return 'text-green-600'
  }

  const getFlowColor = (flow: { status: string; throughput: number }) => {
    if (flow.status === 'blocked') return 'text-red-500'
    if (flow.status === 'slow') return 'text-yellow-500'
    if (flow.status === 'active' && flow.throughput > 0) return 'text-blue-500'
    return 'text-gray-400'
  }

  const renderFlowParticles = (_flowKey: string, flow: { status: string; throughput: number }) => {
    if (!isAnimated || flow.status !== 'active' || flow.throughput === 0) return null

    return (
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-500 rounded-full opacity-70"
            style={{
              animation: `flowParticle ${2 + i * 0.3}s linear infinite`,
              animationDelay: `${i * 0.5}s`,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="relative p-8">
      <style>{`
        @keyframes flowParticle {
          0% {
            left: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
          }
        }
      `}</style>

      <div className="flex items-center justify-between">
        {stages.slice(0, 4).map((stage, index) => {
          const Icon = stage.icon
          const isActive = stage.count > 0 || stage.status === 'processing'
          const flowKey = index < 3 ? `${stage.id}-${stages[index + 1]?.id}` : ''
          const currentFlow = flows.find(f => `${f.from}-${f.to}` === flowKey)

          return (
            <div key={stage.id} className="flex items-center">
              {/* 스테이지 박스 */}
              <div
                className={`
                  relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-500 hover:scale-105
                  ${getStageStatusColor(stage.status, stage.count)}
                  ${isActive && isAnimated ? 'shadow-lg' : 'shadow-sm'}
                  ${stage.status === 'processing' && isAnimated ? 'animate-pulse' : ''}
                `}
                onClick={() => onStageClick?.(stage.id)}
                style={
                  stage.status === 'processing' && isAnimated
                    ? { animation: 'pulse-glow 2s ease-in-out infinite' }
                    : {}
                }
              >
                <div className="flex flex-col items-center text-center min-w-[120px]">
                  <Icon
                    className={`
                      h-8 w-8 mb-2 transition-all duration-300
                      ${getStageIconColor(stage.status, stage.count)}
                      ${stage.status === 'processing' && isAnimated ? 'animate-spin' : ''}
                    `}
                  />
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stage.count}</div>
                  <div className="text-sm font-medium text-gray-700">{stage.name}</div>
                  
                  {/* 평균 처리 시간 */}
                  {stage.avgProcessingTime > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {stage.avgProcessingTime}초
                    </div>
                  )}
                </div>

                {/* 처리 중 인디케이터 */}
                {stage.status === 'processing' && (
                  <div className="absolute -top-2 -right-2">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                      <Activity className="h-3 w-3 text-white animate-spin" />
                    </div>
                  </div>
                )}

                {/* 오류 인디케이터 */}
                {stage.status === 'error' && (
                  <div className="absolute -top-2 -right-2">
                    <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                      <AlertTriangle className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* 플로우 화살표 (마지막 스테이지 제외) */}
              {index < 3 && currentFlow && (
                <div className="mx-4 flex flex-col items-center">
                  <div className="relative w-24 h-px bg-gray-300">
                    {renderFlowParticles(flowKey, currentFlow)}
                    
                    <ArrowRight
                      className={`
                        absolute right-0 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-all duration-300
                        ${getFlowColor(currentFlow)}
                        ${currentFlow.status === 'active' && isAnimated ? 'animate-pulse' : ''}
                      `}
                    />
                    
                    {/* 처리량 표시 */}
                    {currentFlow.throughput > 0 && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <Badge 
                          className={`text-xs px-2 py-1 ${
                            currentFlow.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            currentFlow.status === 'slow' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          } border-0`}
                        >
                          {currentFlow.throughput}/min
                        </Badge>
                      </div>
                    )}
                    
                    {/* 병목 표시 */}
                    {currentFlow.status === 'blocked' && (
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                        <Badge className="text-xs bg-red-100 text-red-800 border-0">
                          병목
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 오류 스테이지 (별도 표시) */}
      {stages.find(s => s.id === 'error' && s.count > 0) && (
        <div className="mt-12 flex justify-center">
          <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-red-500 bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-600 animate-pulse" />
            <div>
              <div className="text-lg font-bold text-red-700">
                {stages.find(s => s.id === 'error')?.count} 오류 발생
              </div>
              <div className="text-sm text-red-600">즉시 확인이 필요합니다</div>
            </div>
            <div className="ml-4">
              <Badge className="bg-red-600 text-white hover:bg-red-700 cursor-pointer">
                오류 해결
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* 실시간 처리 통계 */}
      {isAnimated && (
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">처리 속도</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {flows.reduce((sum, f) => sum + f.throughput, 0)}/min
            </div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">활성 플로우</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {flows.filter(f => f.status === 'active').length}
            </div>
          </div>
          
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">완료율</span>
            </div>
            <div className="text-lg font-bold text-purple-600">
              {Math.round((stages.find(s => s.id === 'uploaded')?.count || 0) / 
                Math.max(stages.reduce((sum, s) => sum + s.count, 0), 1) * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  )
}