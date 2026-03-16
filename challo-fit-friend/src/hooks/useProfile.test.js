import { renderHook } from '@testing-library/react'
import { useProfile } from './useProfile'

beforeEach(() => localStorage.clear())

describe('useProfile boot integrity', () => {
  it('clears stale activeId when referenced profile does not exist', () => {
    localStorage.setItem('cff_active_profile', 'ghost-id')
    localStorage.setItem('cff_profiles', JSON.stringify([]))
    const { result } = renderHook(() => useProfile())
    expect(result.current.activeProfile).toBeNull()
    expect(localStorage.getItem('cff_active_profile')).toBeNull()
  })

  it('keeps valid activeId when referenced profile exists', () => {
    const p = { id: 'abc', name: 'Test' }
    localStorage.setItem('cff_active_profile', 'abc')
    localStorage.setItem('cff_profiles', JSON.stringify([p]))
    const { result } = renderHook(() => useProfile())
    expect(result.current.activeProfile).toEqual(p)
  })
})
