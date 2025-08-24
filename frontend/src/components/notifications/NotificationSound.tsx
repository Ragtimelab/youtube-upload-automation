/**
 * 알림 소리 재생을 담당하는 유틸리티 훅
 * Web Audio API를 사용한 타입별 알림 소리 시스템
 */

import { useCallback } from 'react'
import type { Notification } from './types'

interface UseNotificationSoundProps {
  enabled: boolean
}

export function useNotificationSound({ enabled }: UseNotificationSoundProps) {
  const playNotificationSound = useCallback((type: Notification['type']) => {
    if (!enabled) return
    
    // Web Audio API 사용하여 간단한 알림 소리 생성
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      const audioContext = new AudioContextClass()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // 타입별 다른 주파수
      const frequency = {
        success: 800,
        info: 600,
        upload: 500,
        warning: 400,
        error: 300,
      }[type]
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = 'sine'
      
      // 볼륨 설정 (에러는 더 크게)
      const volume = type === 'error' ? 0.3 : 0.1
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
      
    } catch (error) {
      console.warn('알림 소리 재생 실패:', error)
    }
  }, [enabled])

  return { playNotificationSound }
}