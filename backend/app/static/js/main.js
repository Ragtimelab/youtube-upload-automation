// YouTube 업로드 자동화 - 메인 JavaScript

// API 기본 설정
const API_BASE_URL = '/api';

// 유틸리티 함수들
const Utils = {
    // API 호출 헬퍼
    async apiCall(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, finalOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API 호출 실패 (${endpoint}):`, error);
            throw error;
        }
    },

    // 로딩 상태 표시
    showLoading(element) {
        const spinner = '<span class="loading me-2"></span>';
        element.innerHTML = spinner + element.textContent;
        element.disabled = true;
    },

    // 로딩 상태 제거
    hideLoading(element, originalText) {
        element.innerHTML = originalText;
        element.disabled = false;
    },

    // 알림 표시
    showAlert(message, type = 'info', container = null) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const targetContainer = container || document.querySelector('.container-fluid');
        if (targetContainer) {
            const alertDiv = document.createElement('div');
            alertDiv.innerHTML = alertHtml;
            targetContainer.insertBefore(alertDiv.firstElementChild, targetContainer.firstChild);
        }
    },

    // 날짜 포맷팅
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },

    // 파일 크기 포맷팅
    formatFileSize(bytes) {
        if (!bytes) return '-';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    },

    // 텍스트 자르기
    truncateText(text, maxLength = 50) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
};

// 상태 관리
const StatusManager = {
    // 연결 상태 확인
    async checkConnection() {
        try {
            const data = await Utils.apiCall('/health');
            this.updateConnectionStatus(true, data);
            return true;
        } catch (error) {
            this.updateConnectionStatus(false);
            return false;
        }
    },

    // 연결 상태 UI 업데이트
    updateConnectionStatus(isConnected, healthData = null) {
        const statusBadge = document.getElementById('status-badge');
        if (!statusBadge) return;

        if (isConnected) {
            statusBadge.className = 'badge bg-success';
            statusBadge.innerHTML = '<i class="fas fa-circle me-1"></i>연결됨';
            
            // 상세 상태 업데이트
            if (healthData && healthData.services) {
                const services = healthData.services;
                const apiStatus = document.getElementById('api-status');
                const dbStatus = document.getElementById('db-status');
                
                if (apiStatus) {
                    apiStatus.textContent = services.api === 'operational' ? '정상' : '오류';
                    apiStatus.className = `badge ${services.api === 'operational' ? 'bg-success' : 'bg-danger'}`;
                }
                
                if (dbStatus) {
                    dbStatus.textContent = services.database === 'connected' ? '연결됨' : '오류';
                    dbStatus.className = `badge ${services.database === 'connected' ? 'bg-success' : 'bg-danger'}`;
                }
            }
        } else {
            statusBadge.className = 'badge bg-danger';
            statusBadge.innerHTML = '<i class="fas fa-times-circle me-1"></i>연결 끊김';
        }
    },

    // 스크립트 통계 업데이트
    async updateScriptStats() {
        try {
            const data = await Utils.apiCall('/scripts/stats');
            if (data.success && data.data) {
                const stats = data.data;
                
                // 각 상태별 카운트 업데이트
                const elements = {
                    'ready-scripts': stats.script_ready || 0,
                    'video-ready': stats.video_ready || 0,
                    'uploaded-count': stats.uploaded || 0
                };
                
                Object.entries(elements).forEach(([id, value]) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = value;
                        element.classList.add('fade-in');
                    }
                });
            }
        } catch (error) {
            console.error('스크립트 통계 업데이트 실패:', error);
        }
    }
};

// 스크립트 관리
const ScriptManager = {
    // 스크립트 목록 로드
    async loadScripts(status = null, limit = 100) {
        try {
            let endpoint = `/scripts?limit=${limit}`;
            if (status) {
                endpoint += `&status=${status}`;
            }
            
            const data = await Utils.apiCall(endpoint);
            return data.success ? data.data : [];
        } catch (error) {
            console.error('스크립트 로드 실패:', error);
            Utils.showAlert('스크립트 목록을 불러오는데 실패했습니다.', 'danger');
            return [];
        }
    },

    // 스크립트 업로드
    async uploadScript(formData) {
        try {
            const response = await fetch(`${API_BASE_URL}/scripts/upload`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                Utils.showAlert('스크립트가 성공적으로 업로드되었습니다.', 'success');
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('스크립트 업로드 실패:', error);
            Utils.showAlert(`스크립트 업로드 실패: ${error.message}`, 'danger');
            throw error;
        }
    },

    // 스크립트 삭제
    async deleteScript(scriptId) {
        if (!confirm('정말로 이 스크립트를 삭제하시겠습니까?')) {
            return false;
        }

        try {
            const data = await Utils.apiCall(`/scripts/${scriptId}`, {
                method: 'DELETE'
            });
            
            if (data.success) {
                Utils.showAlert('스크립트가 삭제되었습니다.', 'success');
                return true;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('스크립트 삭제 실패:', error);
            Utils.showAlert(`스크립트 삭제 실패: ${error.message}`, 'danger');
            return false;
        }
    }
};

// 비디오 관리
const VideoManager = {
    // 비디오 업로드
    async uploadVideo(scriptId, formData) {
        try {
            const response = await fetch(`${API_BASE_URL}/upload/video/${scriptId}`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                Utils.showAlert('비디오가 성공적으로 업로드되었습니다.', 'success');
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('비디오 업로드 실패:', error);
            Utils.showAlert(`비디오 업로드 실패: ${error.message}`, 'danger');
            throw error;
        }
    },

    // 업로드 진행률 확인
    async getUploadProgress(scriptId) {
        try {
            const data = await Utils.apiCall(`/upload/progress/${scriptId}`);
            return data.success ? data.data : null;
        } catch (error) {
            console.error('진행률 확인 실패:', error);
            return null;
        }
    }
};

// YouTube 관리
const YouTubeManager = {
    // YouTube 업로드
    async uploadToYouTube(scriptId, options = {}) {
        try {
            const requestData = {
                privacy_status: options.privacy || 'private',
                category_id: options.category || 22
            };
            
            const data = await Utils.apiCall(`/upload/youtube/${scriptId}`, {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            if (data.success) {
                Utils.showAlert('YouTube 업로드가 시작되었습니다.', 'success');
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('YouTube 업로드 실패:', error);
            Utils.showAlert(`YouTube 업로드 실패: ${error.message}`, 'danger');
            throw error;
        }
    },

    // 배치 업로드
    async batchUploadToYouTube(scriptIds, options = {}) {
        try {
            const requestData = {
                script_ids: scriptIds,
                privacy_status: options.privacy || 'private',
                category_id: options.category || 22,
                delay_seconds: options.delay || 60
            };
            
            const data = await Utils.apiCall('/upload/youtube/batch', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            if (data.success) {
                Utils.showAlert(`${scriptIds.length}개 비디오의 배치 업로드가 시작되었습니다.`, 'success');
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('배치 업로드 실패:', error);
            Utils.showAlert(`배치 업로드 실패: ${error.message}`, 'danger');
            throw error;
        }
    }
};

// 전역 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 연결 상태 체크
    StatusManager.checkConnection();
    
    // 5분마다 연결 상태 확인
    setInterval(() => {
        StatusManager.checkConnection();
    }, 5 * 60 * 1000);
    
    // 30초마다 통계 업데이트 (대시보드에서만)
    if (document.getElementById('total-scripts')) {
        StatusManager.updateScriptStats();
        setInterval(() => {
            StatusManager.updateScriptStats();
        }, 30 * 1000);
    }
});

// 전역 함수들 (템플릿에서 호출용)
window.refreshStatus = function() {
    StatusManager.checkConnection();
    if (document.getElementById('total-scripts')) {
        StatusManager.updateScriptStats();
    }
};

window.ScriptManager = ScriptManager;
window.VideoManager = VideoManager;
window.YouTubeManager = YouTubeManager;
window.Utils = Utils;