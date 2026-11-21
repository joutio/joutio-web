import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ReportPlayerSheet } from './report-sheets'

vi.mock('../lib/result-service', () => ({ resultService: { reportPlayer: vi.fn().mockResolvedValue(undefined) } }))
vi.mock('@/lib/i18n', () => ({ useT: () => (key: string) => key, useLanguageStore: () => 'fr' }))
vi.mock('@/shared/toast', () => ({ toast: { error: vi.fn() } }))

async function sendReport(onBlock?: () => void) {
  const onClose = vi.fn()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ReportPlayerSheet open onClose={onClose} userId="u2" name="Léa" subtitle="" onBlock={onBlock} />
    </QueryClientProvider>,
  )
  await act(async () => fireEvent.click(screen.getByText('report.player.SPAM')))
  const send = screen.getByRole('button', { name: 'report.send' })
  await waitFor(() => expect(send).toHaveProperty('disabled', false))
  await act(async () => fireEvent.click(send))
  await waitFor(() => expect(screen.queryAllByText('report.sent').length).toBeGreaterThan(0))
  return onClose
}

describe('ReportPlayerSheet', () => {
  afterEach(cleanup)

  it('offers to block the player once the report is sent', async () => {
    const onBlock = vi.fn()
    const onClose = await sendReport(onBlock)
    expect(screen.getByText('report.thanksBlock')).toBeTruthy()

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'report.block' })))
    expect(onClose).toHaveBeenCalled()
    expect(onBlock).toHaveBeenCalled()
  })

  it('only offers to close when blocking is not available', async () => {
    await sendReport()
    expect(screen.getByText('report.playerThanks')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'report.block' })).toBeNull()
  })
})
