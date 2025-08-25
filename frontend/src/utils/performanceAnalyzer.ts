import React, { Profiler } from 'react'

/**
 * Phase 11: Server Components + SSR 준비
 * PerformanceAnalyzer - 성능 모니터링 자동화 유틸리티
 * 
 * React 19 최적화된 성능 분석:
 * - Bundle Analyzer 자동화
 * - React DevTools Profiler API 활용
 * - 실시간 성능 메트릭 수집
 * - Next.js Server Components 준비
 */

interface PerformanceMetrics {
  componentName: string
  phase: 'mount' | 'update'
  actualDuration: number
  baseDuration: number
  startTime: number
  commitTime: number
  interactions: Set<unknown>
}

interface BundleAnalysisReport {
  totalSize: number
  gzippedSize: number
  chunks: Array<{
    name: string
    size: number
    gzippedSize: number
    modules: string[]
  }>
  duplicates: Array<{
    module: string
    locations: string[]
    wastedSize: number
  }>
  recommendations: string[]
}

interface RenderPerformanceReport {
  componentMetrics: PerformanceMetrics[]
  slowComponents: Array<{
    name: string
    averageDuration: number
    renderCount: number
  }>
  totalRenderTime: number
  recommendations: string[]
}

/**
 * 성능 분석 및 최적화 제안을 위한 핵심 클래스
 */
export class PerformanceAnalyzer {
  private static renderMetrics: Map<string, PerformanceMetrics[]> = new Map()
  private static isProfilingEnabled = import.meta.env.MODE === 'development'

  /**
   * Bundle Analyzer 자동 실행 및 보고서 생성
   */
  static async generateBundleReport(): Promise<BundleAnalysisReport> {
    if (typeof window === 'undefined') {
      // Server-side에서는 빌드 정보 분석
      return this.analyzeServerSideBundle()
    }

    // Client-side에서는 런타임 번들 분석
    return this.analyzeClientSideBundle()
  }

  private static async analyzeServerSideBundle(): Promise<BundleAnalysisReport> {
    // 빌드 시 생성된 manifest 정보를 기반으로 분석
    const chunks = [
      {
        name: 'main',
        size: 232890, // 예시 값 (실제로는 빌드 정보에서 가져옴)
        gzippedSize: 71240,
        modules: ['react', 'react-dom', 'main-components']
      },
      {
        name: 'vendor',
        size: 339190,
        gzippedSize: 100960,
        modules: ['@tanstack/react-query', 'lucide-react', 'zod']
      }
    ]

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
    const gzippedSize = chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0)

    return {
      totalSize,
      gzippedSize,
      chunks,
      duplicates: this.findDuplicateModules(chunks),
      recommendations: this.generateBundleRecommendations(chunks)
    }
  }

  private static async analyzeClientSideBundle(): Promise<BundleAnalysisReport> {
    // 런타임에서 로드된 모듈 정보 수집
    const performance = window.performance
    const resourceEntries = performance.getEntriesByType('resource')

    // JavaScript 리소스만 필터링
    const jsResources = resourceEntries.filter(entry => 
      entry.name.includes('.js') && !entry.name.includes('hot-update')
    )

    const chunks = jsResources.map(resource => ({
      name: this.extractChunkName(resource.name),
      size: (resource as PerformanceResourceTiming).transferSize || 0,
      gzippedSize: (resource as PerformanceResourceTiming).encodedBodySize || 0,
      modules: [] // 런타임에서는 정확한 모듈 정보 제한적
    }))

    return {
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      gzippedSize: chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0),
      chunks,
      duplicates: [],
      recommendations: this.generateRuntimeRecommendations(jsResources)
    }
  }

  private static findDuplicateModules(chunks: unknown[]): Array<{
    module: string
    locations: string[]
    wastedSize: number
  }> {
    const moduleMap = new Map<string, string[]>()
    
    chunks.forEach(chunk => {
      const chunkData = chunk as { name: string; modules: string[] }
      chunkData.modules.forEach((module: string) => {
        if (!moduleMap.has(module)) {
          moduleMap.set(module, [])
        }
        moduleMap.get(module)!.push(chunkData.name)
      })
    })

    const duplicates: Array<{
      module: string
      locations: string[]
      wastedSize: number
    }> = []

    moduleMap.forEach((locations, module) => {
      if (locations.length > 1) {
        duplicates.push({
          module,
          locations,
          wastedSize: this.estimateModuleSize(module) * (locations.length - 1)
        })
      }
    })

    return duplicates
  }

  private static generateBundleRecommendations(chunks: unknown[]): string[] {
    const recommendations: string[] = []
    const totalSize = chunks.reduce((sum: number, chunk) => sum + (chunk as { size: number }).size, 0)

    if (totalSize > 500000) { // 500KB 초과
      recommendations.push('번들 크기가 500KB를 초과합니다. 코드 분할을 고려하세요.')
    }

    const largeChunks = chunks.filter(chunk => (chunk as { size: number }).size > 100000) // 100KB 초과
    if (largeChunks.length > 0) {
      recommendations.push(`큰 청크를 발견했습니다: ${largeChunks.map(c => (c as { name: string }).name).join(', ')}`)
    }

    if (chunks.some(chunk => (chunk as { modules: string[] }).modules.includes('lodash'))) {
      recommendations.push('Lodash 전체 라이브러리가 포함되어 있습니다. 필요한 함수만 import하세요.')
    }

    return recommendations
  }

  private static generateRuntimeRecommendations(resources: unknown[]): string[] {
    const recommendations: string[] = []
    
    const slowResources = resources.filter(r => (r as { duration: number }).duration > 1000) // 1초 초과
    if (slowResources.length > 0) {
      recommendations.push('로딩이 느린 리소스가 있습니다. 네트워크 최적화를 고려하세요.')
    }

    return recommendations
  }

  /**
   * React DevTools Profiler API를 활용한 렌더 성능 측정
   */
  static measureRenderPerformance(): RenderPerformanceReport {
    if (!this.isProfilingEnabled) {
      return {
        componentMetrics: [],
        slowComponents: [],
        totalRenderTime: 0,
        recommendations: ['프로덕션 환경에서는 프로파일링이 비활성화됩니다.']
      }
    }

    const allMetrics: PerformanceMetrics[] = []
    this.renderMetrics.forEach(metrics => allMetrics.push(...metrics))

    const componentStats = new Map<string, {
      totalDuration: number
      renderCount: number
      durations: number[]
    }>()

    // 컴포넌트별 통계 집계
    allMetrics.forEach(metric => {
      if (!componentStats.has(metric.componentName)) {
        componentStats.set(metric.componentName, {
          totalDuration: 0,
          renderCount: 0,
          durations: []
        })
      }
      
      const stats = componentStats.get(metric.componentName)!
      stats.totalDuration += metric.actualDuration
      stats.renderCount += 1
      stats.durations.push(metric.actualDuration)
    })

    const slowComponents = Array.from(componentStats.entries())
      .map(([name, stats]) => ({
        name,
        averageDuration: stats.totalDuration / stats.renderCount,
        renderCount: stats.renderCount
      }))
      .filter(comp => comp.averageDuration > 16) // 16ms 초과 (60fps 기준)
      .sort((a, b) => b.averageDuration - a.averageDuration)

    const totalRenderTime = allMetrics.reduce((sum, metric) => sum + metric.actualDuration, 0)

    return {
      componentMetrics: allMetrics,
      slowComponents,
      totalRenderTime,
      recommendations: this.generateRenderRecommendations(slowComponents, totalRenderTime)
    }
  }

  private static generateRenderRecommendations(
    slowComponents: unknown[], 
    totalRenderTime: number
  ): string[] {
    const recommendations: string[] = []

    if (totalRenderTime > 100) {
      recommendations.push('전체 렌더링 시간이 100ms를 초과합니다. 성능 최적화가 필요합니다.')
    }

    if (slowComponents.length > 0) {
      recommendations.push(`느린 컴포넌트: ${slowComponents.slice(0, 3).map(c => (c as { name: string }).name).join(', ')}`)
      recommendations.push('React.memo, useMemo, useCallback을 활용한 최적화를 고려하세요.')
    }

    const highFrequencyComponents = slowComponents.filter(c => (c as { renderCount: number }).renderCount > 10)
    if (highFrequencyComponents.length > 0) {
      recommendations.push('자주 리렌더링되는 컴포넌트가 있습니다. 상태 구조를 재검토하세요.')
    }

    return recommendations
  }

  /**
   * React Profiler 콜백 함수
   */
  static createProfilerCallback(componentName: string) {
    return (
      id: string,
      phase: 'mount' | 'update',
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number,
      interactions: Set<unknown>
    ) => {
      if (!this.isProfilingEnabled) return

      const metric: PerformanceMetrics = {
        componentName: id || componentName,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
        interactions
      }

      if (!this.renderMetrics.has(componentName)) {
        this.renderMetrics.set(componentName, [])
      }
      
      this.renderMetrics.get(componentName)!.push(metric)

      // 심각한 성능 문제 즉시 경고
      if (actualDuration > 50) { // 50ms 초과
        console.warn(`🐌 느린 렌더링 감지: ${componentName} (${actualDuration.toFixed(2)}ms)`)
      }
    }
  }

  /**
   * 자동 성능 모니터링 시작
   */
  static startAutoMonitoring() {
    if (typeof window === 'undefined' || !this.isProfilingEnabled) return

    // 페이지 로드 성능 측정
    window.addEventListener('load', () => {
      this.measurePageLoadPerformance()
    })

    // 메모리 사용량 주기적 체크
    setInterval(() => {
      this.checkMemoryUsage()
    }, 30000) // 30초마다
  }

  private static measurePageLoadPerformance() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: this.getFirstPaint(),
      largestContentfulPaint: this.getLargestContentfulPaint()
    }

    console.log('📊 페이지 로드 성능:', metrics)
  }

  private static getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint?.startTime || 0
  }

  private static getLargestContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint')
    const lcp = paintEntries.find(entry => entry.name === 'largest-contentful-paint')
    return lcp?.startTime || 0
  }

  private static checkMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as Performance & { memory: { usedJSHeapSize: number, totalJSHeapSize: number, jsHeapSizeLimit: number } }).memory
      const memoryUsage = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      }

      if (memoryUsage.used / memoryUsage.limit > 0.8) {
        console.warn('⚠️ 메모리 사용량이 높습니다:', memoryUsage)
      }
    }
  }

  /**
   * 성능 보고서 내보내기
   */
  static async exportPerformanceReport(): Promise<string> {
    const bundleReport = await this.generateBundleReport()
    const renderReport = this.measureRenderPerformance()
    
    const report = {
      timestamp: new Date().toISOString(),
      bundle: bundleReport,
      rendering: renderReport,
      summary: {
        totalBundleSize: `${(bundleReport.totalSize / 1024).toFixed(1)}KB`,
        gzippedSize: `${(bundleReport.gzippedSize / 1024).toFixed(1)}KB`,
        slowComponentsCount: renderReport.slowComponents.length,
        totalRenderTime: `${renderReport.totalRenderTime.toFixed(2)}ms`
      }
    }

    return JSON.stringify(report, null, 2)
  }

  // 유틸리티 헬퍼 함수들
  private static extractChunkName(url: string): string {
    const parts = url.split('/')
    const filename = parts[parts.length - 1]
    return filename.replace(/\.[^.]+$/, '') // 확장자 제거
  }

  private static estimateModuleSize(moduleName: string): number {
    // 일반적인 모듈 크기 추정 (실제로는 더 정확한 데이터 필요)
    const sizeEstimates: Record<string, number> = {
      'react': 45000,
      'react-dom': 130000,
      'lodash': 70000,
      '@tanstack/react-query': 45000,
      'zod': 25000
    }
    
    return sizeEstimates[moduleName] || 10000 // 기본값 10KB
  }

  /**
   * 개발자를 위한 성능 디버깅 도구
   */
  static enableDebugMode() {
    if (typeof window !== 'undefined') {
      (window as unknown as Window & { __PERFORMANCE_ANALYZER__: unknown }).__PERFORMANCE_ANALYZER__ = {
        getBundleReport: () => this.generateBundleReport(),
        getRenderReport: () => this.measureRenderPerformance(),
        exportReport: () => this.exportPerformanceReport(),
        clearMetrics: () => this.renderMetrics.clear()
      }
      
      console.log('🛠️ Performance Analyzer Debug Mode 활성화됨')
      console.log('사용법: window.__PERFORMANCE_ANALYZER__')
    }
  }
}

/**
 * React Profiler 래퍼 컴포넌트
 * Server Components와 호환 가능하도록 설계
 */
interface ProfiledComponentProps {
  name: string
  children: React.ReactNode
  onRender?: (
    _id: string,
    _phase: 'mount' | 'update',
    _actualDuration: number
  ) => void
}

export function ProfiledComponent({ 
  name, 
  children, 
  onRender 
}: ProfiledComponentProps): React.ReactElement {
  const handleRender = onRender || PerformanceAnalyzer.createProfilerCallback(name)
  
  // Server-side에서는 Profiler 없이 children만 반환
  if (typeof window === 'undefined') {
    return React.createElement(React.Fragment, null, children)
  }

  return React.createElement(
    Profiler, 
    { id: name, onRender: handleRender as React.ProfilerOnRenderCallback },
    children
  )
}

// 개발 환경에서 자동 모니터링 시작
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  PerformanceAnalyzer.startAutoMonitoring()
  PerformanceAnalyzer.enableDebugMode()
}