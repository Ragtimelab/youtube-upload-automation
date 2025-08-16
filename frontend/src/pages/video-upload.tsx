import React, { useState } from 'react';
import { ArrowLeft, Upload, Youtube, FileVideo, Clock } from 'lucide-react';
import { Button } from '../shared/ui/button';
import { Card } from '../shared/ui/card';
import { ScriptSelector } from '../features/video-upload/script-selector';
import { VideoUpload } from '../features/video-upload/video-upload';
import { UploadProgress } from '../features/video-upload/upload-progress';
import { useToast } from '../shared/ui/use-toast';
import type { Script } from '../shared/types';

export const VideoUploadPage: React.FC = () => {
  const [selectedScript, setSelectedScript] = useState<Script | undefined>();
  const [currentStep, setCurrentStep] = useState<'select' | 'upload' | 'youtube'>('select');
  const { toast } = useToast();

  // 대본 선택 처리
  const handleScriptSelect = (script: Script) => {
    setSelectedScript(script);
    setCurrentStep('upload');
    toast({
      title: '대본 선택됨',
      description: `"${script.title}" 대본을 선택했습니다.`,
      variant: 'default'
    });
  };

  // 비디오 업로드 완료 처리
  const handleVideoUploadComplete = (scriptId: number) => {
    toast({
      title: '비디오 업로드 완료',
      description: '이제 YouTube에 업로드할 수 있습니다.',
      variant: 'default'
    });
    setCurrentStep('youtube');
  };

  // 단계 재설정
  const resetToSelectStep = () => {
    setSelectedScript(undefined);
    setCurrentStep('select');
  };

  // 업로드 프로세스 단계 표시
  const renderStepIndicator = () => {
    const steps = [
      { id: 'select', label: '대본 선택', icon: FileVideo },
      { id: 'upload', label: '비디오 업로드', icon: Upload },
      { id: 'youtube', label: 'YouTube 업로드', icon: Youtube }
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
          const StepIcon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200
                  ${isActive 
                    ? 'border-blue-500 bg-blue-500 text-white' 
                    : isCompleted 
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white dark:bg-gray-800 text-gray-400 dark:border-gray-600'
                  }
                `}>
                  <StepIcon className="h-5 w-5" />
                </div>
                <span className={`
                  mt-2 text-sm font-medium
                  ${isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : isCompleted 
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }
                `}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-16 h-0.5 mx-4 transition-all duration-200
                  ${isCompleted 
                    ? 'bg-green-500' 
                    : 'bg-gray-300 dark:bg-gray-600'
                  }
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            비디오 업로드
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            대본에 비디오를 연결하고 YouTube에 업로드하세요
          </p>
        </div>
      </div>

      {/* 단계 표시기 */}
      <div className="hidden sm:block">
        {renderStepIndicator()}
      </div>
      
      {/* 모바일 단계 표시기 */}
      <div className="sm:hidden mb-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">
              {currentStep === 'select' && '1/3 단계'}
              {currentStep === 'upload' && '2/3 단계'}
              {currentStep === 'youtube' && '3/3 단계'}
            </div>
            <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ 
                  width: currentStep === 'select' ? '33%' : 
                         currentStep === 'upload' ? '66%' : '100%' 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="space-y-6">
        {currentStep === 'select' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileVideo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    1단계: 대본 선택
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    비디오를 연결할 대본을 선택하세요
                  </p>
                </div>
              </div>
              <ScriptSelector
                selectedScript={selectedScript}
                onScriptSelect={handleScriptSelect}
              />
            </Card>

            {/* 도움말 카드 */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mt-0.5">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    업로드 준비 안내
                  </h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <p>• 업로드 가능한 대본은 "대본 준비완료" 상태인 항목입니다</p>
                    <p>• 선택한 대본의 제목과 설명이 YouTube 메타데이터로 사용됩니다</p>
                    <p>• 비디오 업로드 후 YouTube 업로드를 진행할 수 있습니다</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentStep === 'upload' && selectedScript && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    2단계: 비디오 업로드
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    대본에 연결할 비디오 파일을 업로드하세요
                  </p>
                </div>
              </div>
              
              <VideoUpload
                selectedScript={selectedScript}
                onUploadComplete={handleVideoUploadComplete}
              />
            </Card>

            {/* 대본 변경 버튼 */}
            <div className="flex justify-center">
              <Button variant="outline" onClick={resetToSelectStep}>
                다른 대본 선택
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'youtube' && selectedScript && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Youtube className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    3단계: YouTube 업로드
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    비디오를 YouTube에 업로드하고 설정을 구성하세요
                  </p>
                </div>
              </div>

              <UploadProgress
                scriptId={selectedScript.id}
                onUploadComplete={() => {
                  toast({
                    title: 'YouTube 업로드 완료',
                    description: '비디오가 성공적으로 YouTube에 업로드되었습니다!',
                    variant: 'default'
                  });
                }}
              />
            </Card>

            {/* 이전 단계로 돌아가기 */}
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                이전 단계
              </Button>
              <Button variant="outline" onClick={resetToSelectStep}>
                새로운 업로드 시작
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};