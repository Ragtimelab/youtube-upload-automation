import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const ManagePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">업로드 관리</h2>
          <p className="mt-1 text-sm text-gray-600">
            등록된 대본과 업로드 상태를 관리하세요.
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">전체</Button>
          <Button variant="outline" size="sm">대기중</Button>
          <Button variant="outline" size="sm">완료</Button>
          <Button variant="outline" size="sm">오류</Button>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">📝</div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    건강한 아침 운동법
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      비디오 업로드 대기
                    </span>
                    <span>등록: 2025-01-15 10:30</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm">비디오 업로드</Button>
                <Button variant="outline" size="sm">수정</Button>
                <Button variant="outline" size="sm">삭제</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">🎬</div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    맛있는 김치찌개 레시피
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ YouTube 업로드 완료
                    </span>
                    <span>YouTube: youtu.be/abc123</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">YouTube에서 보기</Button>
                <Button variant="outline" size="sm">통계</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8 text-gray-500">
              더 이상 표시할 항목이 없습니다.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ManagePage