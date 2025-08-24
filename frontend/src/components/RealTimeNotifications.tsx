/**
 * 실시간 알림 시스템 (분할된 컴포넌트로 대체됨)
 * 494줄 → 98줄 완전 분할 달성
 * 
 * 새로운 경로: /src/components/notifications/RealTimeNotifications.tsx
 * 하위 호환성을 위한 Re-export
 */

export { default as RealTimeNotifications } from './notifications/RealTimeNotifications'
export { RealTimeNotifications as default } from './notifications/RealTimeNotifications'
export type { Notification } from './notifications/types'