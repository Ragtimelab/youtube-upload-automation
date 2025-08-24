/**
 * Jest 매처 타입 정의 확장
 * @testing-library/jest-dom 매처들을 TypeScript에서 사용할 수 있도록 설정
 */

import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toBeVisible(): R
      toBeEmptyDOMElement(): R
      toBeDisabled(): R
      toBeEnabled(): R
      toBeInvalid(): R
      toBeRequired(): R
      toBeValid(): R
      toBeChecked(): R
      toBeFocused(): R
      toBePartiallyChecked(): R
      toHaveAccessibleDescription(text?: string | RegExp): R
      toHaveAccessibleName(text?: string | RegExp): R
      toHaveAttribute(attr: string, value?: string | RegExp): R
      toHaveClass(...classNames: string[]): R
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R
      toHaveFocus(): R
      toHaveFormValues(expectedValues: { [name: string]: any }): R
      toHaveStyle(css: string | Record<string, any>): R
      toHaveTextContent(text: string | RegExp): R
      toHaveValue(value: string | string[] | number): R
      toBeEmptyDOMElement(): R
      toContainElement(element: HTMLElement | null): R
      toContainHTML(htmlText: string): R
      toHaveErrorMessage(text?: string | RegExp): R
    }
  }
}