/**
 * Phase 11: Server Components 준비
 * 서버 컴포넌트와 클라이언트 컴포넌트 분리
 * 
 * Next.js App Router 및 React Server Components 호환성을 위한 구조
 * - Server Components: 데이터 패칭, 정적 UI
 * - Client Components: 인터랙션, 상태 관리
 */

import { Suspense } from 'react'
import type { Script } from '@/types'
import { 
  FileText, 
  Calendar,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle 
} from 'lucide-react'

// ============================================================================
// Server Components (서버에서 실행되는 컴포넌트들)
// ============================================================================

/**
 * Scripts 페이지 서버 컴포넌트
 * - 서버에서 데이터를 미리 fetch
 * - HTML이 완성된 상태로 클라이언트에 전달
 */
export async function ScriptsServerPage() {
  // 서버에서 데이터 패칭 (실제로는 API 호출)
  const scripts = await getScriptsServerSide()
  
  return (
    <div className="space-y-6">
      <ScriptsPageHeader />
      
      {/* Suspense로 점진적 로딩 */}
      <Suspense fallback={<ScriptsListSkeleton />}>
        <ScriptsServerList scripts={scripts} />
      </Suspense>
      
      {/* 클라이언트 인터랙션은 별도 컴포넌트에서 */}
      <Suspense fallback={<div>인터랙션 로딩 중...</div>}>
        <ScriptsInteractionWrapper scripts={scripts} />
      </Suspense>
    </div>
  )
}

/**
 * 서버에서 스크립트 데이터 패칭
 * Next.js에서는 실제 API 호출이나 데이터베이스 쿼리
 */
async function getScriptsServerSide() {
  // 실제 구현에서는 데이터베이스나 API 호출
  // await fetch('http://localhost:8000/api/scripts')
  
  return [
    {
      id: 1,
      title: 'React 19 Server Components 가이드',
      description: 'Server Components의 작동 원리와 활용법',
      status: 'script_ready',
      created_at: '2025-08-25T10:00:00Z',
      updated_at: '2025-08-25T10:00:00Z',
      filename: '20250825_01_story.md',
      tags: ['react', 'server-components', 'next.js'],
      script_content: '# React 19 Server Components 가이드\n\n...'
    },
    {
      id: 2,
      title: 'TypeScript 5.8 고급 기능',
      description: '최신 TypeScript 기능 심화 학습',
      status: 'video_ready',
      created_at: '2025-08-25T11:00:00Z',
      updated_at: '2025-08-25T11:00:00Z',
      filename: '20250825_02_story.md',
      tags: ['typescript', 'advanced', 'types'],
      script_content: '# TypeScript 5.8 고급 기능\n\n...'
    }
  ]
}

/**
 * 페이지 헤더 - 서버 컴포넌트 (정적)
 */
function ScriptsPageHeader() {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">스크립트 관리</h1>
        <p className="text-gray-600 mt-1">
          Server Components 최적화된 스크립트 관리 시스템
        </p>
      </div>
    </div>
  )
}

/**
 * 스크립트 목록 서버 컴포넌트
 * - 서버에서 완성된 HTML 생성
 * - 초기 로딩 성능 최적화
 */
interface ScriptsServerListProps {
  scripts: Array<{
    id: number
    title: string
    description: string
    status: string
    created_at: string
    filename: string
    tags: string[]
  }>
}

function ScriptsServerList({ scripts }: ScriptsServerListProps) {
  if (!scripts.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">스크립트가 없습니다</h3>
        <p className="text-gray-600">서버에서 스크립트를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="divide-y divide-gray-200">
        {scripts.map((script) => (
          <ScriptServerItem key={script.id} script={script} />
        ))}
      </div>
    </div>
  )
}

/**
 * 스크립트 아이템 서버 컴포넌트
 * - 정적 데이터만 렌더링
 * - 인터랙션은 클라이언트 컴포넌트에서 처리
 */
function ScriptServerItem({ script }: { script: Script }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'script_ready': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'video_ready': return <CheckCircle2 className="h-4 w-4 text-blue-600" />
      case 'uploaded': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'scheduled': return <Clock className="h-4 w-4 text-purple-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'script_ready': return 'bg-yellow-100 text-yellow-800'
      case 'video_ready': return 'bg-blue-100 text-blue-800'
      case 'uploaded': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {script.title}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(script.status)}`}>
              {script.status}
            </span>
          </div>
          <p className="text-gray-600 mb-3 line-clamp-2">{script.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(script.created_at).toLocaleDateString('ko-KR')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>{script.filename}</span>
            </div>
            {script.tags && script.tags.length > 0 && (
              <div className="flex items-center space-x-1">
                <Tag className="h-4 w-4" />
                <span>{script.tags.slice(0, 3).join(', ')}</span>
                {script.tags.length > 3 && <span>...</span>}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {getStatusIcon(script.status)}
          {/* 버튼들은 클라이언트 컴포넌트에서 처리 */}
        </div>
      </div>
    </div>
  )
}

/**
 * 로딩 스켈레톤 - 서버 컴포넌트
 */
function ScriptsListSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="divide-y divide-gray-200">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-5 bg-gray-300 rounded w-48" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-3" />
                <div className="flex items-center space-x-4">
                  <div className="h-3 bg-gray-200 rounded w-20" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <div className="h-4 w-4 bg-gray-200 rounded" />
                <div className="h-6 bg-gray-200 rounded w-12" />
                <div className="h-6 bg-gray-200 rounded w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Client Components용 래퍼
// ============================================================================

/**
 * 클라이언트 인터랙션 래퍼
 * 실제 구현에서는 'use client' 지시문과 함께 별도 파일로 분리
 */
function ScriptsInteractionWrapper({ scripts: _scripts }: { scripts: unknown[] }) {
  // 이 컴포넌트는 실제로는 별도 파일로 분리되고 'use client' 사용
  return (
    <div className="space-y-4">
      {/* 검색, 필터링, 버튼 등 인터랙티브 요소들 */}
      {/* 실제 구현에서는 ScriptsClientInteractions로 분리 */}
    </div>
  )
}

// ============================================================================
// 업로드 페이지 서버 컴포넌트
// ============================================================================

/**
 * 업로드 페이지 서버 컴포넌트
 */
export async function UploadServerPage() {
  // 서버에서 필요한 초기 데이터 패칭
  const availableScripts = await getAvailableScriptsServerSide()
  const uploadSettings = await getUploadSettingsServerSide()
  
  return (
    <div className="space-y-6">
      <UploadPageHeader />
      
      <Suspense fallback={<UploadFormSkeleton />}>
        <UploadServerForm 
          scripts={availableScripts}
          settings={uploadSettings}
        />
      </Suspense>
    </div>
  )
}

/**
 * 업로드 페이지 헤더
 */
function UploadPageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">비디오 업로드</h1>
      <p className="text-gray-600 mt-1">
        Server Components로 최적화된 파일 업로드 시스템
      </p>
    </div>
  )
}

/**
 * 서버에서 사용 가능한 스크립트 조회
 */
async function getAvailableScriptsServerSide() {
  // 실제 구현에서는 데이터베이스 쿼리
  return [
    { id: 1, title: 'React 19 가이드', status: 'script_ready' },
    { id: 2, title: 'TypeScript 심화', status: 'script_ready' }
  ]
}

/**
 * 서버에서 업로드 설정 조회
 */
async function getUploadSettingsServerSide() {
  return {
    maxFileSize: '8GB',
    allowedTypes: ['.mp4', '.avi', '.mov', '.mkv', '.flv'],
    defaultPrivacy: 'private'
  }
}

/**
 * 업로드 폼 서버 컴포넌트 (정적 부분)
 */
interface UploadServerFormProps {
  scripts: { id: number; title: string; status: string; }[]
  settings: { 
    maxFileSize: string
    allowedTypes: string[]
    defaultPrivacy: string
  }
}

function UploadServerForm({ scripts, settings }: UploadServerFormProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="space-y-6">
        {/* 스크립트 선택 (정적 옵션들) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            스크립트 선택
          </label>
          <div className="text-sm text-gray-600 mb-3">
            사용 가능한 스크립트: {scripts.length}개
          </div>
        </div>

        {/* 파일 요구사항 정보 (서버에서 생성) */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">파일 업로드 요구사항</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 최대 파일 크기: {settings.maxFileSize}</li>
            <li>• 지원 형식: {settings.allowedTypes.join(', ')}</li>
            <li>• 기본 공개 설정: {settings.defaultPrivacy}</li>
          </ul>
        </div>

        {/* 실제 업로드 인터랙션은 클라이언트 컴포넌트에서 */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            파일 업로드 인터랙션은 클라이언트에서 로드됩니다...
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * 업로드 폼 스켈레톤
 */
function UploadFormSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-4 bg-gray-300 rounded w-24 mb-2" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
        <div className="h-32 bg-gray-200 rounded" />
        <div className="flex space-x-2">
          <div className="h-10 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Dashboard 서버 컴포넌트
// ============================================================================

/**
 * 대시보드 서버 컴포넌트
 */
export async function DashboardServerPage() {
  const systemStats = await getSystemStatsServerSide()
  const recentActivities = await getRecentActivitiesServerSide()
  
  return (
    <div className="space-y-6">
      <DashboardHeader />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemStats.map((stat, index) => (
          <Suspense key={index} fallback={<StatCardSkeleton />}>
            <StatCard stat={stat} />
          </Suspense>
        ))}
      </div>
      
      <Suspense fallback={<div>활동 로딩 중...</div>}>
        <RecentActivitiesList activities={recentActivities} />
      </Suspense>
    </div>
  )
}

function DashboardHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
      <p className="text-gray-600 mt-1">시스템 상태 및 활동 모니터링</p>
    </div>
  )
}

async function getSystemStatsServerSide() {
  // 서버에서 시스템 통계 수집
  return [
    { title: '전체 스크립트', value: '15', change: '+2', color: 'blue' },
    { title: '업로드 완료', value: '8', change: '+1', color: 'green' },
    { title: '처리 중', value: '3', change: '0', color: 'yellow' },
    { title: '오류', value: '1', change: '-1', color: 'red' }
  ]
}

async function getRecentActivitiesServerSide() {
  return [
    { id: 1, action: '스크립트 업로드', target: 'React 19 가이드', time: '2분 전' },
    { id: 2, action: '비디오 업로드', target: 'TypeScript 심화', time: '15분 전' },
    { id: 3, action: 'YouTube 업로드', target: '이전 영상', time: '1시간 전' }
  ]
}

interface StatCardProps {
  stat: {
    title: string
    value: string
    change: string
    color: string
  }
}

function StatCard({ stat }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{stat.title}</p>
          <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
        </div>
        <div className={`px-2 py-1 text-xs font-medium rounded ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
          {stat.change}
        </div>
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
          <div className="h-6 bg-gray-300 rounded w-8" />
        </div>
        <div className="h-5 bg-gray-200 rounded w-8" />
      </div>
    </div>
  )
}

interface RecentActivitiesListProps {
  activities: { id: number; action: string; target: string; time: string; }[]
}

function RecentActivitiesList({ activities }: RecentActivitiesListProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">최근 활동</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">{activity.action}</span>
                <span className="text-gray-600 ml-2">{activity.target}</span>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}