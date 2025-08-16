import React, { useState, useEffect } from 'react';
import { 
  Youtube, 
  Upload, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Settings,
  Calendar,
  Eye,
  EyeOff,
  Globe
} from 'lucide-react';
import { Button } from '../../shared/ui/button';
import { Card } from '../../shared/ui/card';
import { Progress } from '../../shared/ui/progress';
import { Input } from '../../shared/ui/input';
import { Label } from '../../shared/ui/label';
import { useToast } from '../../shared/ui/use-toast';
import { uploadApi } from '../../entities/upload/api';
import type { UploadProgress as UploadProgressType } from '../../shared/types';

interface UploadProgressProps {
  scriptId: number;
  onUploadComplete?: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  scriptId,
  onUploadComplete
}) => {
  const [progress, setProgress] = useState<UploadProgressType | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // YouTube 업로드 설정
  const [uploadSettings, setUploadSettings] = useState({
    privacy_status: 'private' as 'private' | 'unlisted' | 'public',
    category_id: 22,
    scheduled_time: ''
  });

  const { toast } = useToast();

  // 진행률 폴링
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchProgress = async () => {
      try {
        const progressData = await uploadApi.getProgress(scriptId);
        setProgress(progressData);
        
        // 업로드 완료 시 폴링 중단
        if (progressData.status === 'uploaded' || progressData.status === 'scheduled') {
          clearInterval(interval);
          onUploadComplete?.();
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error);
        setError(error instanceof Error ? error.message : '진행률을 가져올 수 없습니다.');
      }
    };

    // 초기 로드
    fetchProgress();

    // 5초마다 진행률 업데이트
    interval = setInterval(fetchProgress, 5000);

    return () => clearInterval(interval);
  }, [scriptId, onUploadComplete]);

  // YouTube 업로드 시작
  const handleYouTubeUpload = async () => {
    if (!progress || progress.status !== 'video_ready') {
      toast({
        title: '업로드 불가',
        description: '비디오 파일이 준비되지 않았습니다.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('privacy_status', uploadSettings.privacy_status);
      formData.append('category_id', uploadSettings.category_id.toString());
      
      if (uploadSettings.scheduled_time) {
        formData.append('scheduled_time', uploadSettings.scheduled_time);
      }

      await uploadApi.uploadToYouTube(scriptId, formData);

      toast({
        title: 'YouTube 업로드 시작',
        description: '비디오가 YouTube에 업로드 중입니다.',
        variant: 'default'
      });

    } catch (error) {
      console.error('YouTube upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'YouTube 업로드에 실패했습니다.';
      setError(errorMessage);
      
      toast({
        title: 'YouTube 업로드 실패',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  // 공개 설정 아이콘
  const getPrivacyIcon = (status: string) => {
    switch (status) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'unlisted':
        return <EyeOff className="h-4 w-4" />;
      case 'private':
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  // 공개 설정 텍스트
  const getPrivacyText = (status: string) => {
    switch (status) {
      case 'public':
        return '공개';
      case 'unlisted':
        return '일부 공개';
      case 'private':
      default:
        return '비공개';
    }
  };

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/20">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          <div>
            <h3 className="font-medium text-red-900 dark:text-red-100">
              오류 발생
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">진행률을 로드하는 중...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 현재 상태 카드 */}
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`
                p-2 rounded-lg
                ${progress.status === 'uploaded' || progress.status === 'scheduled'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : progress.status === 'error'
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-blue-100 dark:bg-blue-900/30'
                }
              `}>
                {progress.status === 'uploaded' || progress.status === 'scheduled' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : progress.status === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                ) : (
                  <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {progress.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {progress.current_step}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {progress.progress_percentage}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {progress.total_steps}단계 중 {Math.ceil(progress.progress_percentage / 33)}단계
              </div>
            </div>
          </div>

          <Progress value={progress.progress_percentage} className="w-full" />

          {/* 파일 정보 */}
          {progress.video_file_info && (
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>파일: {progress.video_file_info.filename}</span>
              <span>크기: {progress.video_file_info.file_size_mb}MB</span>
            </div>
          )}

          {/* YouTube 정보 */}
          {progress.youtube_info && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Youtube className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="font-medium text-green-900 dark:text-green-100">
                  YouTube 업로드 완료
                </span>
              </div>
              <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                <p>비디오 ID: {progress.youtube_info.video_id}</p>
                <a 
                  href={progress.youtube_info.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  YouTube에서 보기
                </a>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* YouTube 업로드 설정 */}
      {progress.status === 'video_ready' && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Youtube className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    YouTube 업로드 설정
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    업로드 옵션을 설정하고 YouTube에 업로드하세요
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {showSettings ? '설정 닫기' : '고급 설정'}
              </Button>
            </div>

            {showSettings && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                {/* 공개 설정 */}
                <div className="space-y-2">
                  <Label>공개 설정</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { value: 'private', label: '비공개', description: '나만 볼 수 있음' },
                      { value: 'unlisted', label: '일부 공개', description: '링크가 있는 사용자만' },
                      { value: 'public', label: '공개', description: '모든 사용자' }
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={uploadSettings.privacy_status === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUploadSettings(prev => ({ ...prev, privacy_status: option.value as any }))}
                        className="flex flex-col h-auto p-3"
                      >
                        <div className="flex items-center gap-2">
                          {getPrivacyIcon(option.value)}
                          <span className="font-medium">{option.label}</span>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {option.description}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 카테고리 */}
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리</Label>
                  <select
                    id="category"
                    value={uploadSettings.category_id}
                    onChange={(e) => setUploadSettings(prev => ({ ...prev, category_id: parseInt(e.target.value) }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  >
                    <option value={22}>인물 및 블로그</option>
                    <option value={1}>영화 및 애니메이션</option>
                    <option value={2}>자동차</option>
                    <option value={10}>음악</option>
                    <option value={15}>애완동물</option>
                    <option value={17}>스포츠</option>
                    <option value={19}>여행 및 이벤트</option>
                    <option value={20}>게임</option>
                    <option value={23}>코미디</option>
                    <option value={24}>엔터테인먼트</option>
                    <option value={25}>뉴스 및 정치</option>
                    <option value={26}>노하우 및 스타일</option>
                    <option value={27}>교육</option>
                    <option value={28}>과학 기술</option>
                  </select>
                </div>

                {/* 예약 발행 */}
                <div className="space-y-2">
                  <Label htmlFor="scheduled">예약 발행 (선택사항)</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <Input
                      id="scheduled"
                      type="datetime-local"
                      value={uploadSettings.scheduled_time}
                      onChange={(e) => setUploadSettings(prev => ({ ...prev, scheduled_time: e.target.value }))}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    지정된 시간에 자동으로 공개됩니다 (예약 시 일단 비공개로 업로드)
                  </p>
                </div>
              </div>
            )}

            {/* 업로드 버튼 */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleYouTubeUpload}
                disabled={uploading}
                size="lg"
                className="w-full max-w-md"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    YouTube 업로드 중...
                  </>
                ) : (
                  <>
                    <Youtube className="h-4 w-4 mr-2" />
                    YouTube에 업로드
                    {uploadSettings.privacy_status && (
                      <span className="ml-2 text-sm">
                        ({getPrivacyText(uploadSettings.privacy_status)})
                      </span>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 업로드 완료 액션 */}
      {(progress.status === 'uploaded' || progress.status === 'scheduled') && progress.youtube_info && (
        <Card className="p-6 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                업로드 완료!
              </h3>
              <p className="text-green-600 dark:text-green-400">
                비디오가 성공적으로 YouTube에 업로드되었습니다.
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" asChild>
                <a
                  href={progress.youtube_info.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  YouTube에서 보기
                </a>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};