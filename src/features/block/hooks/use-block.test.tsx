import type { PlayerProfileView, UserRefView } from '@joutio/client/api-types'
import { queryKeys } from '@joutio/client/query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBlockPlayer } from './use-block'

const block = vi.fn()
vi.mock('../lib/block-service', () => ({ blockService: { block: (...args: unknown[]) => block(...args) } }))
vi.mock('@/lib/api', () => ({ api: {} }))
vi.mock('@/features/me', () => ({ useMe: () => ({ data: { userId: 'me' } }) }))
vi.mock('@/lib/i18n', () => ({ useT: () => (key: string) => key }))
vi.mock('@/shared/dialog', () => ({ showDialog: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/shared/toast', () => ({ toast }))

const player = { userId: 'u2', pseudonym: 'Léa' }
const profileKey = queryKeys.profiles.profile('u2')

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } })
  client.setQueryData(profileKey, { userId: 'u2', pseudonym: 'Léa', following: true, blocked: false } as PlayerProfileView)
  client.setQueryData<UserRefView[]>(queryKeys.blockedPlayers(), [{ userId: 'u2', pseudonym: 'Léa' } as UserRefView])
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  const { result } = renderHook(() => useBlockPlayer(player), { wrapper })
  return { client, result }
}

describe('useBlockPlayer', () => {
  beforeEach(() => {
    block.mockReset()
    toast.success.mockReset()
    toast.error.mockReset()
  })

  it('marks the profile blocked and unfollowed before the server answers', async () => {
    let resolve: () => void = () => {}
    block.mockReturnValue(new Promise<void>((done) => (resolve = done)))
    const { client, result } = setup()

    act(() => result.current.mutate(true))
    await waitFor(() => expect(client.getQueryData<PlayerProfileView>(profileKey)).toMatchObject({ blocked: true, following: false }))
    expect(block).toHaveBeenCalledWith('u2', true)

    await act(async () => resolve())
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('player.blockedToast'))
    // Aucune relecture après la commande : la fiche reste celle du cache optimiste.
    expect(client.getQueryState(profileKey)?.isInvalidated).toBe(false)
  })

  it('drops the row from the blocked list on unblock, and restores it when refused', async () => {
    let reject: (error: Error) => void = () => {}
    block.mockReturnValue(new Promise<void>((_done, fail) => (reject = fail)))
    const { client, result } = setup()

    act(() => result.current.mutate(false))
    await waitFor(() => expect(client.getQueryData<UserRefView[]>(queryKeys.blockedPlayers())).toEqual([]))

    await act(async () => reject(new Error('refused')))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('player.unblockError', 'home.errorText'))
    expect(client.getQueryData<UserRefView[]>(queryKeys.blockedPlayers())).toHaveLength(1)
  })
})
