import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export const ScriptUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    setUploading(true)
    // TODO: 실제 업로드 로직 구현
    setTimeout(() => {
      setUploading(false)
      setSelectedFile(null)
      alert('대본이 성공적으로 업로드되었습니다!')
    }, 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">대본 업로드</h2>
        <p className="mt-1 text-sm text-gray-600">
          새로운 대본 파일을 업로드하여 영상 제작을 시작하세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1단계: 대본 파일 선택</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <div className="space-y-4">
              <div className="text-4xl">📁</div>
              <div>
                <Input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="script-file"
                />
                <label
                  htmlFor="script-file"
                  className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                >
                  파일을 선택하거나 여기로 드래그하세요
                </label>
              </div>
              <div className="text-sm text-gray-500">
                지원 형식: .txt, .md
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900">
                    {selectedFile.name}
                  </div>
                  <div className="text-sm text-blue-700">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  제거
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedFile && (
        <Card>
          <CardHeader>
            <CardTitle>2단계: 대본 내용 확인</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-gray-500">
              파일을 선택하면 대본 내용을 미리 확인할 수 있습니다.
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-3">
        <Button variant="outline">
          취소
        </Button>
        <Button 
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? '업로드 중...' : '대본 등록'}
        </Button>
      </div>
    </div>
  )
}

export default ScriptUpload