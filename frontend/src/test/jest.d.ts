/**
 * Jest DOM 매처 타입 정의 확장 (Phase 8)
 * @testing-library/jest-dom 매처들을 TypeScript에서 사용할 수 있도록 설정
 */

import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      // DOM 존재 및 가시성
      toBeInTheDocument(): R
      toBeVisible(): R
      toBeEmptyDOMElement(): R
      
      // Form 요소 상태
      toBeDisabled(): R
      toBeEnabled(): R
      toBeInvalid(): R
      toBeRequired(): R
      toBeValid(): R
      toBeChecked(): R
      toBeFocused(): R
      toBePartiallyChecked(): R
      
      // 접근성
      toHaveAccessibleDescription(text?: string | RegExp): R
      toHaveAccessibleName(text?: string | RegExp): R
      
      // 속성 및 스타일
      toHaveAttribute(attr: string, value?: string | RegExp): R
      toHaveClass(...classNames: string[]): R
      toHaveStyle(css: string | Record<string, any>): R
      
      // 콘텐츠
      toHaveTextContent(text: string | RegExp): R
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R
      toHaveValue(value: string | string[] | number): R
      toContainHTML(htmlText: string): R
      
      // 요소 관계
      toContainElement(element: HTMLElement | null): R
      toHaveErrorMessage(text?: string | RegExp): R
      toHaveFocus(): R
      toHaveFormValues(expectedValues: { [name: string]: any }): R
    }
  }
}

// jest-dom 전역 확장이 올바르게 로드되도록 보장
export {}