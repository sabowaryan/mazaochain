import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock providers wrapper
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

export * from '@testing-library/react'
