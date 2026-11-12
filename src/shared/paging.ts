import type { FeedFooterState } from '@/ui'

/** Ce que `FeedFooter` lit d'une `useInfiniteQuery`. */
export function feedFooterProps(query: {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  fetchNextPage: () => unknown
  data?: { pages: unknown[] }
}): { state: FeedFooterState; pages: number; onLoadMore: () => void; onRetry: () => void } {
  const state: FeedFooterState = query.isFetchNextPageError ? 'error' : query.isFetchingNextPage ? 'loading' : query.hasNextPage ? 'more' : 'end'
  const more = () => void query.fetchNextPage()
  return { state, pages: query.data?.pages.length ?? 0, onLoadMore: more, onRetry: more }
}
