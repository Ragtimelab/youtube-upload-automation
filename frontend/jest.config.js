/**
 * Jest 설정 - React 19 + TypeScript 최적화
 * Phase 7: 테스트 전략 및 품질 보증
 */

export default {
  // 테스트 환경
  testEnvironment: 'jsdom',
  
  // TypeScript 지원
  preset: 'ts-jest',
  
  // 모듈 경로 별칭 (올바른 속성명: moduleNameMapper)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub',
  },
  
  // 테스트 파일 패턴
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}'
  ],
  
  // 테스트 설정
  setupFilesAfterEnv: [
    '<rootDir>/src/test/setup.ts'
  ],
  
  // 변환 설정 - Phase 8 최신 설정
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        baseUrl: '.',
        paths: {
          '@/*': ['./src/*']
        },
        types: ['jest', '@testing-library/jest-dom', 'node']
      }
    }],
  },
  
  // 모듈 파일 확장자 (TypeScript 타입 정의 파일 포함)
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'd.ts'],
  
  // 커버리지 설정
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/test/**',
    '!src/**/__tests__/**',
  ],
  
  // 커버리지 임계값
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60, 
      lines: 60,
      statements: 60
    }
  },
  
  // 테스트 타임아웃
  testTimeout: 10000,
}