import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Youtube, Upload, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

export function YouTubePage() {
  const navigate = useNavigate()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">YouTube 업로드</h1>
        <p className="text-gray-600 mt-1">완성된 콘텐츠를 YouTube에 자동으로 업로드하세요.</p>
      </div>

      {/* YouTube API 상태 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Youtube className="h-8 w-8 text-red-600" />
            <div>
              <h3 className="font-medium text-gray-900">YouTube API 상태</h3>
              <p className="text-sm text-gray-600">일일 할당량: 8,400 / 10,000 units</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">연결됨</span>
          </div>
        </div>
      </div>

      {/* 업로드 대기 목록 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">업로드 대기 목록</h3>
          <p className="text-gray-600 mt-1">비디오가 준비된 스크립트들을 YouTube에 업로드할 수 있습니다.</p>
        </div>

        <div className="p-6">
          <div className="text-center py-8">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">업로드 대기 중인 항목이 없습니다</h4>
            <p className="text-gray-600 mb-6">스크립트와 비디오를 먼저 준비해주세요.</p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/scripts')}>스크립트 관리</Button>
              <Button variant="outline" onClick={() => navigate('/upload')}>비디오 업로드</Button>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 업로드 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">최근 업로드</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {[
            { title: '시니어를 위한 스마트폰 활용법', status: 'completed', date: '2025-08-21' },
            { title: '건강한 노후 생활 가이드', status: 'processing', date: '2025-08-20' },
            { title: '디지털 금융 서비스 이용법', status: 'failed', date: '2025-08-19' },
          ].map((item, index) => (
            <div key={index} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {item.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  {item.status === 'processing' && <Clock className="h-5 w-5 text-yellow-600" />}
                  {item.status === 'failed' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.date}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  item.status === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : item.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.status === 'completed' ? '업로드 완료' 
                   : item.status === 'processing' ? '처리 중'
                   : '업로드 실패'}
                </span>
                <Button variant="ghost" size="sm">상세 보기</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}