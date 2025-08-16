import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../shared/ui/button';
import { Card } from '../../shared/ui/card';
import { Input } from '../../shared/ui/input';
import { useScripts } from '../../app/hooks/use-scripts';
import type { Script } from '../../shared/types';

interface ScriptSelectorProps {
  selectedScript?: Script;
  onScriptSelect: (script: Script) => void;
  className?: string;
}

export const ScriptSelector: React.FC<ScriptSelectorProps> = ({
  selectedScript,
  onScriptSelect,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { scripts, isLoading, error } = useScripts();

  // 검색 필터링
  const filteredScripts = scripts?.filter(script => {
    const query = searchQuery.toLowerCase();
    return (
      script.title.toLowerCase().includes(query) ||
      (script.description && script.description.toLowerCase().includes(query))
    );
  }) || [];

  // script_ready 상태인 스크립트만 필터링
  const availableScripts = filteredScripts.filter(script => script.status === 'script_ready');

  // 상태별 스크립트 분류
  const getScriptsByStatus = () => {
    const ready = filteredScripts.filter(s => s.status === 'script_ready');
    const videoReady = filteredScripts.filter(s => s.status === 'video_ready');
    const uploaded = filteredScripts.filter(s => s.status === 'uploaded' || s.status === 'scheduled');
    
    return { ready, videoReady, uploaded };
  };

  const { ready, videoReady, uploaded } = getScriptsByStatus();

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  // 스크립트 선택 핸들러
  const handleScriptSelect = (script: Script) => {
    onScriptSelect(script);
    setIsOpen(false);
    setSearchQuery('');
  };

  // 상태 표시 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'script_ready':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case 'video_ready':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'uploaded':
      case 'scheduled':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  // 상태 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'script_ready':
        return '대본 준비완료';
      case 'video_ready':
        return '비디오 업로드완료';
      case 'uploaded':
        return '유튜브 업로드완료';
      case 'scheduled':
        return '예약 업로드';
      case 'error':
        return '오류';
      default:
        return status;
    }
  };

  if (error) {
    return (
      <Card className={`p-4 border-red-200 bg-red-50 dark:bg-red-950/20 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>대본 목록을 불러올 수 없습니다.</span>
        </div>
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* 선택된 스크립트 표시 또는 선택 버튼 */}
      <Card 
        className={`
          p-4 cursor-pointer transition-all duration-200 hover:shadow-md
          ${selectedScript 
            ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20' 
            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
          }
        `}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-lg 
              ${selectedScript 
                ? 'bg-blue-100 dark:bg-blue-900/30' 
                : 'bg-gray-100 dark:bg-gray-800'
              }
            `}>
              <FileText className={`
                h-5 w-5 
                ${selectedScript 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
                }
              `} />
            </div>
            <div className="flex-1">
              {selectedScript ? (
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    {selectedScript.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedScript.status)}
                    <span className="text-sm text-blue-600 dark:text-blue-300">
                      {getStatusText(selectedScript.status)}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    대본 선택
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    비디오를 연결할 대본을 선택하세요
                  </p>
                </div>
              )}
            </div>
          </div>
          <ChevronDown className={`
            h-5 w-5 text-gray-400 transition-transform duration-200
            ${isOpen ? 'transform rotate-180' : ''}
          `} />
        </div>
      </Card>

      {/* 드롭다운 리스트 */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* 검색 입력 */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="대본 제목으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* 스크립트 목록 */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                로딩 중...
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {/* 업로드 가능한 스크립트 (script_ready) */}
                {ready.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      업로드 가능 ({ready.length})
                    </div>
                    {ready.map((script) => (
                      <div
                        key={script.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() => handleScriptSelect(script)}
                      >
                        <div className="flex-shrink-0">
                          {getStatusIcon(script.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {script.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            생성일: {new Date(script.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 비디오 업로드 완료 스크립트 (정보용) */}
                {videoReady.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-t border-gray-200 dark:border-gray-700 mt-2 pt-4">
                      비디오 업로드 완료 ({videoReady.length})
                    </div>
                    {videoReady.map((script) => (
                      <div
                        key={script.id}
                        className="flex items-center gap-3 p-3 rounded-lg opacity-60"
                      >
                        <div className="flex-shrink-0">
                          {getStatusIcon(script.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {script.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {getStatusText(script.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 업로드 완료 스크립트 (정보용) */}
                {uploaded.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-t border-gray-200 dark:border-gray-700 mt-2 pt-4">
                      업로드 완료 ({uploaded.length})
                    </div>
                    {uploaded.map((script) => (
                      <div
                        key={script.id}
                        className="flex items-center gap-3 p-3 rounded-lg opacity-60"
                      >
                        <div className="flex-shrink-0">
                          {getStatusIcon(script.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {script.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {getStatusText(script.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 결과 없음 */}
                {filteredScripts.length === 0 && (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? '검색 결과가 없습니다.' : '등록된 대본이 없습니다.'}
                  </div>
                )}

                {/* 업로드 가능한 스크립트가 없는 경우 */}
                {ready.length === 0 && filteredScripts.length > 0 && (
                  <div className="p-4 text-center">
                    <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      현재 업로드 가능한 대본이 없습니다.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      새로운 대본을 먼저 업로드해주세요.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};