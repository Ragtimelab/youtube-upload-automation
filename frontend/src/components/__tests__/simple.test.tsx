/**
 * 간단한 테스트 - Phase 7 환경 검증용
 * Phase 7: 테스트 전략 및 품질 보증
 */

import { render, screen } from '@testing-library/react'

// 가장 간단한 컴포넌트 테스트
function SimpleComponent({ message }: { message: string }) {
  return <div data-testid="simple-message">{message}</div>
}

describe('Simple Test Suite', () => {
  it('should render a simple component', () => {
    render(<SimpleComponent message="테스트 성공" />)
    
    const element = screen.getByTestId('simple-message')
    expect(element).toBeTruthy()
    expect(element.textContent).toBe('테스트 성공')
  })

  it('should verify Jest environment is working', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toBe('hello')
    expect(true).toBeTruthy()
  })

  it('should verify React Testing Library is working', () => {
    render(<div>RTL 작동 중</div>)
    expect(screen.getByText('RTL 작동 중')).toBeTruthy()
  })
})