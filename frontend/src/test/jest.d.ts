/**
 * Jest DOM 매처 타입 정의 확장 (Phase 8)
 * @testing-library/jest-dom 매처들을 TypeScript에서 사용할 수 있도록 설정
 */

import '@testing-library/jest-dom'

declare global {
  namespace _jest {
    interface _Matchers<R> {
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
      toHaveAccessibleDescription(_text?: string | RegExp): R
      toHaveAccessibleName(_text?: string | RegExp): R
      
      // 속성 및 스타일
      toHaveAttribute(_attr: string, _value?: string | RegExp): R
      toHaveClass(..._classNames: string[]): R
      toHaveStyle(_css: string | Record<string, string | number>): R
      
      // 콘텐츠
      toHaveTextContent(_text: string | RegExp): R
      toHaveDisplayValue(_value: string | RegExp | (string | RegExp)[]): R
      toHaveValue(_value: string | string[] | number): R
      toContainHTML(_htmlText: string): R
      
      // 요소 관계
      toContainElement(_element: HTMLElement | null): R
      toHaveErrorMessage(_text?: string | RegExp): R
      toHaveFocus(): R
      toHaveFormValues(_expectedValues: { [name: string]: string | number | boolean | null }): R
    }
  }
}

// jest-dom 전역 확장이 올바르게 로드되도록 보장
export {}