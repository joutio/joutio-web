import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast, TOAST_DURATION_MS, TOAST_EXIT_MS, useToastStore, useToastSuppression } from './toast'
import { ToastHost } from './toast-host'

const titles = () => useToastStore.getState().toasts.filter((entry) => !entry.leaving).map((entry) => entry.title)

describe('toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToastStore.setState({ toasts: [], pending: [], suppressed: 0, expanded: false })
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('stacks the newest first and updates in place by id', () => {
    toast.info('A')
    toast.info('B', undefined, { id: 'b' })
    toast.info('C')
    toast.success('B2', undefined, { id: 'b' })
    expect(titles()).toEqual(['C', 'B2', 'A'])
  })

  it('shows at most three toasts', () => {
    render(<ToastHost />)
    act(() => ['1', '2', '3', '4'].forEach((title) => toast.info(title)))
    expect(screen.queryByText('1')).toBeNull()
    expect(screen.getByText('4')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
  })

  it('closes after 4 s, unless the stack is expanded', () => {
    render(<ToastHost />)
    act(() => {
      toast.info('A')
      toast.info('B')
    })
    // Pile repliée : le toucher la déplie au lieu de fermer.
    act(() => {
      fireEvent.click(screen.getByText('B'))
    })
    expect(useToastStore.getState().expanded).toBe(true)
    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS - 100)
    })
    expect(titles()).toEqual(['B', 'A'])
    // Repliée seule après 4 s sans geste, puis la minuterie repart.
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(useToastStore.getState().expanded).toBe(false)
    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS + TOAST_EXIT_MS)
    })
    expect(useToastStore.getState().toasts).toEqual([])
  })

  it('runs the action of a touchable toast, then closes it', () => {
    const onClick = vi.fn()
    render(<ToastHost />)
    act(() => void toast.show({ title: 'Lena te défie', onClick }))
    act(() => {
      fireEvent.click(screen.getByText('Lena te défie'))
    })
    expect(onClick).toHaveBeenCalledOnce()
    expect(titles()).toEqual([])
  })

  it('holds messages during an immersive screen and shows them afterwards', () => {
    toast.info('Avant')
    const { unmount } = renderHook(() => useToastSuppression())
    expect(titles()).toEqual([])
    toast.info('Pendant')
    expect(titles()).toEqual([])
    unmount()
    expect(titles()).toEqual(['Pendant'])
  })
})
