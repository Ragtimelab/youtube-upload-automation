/**
 * 파이프라인 단계 상세 정보 패널
 * 선택된 단계의 드릴다운 뷰
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, X } from 'lucide-react'
import type { PipelineStage } from './PipelineStages'

interface PipelineDetailPanelProps {
  selectedStage: PipelineStage | null
  onClose: () => void
}

export function PipelineDetailPanel({
  selectedStage,
  onClose
}: PipelineDetailPanelProps) {
  if (!selectedStage) return null

  const getStatusText = (status: PipelineStage['status']) => {
    switch (status) {
      case 'normal':
        return '정상'
      case 'processing':
        return '처리중'
      case 'warning':
        return '주의'
      case 'error':
        return '오류'
      default:
        return '알 수 없음'
    }
  }

  const getStatusBadgeClass = (status: PipelineStage['status']) => {
    switch (status) {
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  return (
    <Card className="mt-8 animate-in slide-in-from-bottom duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {selectedStage.name} 상세 정보
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 현재 상태 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">현재 상태</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">처리 중인 항목</span>
                <span className="font-medium text-lg">{selectedStage.count}개</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">전체 비율</span>
                <span className="font-medium text-lg">{selectedStage.percentage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">마지막 처리</span>
                <span className="font-medium">
                  {selectedStage.lastProcessed && selectedStage.lastProcessed !== '-' 
                    ? selectedStage.lastProcessed 
                    : '처리 기록 없음'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">상태</span>
                <Badge className={getStatusBadgeClass(selectedStage.status)}>
                  {getStatusText(selectedStage.status)}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* 성능 지표 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">성능 지표</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">평균 처리 시간</span>
                <span className="font-medium text-lg">
                  {selectedStage.avgProcessingTime > 0 
                    ? `${selectedStage.avgProcessingTime}초`
                    : '측정 중'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">처리 효율성</span>
                <span className="font-medium text-lg">
                  {selectedStage.percentage > 0 ? '양호' : '대기 중'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">단계 우선순위</span>
                <span className="font-medium">
                  {selectedStage.status === 'error' ? '높음' :
                   selectedStage.status === 'processing' ? '중간' : '일반'}
                </span>
              </div>
            </div>
          </div>
          
          {/* 상세 설명 및 권장사항 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">설명 및 권장사항</h4>
            <div className="space-y-3">
              <p className="text-gray-600 text-sm leading-relaxed">
                {selectedStage.description}
              </p>
              
              {/* 상태별 권장사항 */}
              <div className="p-3 rounded-lg bg-gray-50">
                <h5 className="font-medium text-gray-900 mb-2">권장사항</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  {selectedStage.status === 'error' && (
                    <>
                      <li>• 오류 로그를 확인하세요</li>
                      <li>• 관련 서비스 상태를 점검하세요</li>
                      <li>• 필요시 수동 재시작을 고려하세요</li>
                    </>
                  )}
                  {selectedStage.status === 'warning' && (
                    <>
                      <li>• 리소스 사용량을 모니터링하세요</li>
                      <li>• 처리 속도 최적화를 검토하세요</li>
                    </>
                  )}
                  {selectedStage.status === 'processing' && (
                    <>
                      <li>• 현재 정상적으로 처리 중입니다</li>
                      <li>• 진행 상황을 계속 모니터링하세요</li>
                    </>
                  )}
                  {selectedStage.status === 'normal' && (
                    <>
                      <li>• 단계가 정상 작동 중입니다</li>
                      <li>• 추가 작업을 대기 중입니다</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}