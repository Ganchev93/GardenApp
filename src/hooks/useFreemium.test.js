import { vi } from 'vitest'

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'u1' },
    profile: { role: 'free', analysisCount: 5, analysisMonth: new Date().toISOString().slice(0, 7) }
  }))
}))

vi.mock('./useGarden', () => ({
  useGarden: vi.fn(() => ({ plants: [1, 2] }))
}))

import { useFreemium } from './useFreemium'
import { renderHook } from '@testing-library/react'

test('free user with 2 plants can add more (limit 3)', () => {
  const { result } = renderHook(() => useFreemium())
  expect(result.current.canAddPlant).toBe(true)
})

test('free user with 5 analyses used has 15 left', () => {
  const { result } = renderHook(() => useFreemium())
  expect(result.current.analysisRemaining).toBe(15)
})
