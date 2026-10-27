// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { queryKeys } from "@/lib/query-keys"
import { showSuccessToast } from "@/shared/utils/success-toast"
import type { ChallengeView } from "../domain/challenge"
import { challengesService } from "../lib/challenges"
import { useCreateChallenge } from "./useCreateChallenge"

const navigate = vi.fn()
let client: QueryClient

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}))
vi.mock("@/shared/utils/success-toast", () => ({
  showSuccessToast: vi.fn(),
}))
vi.mock("../lib/challenges", () => ({
  challengesService: { create: vi.fn(), mine: vi.fn() },
}))

function wrapper({ children }: { children: ReactNode }) {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const createdChallenge = { challengeId: "c1" } as ChallengeView

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  navigate.mockReset()
  vi.mocked(showSuccessToast).mockReset()
  vi.mocked(challengesService.create).mockResolvedValue({ id: "c1" })
  vi.mocked(challengesService.mine).mockResolvedValue([createdChallenge])
})

describe("useCreateChallenge", () => {
  it("attend que le défi créé apparaisse dans la liste avant de rendre la main", async () => {
    const { result } = renderHook(() => useCreateChallenge(), { wrapper })

    result.current.mutate({ topicId: "t1", opponentId: "u2" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(challengesService.mine).toHaveBeenCalled()
    expect(client.getQueryData(queryKeys.challenges.mine())).toEqual([
      createdChallenge,
    ])
    expect(showSuccessToast).toHaveBeenCalledTimes(1)
  })

  it("ouvre les défis envoyés au clic sur le toast", async () => {
    const { result } = renderHook(() => useCreateChallenge(), { wrapper })

    result.current.mutate({ topicId: "t1", opponentId: "u2" })

    await waitFor(() => expect(showSuccessToast).toHaveBeenCalledTimes(1))
    const options = vi.mocked(showSuccessToast).mock.calls[0][1]
    options?.onClick?.()

    expect(navigate).toHaveBeenCalledWith("/challenges?type=sent")
  })
})
