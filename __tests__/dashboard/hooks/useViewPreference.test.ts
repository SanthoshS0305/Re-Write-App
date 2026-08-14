import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useViewPreference } from '@/hooks/useViewPreference'

beforeEach(() => {
  localStorage.clear()
})

describe('useViewPreference', () => {
  it('defaults to grid when nothing is stored', () => {
    const { result } = renderHook(() => useViewPreference())
    expect(result.current.view).toBe('grid')
  })

  it('persists the chosen view to localStorage', () => {
    const { result } = renderHook(() => useViewPreference())

    act(() => result.current.setView('list'))

    expect(result.current.view).toBe('list')
    expect(localStorage.getItem('rewrite:dashboard-view')).toBe('list')
  })

  it('restores a previously stored preference on mount', () => {
    localStorage.setItem('rewrite:dashboard-view', 'list')

    const { result } = renderHook(() => useViewPreference())

    expect(result.current.view).toBe('list')
  })
})
