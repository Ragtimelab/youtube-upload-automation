import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">설정</h2>
        <p className="mt-1 text-sm text-gray-600">
          YouTube 업로드 자동화 시스템 설정을 관리하세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>YouTube API 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              클라이언트 ID
            </label>
            <Input
              type="text"
              placeholder="YouTube API 클라이언트 ID"
              defaultValue="your-client-id.googleusercontent.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              클라이언트 시크릿
            </label>
            <Input
              type="password"
              placeholder="YouTube API 클라이언트 시크릿"
              defaultValue="••••••••••••••••"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>기본 업로드 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기본 공개 설정
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="private">비공개</option>
              <option value="unlisted">목록에 없음</option>
              <option value="public">공개</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기본 카테고리
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="22">People & Blogs</option>
              <option value="27">Education</option>
              <option value="24">Entertainment</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>알림 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">업로드 완료 알림</div>
              <div className="text-sm text-gray-500">
                YouTube 업로드가 완료되면 알림을 받습니다.
              </div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
              defaultChecked
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">오류 발생 알림</div>
              <div className="text-sm text-gray-500">
                업로드 중 오류가 발생하면 알림을 받습니다.
              </div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
              defaultChecked
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>설정 저장</Button>
      </div>
    </div>
  )
}

export default SettingsPage