import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('../services/firebase', () => ({ auth: { currentUser: { uid: 'test-uid' } }, db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn((q, cb) => { cb({ docs: [] }); return () => {} }),
  addDoc: vi.fn().mockResolvedValue({ id: 'new-id' }),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  doc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: { fromDate: vi.fn(d => d) },
}))

import { useGarden } from './useGarden'

test('starts with empty plants list', () => {
  const { result } = renderHook(() => useGarden('test-uid'))
  expect(result.current.plants).toEqual([])
})

test('addPlant calls addDoc', async () => {
  const { addDoc } = await import('firebase/firestore')
  const { result } = renderHook(() => useGarden('test-uid'))
  await act(async () => {
    await result.current.addPlant({ name: 'Домат', plantId: 1, watering_frequency_days: 2, fertilizing_frequency_days: 14 })
  })
  expect(addDoc).toHaveBeenCalled()
})
