import React, { useState, useRef } from 'react';
import { Upload, FileVideo, AlertCircle, CheckCircle2, Play } from 'lucide-react';
import { Button } from '../../shared/ui/button';
import { Card } from '../../shared/ui/card';
import { Progress } from '../../shared/ui/progress';
import { useToast } from '../../shared/ui/use-toast';
import { useScripts } from '../../app/hooks/use-scripts';
import { uploadApi } from '../../entities/upload/api';
import type { Script } from '../../shared/types';

interface VideoUploadProps {
  selectedScript?: Script;
  onUploadComplete?: (scriptId: number) => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  selectedScript,
  onUploadComplete
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 파일 검증
  const validateFile = (file: File): string | null => {
    const maxSize = 8 * 1024 * 1024 * 1024; // 8GB
    const allowedTypes = ['video/mp4'];

    if (!allowedTypes.includes(file.type)) {
      return 'MP4 형식만 지원됩니다. (H.264 + AAC-LC 권장)';
    }

    if (file.size > maxSize) {
      return `파일 크기가 너무 큽니다. 최대 8GB까지 업로드 가능합니다. (현재: ${(file.size / 1024 / 1024 / 1024).toFixed(1)}GB)`;
    }

    return null;
  };

  // 파일 선택 처리
  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: '파일 검증 실패',
        description: error,
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);
    setUploadStatus('idle');
  };

  // 드래그 앤 드롭 핸들러
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // 파일 입력 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // 업로드 실행
  const handleUpload = async () => {
    if (!selectedScript || !selectedFile) {
      toast({
        title: '업로드 실패',
        description: '대본과 비디오 파일을 모두 선택해주세요.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // 비디오 파일 업로드
      const formData = new FormData();
      formData.append('video_file', selectedFile);

      // 실제 업로드 진행률 시뮬레이션 (실제 구현에서는 XMLHttpRequest progress 이벤트 사용)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 500);

      const uploadResult = await uploadApi.uploadVideo(selectedScript.id, selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');

      toast({
        title: '업로드 성공',
        description: `"${selectedScript.title}" 대본에 비디오가 연결되었습니다.`,
        variant: 'default'
      });

      // 업로드 완료 콜백 호출
      onUploadComplete?.(selectedScript.id);

      // 상태 초기화
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus('idle');
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      
      toast({
        title: '업로드 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* 대본 정보 카드 */}
      {selectedScript && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileVideo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">{selectedScript.title}</h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                상태: {selectedScript.status === 'script_ready' ? '대본 준비완료' : 
                       selectedScript.status === 'video_ready' ? '비디오 업로드완료' : 
                       selectedScript.status}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 파일 업로드 영역 */}
      <Card className="p-4 sm:p-6">
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-all duration-200
            ${dragActive 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${uploadStatus === 'success' ? 'border-green-400 bg-green-50 dark:bg-green-950/20' : ''}
            ${uploadStatus === 'error' ? 'border-red-400 bg-red-50 dark:bg-red-950/20' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />

          {uploadStatus === 'idle' && !selectedFile && (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Upload className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  비디오 파일을 선택하거나 드래그하세요
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  MP4 형식, 최대 8GB (H.264 + AAC-LC 권장)
                </p>
              </div>
              <Button variant="outline" size="sm">
                파일 선택
              </Button>
            </div>
          )}

          {selectedFile && uploadStatus === 'idle' && (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FileVideo className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleUpload} disabled={!selectedScript}>
                  <Upload className="h-4 w-4 mr-2" />
                  업로드 시작
                </Button>
                <Button variant="outline" onClick={() => setSelectedFile(null)}>
                  취소
                </Button>
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  업로드 중...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedFile?.name}
                </p>
              </div>
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {uploadProgress.toFixed(0)}% 완료
                </p>
              </div>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-green-900 dark:text-green-100">
                  업로드 완료!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  비디오가 대본에 성공적으로 연결되었습니다.
                </p>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-red-900 dark:text-red-100">
                  업로드 실패
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  다시 시도해주세요.
                </p>
              </div>
              <Button variant="outline" onClick={() => setUploadStatus('idle')}>
                다시 시도
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* YouTube 최적화 권장사항 */}
      <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mt-0.5">
            <Play className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              YouTube FHD 최적화 권장사항
            </h4>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <p>• 형식: MP4 (H.264 비디오 + AAC-LC 오디오)</p>
              <p>• 해상도: 1920×1080 (Full HD)</p>
              <p>• 비트레이트: 8Mbps@30fps, 오디오 128kbps</p>
              <p>• 최대 크기: 8GB (FHD 1시간 영상 기준)</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};