// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { Page } from "@/shared/types/api"
import type { TopicCard } from "../domain/topic"
import { topicsService } from "../lib/topics"
import { useTopicsList } from "./useTopics"

vi.mock("../lib/topics", () => ({
  topicsService: { list: vi.fn() },
}))

const topic: TopicCard = {
  topicId: "topic-1",
  names: { fr: "Star Wars" },
  description: null,
  category: "CINEMA",
  categoryLabel: "Cinéma",
  emoji: "🚀",
  color: null,
  imageUrl: null,
  bannerUrl: null,
  followersCount: 0,
  questionsCount: 7,
  followed: false,
  status: "PUBLISHED",
}

function page(number: number, last: boolean): Page<TopicCard> {
  return {
    content: [topic],
    page: number,
    size: 24,
    totalElements: last ? 25 : 48,
    totalPages: 2,
    first: number === 0,
    last,
  }
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("useTopicsList", () => {
  it("pagine par 24 et pousse les filtres actifs au service", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.mocked(topicsService.list).mockResolvedValue(page(0, false))

    const { result } = renderHook(
      () => useTopicsList({ q: "star", category: "CINEMA", sort: "ALPHA" }),
      { wrapper: createWrapper(queryClient) }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(topicsService.list).toHaveBeenCalledWith({
      q: "star",
      category: "CINEMA",
      sort: "ALPHA",
      page: 0,
      size: 24,
    })
  })

  it("charge la page suivante tant que le serveur ne marque pas la dernière", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.mocked(topicsService.list)
      .mockResolvedValueOnce(page(0, false))
      .mockResolvedValueOnce(page(1, true))

    const { result } = renderHook(() => useTopicsList({ sort: "POPULAR" }), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.hasNextPage).toBe(true)

    await result.current.fetchNextPage()

    await waitFor(() => {
      expect(topicsService.list).toHaveBeenLastCalledWith({
        sort: "POPULAR",
        page: 1,
        size: 24,
      })
    })
    expect(result.current.hasNextPage).toBe(false)
    expect(result.current.data?.pages.flatMap((p) => p.content).length).toBe(2)
  })
})
