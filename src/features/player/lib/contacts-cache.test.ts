import type { PageResponse, PlayerCardView, PlayerProfileView } from '@joutio/client/api-types'
import { QueryClient, type InfiniteData } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { queryKeys } from '@/lib/query-keys'
import { applyFollow } from './contacts-cache'

const ME = 'me'
const card = (userId: string, pseudonym: string, rating = 1000): PlayerCardView => ({
  userId,
  pseudonym,
  avatarOptions: null,
  rating,
  following: true,
  presence: null,
  suspended: false,
})
const pages = (...content: PlayerCardView[][]): InfiniteData<PageResponse<PlayerCardView>> => ({
  pageParams: content.map((_page, index) => index),
  pages: content.map((items, index) => ({
    content: items,
    page: index,
    size: 2,
    totalElements: content.flat().length,
    totalPages: content.length,
    first: index === 0,
    last: index === content.length - 1,
  })),
})
const profile = (userId: string, pseudonym: string): PlayerProfileView =>
  ({ userId, pseudonym, avatarOptions: null, presence: null, suspended: false, progression: { rating: 1200 } }) as unknown as PlayerProfileView
const names = (data: InfiniteData<PageResponse<PlayerCardView>> | undefined) => data?.pages.flatMap((page) => page.content.map((item) => item.pseudonym))

describe('applyFollow', () => {
  it('inserts the followed player at his alphabetical place in my following lists, without refetching', () => {
    const client = new QueryClient()
    const key = queryKeys.contacts.list(ME, 'following', '', 'ALPHA')
    client.setQueryData(key, pages([card('a', 'Alice'), card('c', 'Chloé')]))

    applyFollow(client, ME, profile('b', 'Bruno'), true)

    expect(names(client.getQueryData(key))).toEqual(['Alice', 'Bruno', 'Chloé'])
    expect(client.getQueryData<InfiniteData<PageResponse<PlayerCardView>>>(key)?.pages[0]?.totalElements).toBe(3)
  })

  it('leaves the card to pagination when it sorts after the last loaded page', () => {
    const client = new QueryClient()
    const key = queryKeys.contacts.list(ME, 'following', '', 'ALPHA')
    const partial = pages([card('a', 'Alice'), card('b', 'Bruno')], [])
    partial.pages = partial.pages.slice(0, 1).map((page) => ({ ...page, last: false }))
    client.setQueryData(key, partial)

    applyFollow(client, ME, profile('z', 'Zoé'), true)

    expect(names(client.getQueryData(key))).toEqual(['Alice', 'Bruno'])
  })

  it('removes the unfollowed player and only flags him elsewhere', () => {
    const client = new QueryClient()
    const mine = queryKeys.contacts.list(ME, 'following', '', 'RECENT')
    const theirs = queryKeys.contacts.list('other', 'followers', '', 'RECENT')
    client.setQueryData(mine, pages([card('a', 'Alice'), card('b', 'Bruno')]))
    client.setQueryData(theirs, pages([card('b', 'Bruno')]))

    applyFollow(client, ME, profile('b', 'Bruno'), false)

    expect(names(client.getQueryData(mine))).toEqual(['Alice'])
    expect(client.getQueryData<InfiniteData<PageResponse<PlayerCardView>>>(theirs)?.pages[0]?.content[0]?.following).toBe(false)
  })

  it('skips my searches that do not match the pseudonym', () => {
    const client = new QueryClient()
    const key = queryKeys.contacts.list(ME, 'following', 'ali', 'RECENT')
    client.setQueryData(key, pages([card('a', 'Alice')]))

    applyFollow(client, ME, profile('b', 'Bruno'), true)

    expect(names(client.getQueryData(key))).toEqual(['Alice'])
  })
})
