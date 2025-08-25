import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // React 19 최적화된 번들 설정
  build: {
    // 번들 크기 최적화
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    
    // 청크 크기 경고 임계값 조정
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // 수동 청크 분할 - 라이브러리별 분리
        manualChunks: {
          // React 코어
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI 라이브러리
          'ui-vendor': [
            '@radix-ui/react-label',
            '@radix-ui/react-progress', 
            '@radix-ui/react-slot',
            'lucide-react',
            'class-variance-authority',
            'clsx',
            'tailwind-merge'
          ],
          
          // 데이터 관리
          'data-vendor': [
            '@tanstack/react-query',
            'zustand',
            'axios'
          ],
          
          // 폼 처리
          'form-vendor': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],
          
          // 차트 라이브러리 (큰 번들)
          'chart-vendor': ['recharts'],
          
          // 유틸리티
          'utils': [
            'src/utils/dateFormat.ts',
            'src/utils/classNames.ts',
            'src/utils/apiUtils.ts'
          ]
        },
        
        // 파일명 패턴 최적화
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? path.basename(chunkInfo.facadeModuleId, path.extname(chunkInfo.facadeModuleId))
            : 'chunk'
          return `js/${facadeModuleId}-[hash].js`
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/[name]-[hash].css'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    
    // 소스맵 설정
    sourcemap: false, // 프로덕션에서는 비활성화
  },
  
  // 개발 서버 최적화 - Phase 8 Enhanced
  server: {
    port: 5174,
    host: true,
    
    // HMR 최적화 - 상태 보존 개선
    hmr: {
      overlay: true,
      clientPort: 5174,
    },
    
    // 개발 속도 향상
    fs: {
      // 모니터링할 파일 패턴 최적화
      allow: ['..']
    },
    
    // 프록시 설정 (백엔드 연동)
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true
      }
    }
  },
  
  // 최적화 설정
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'axios'
    ],
    exclude: [
      // 개발 중에만 제외할 라이브러리
    ]
  },
  
  // CSS 최적화 - PostCSS + Tailwind 연동
  css: {
    devSourcemap: true,
    postcss: './postcss.config.js'
  },
  
  // 미리보기 설정
  preview: {
    port: 4173,
    host: true
  }
})
