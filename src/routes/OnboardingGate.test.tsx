// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { OnboardingGate } from "./OnboardingGate"

const useMe = vi.hoisted(() => vi.fn())
const endSession = vi.hoisted(() => vi.fn())

vi.mock("@/features/shell", () => ({ useMe }))
vi.mock("@/features/auth", () => ({ endSession }))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/onboarding" element={<div>onboarding-route</div>} />
        <Route
          path="*"
          element={
            <OnboardingGate>
              <div>application</div>
            </OnboardingGate>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

function me(patch: Record<string, unknown> = {}) {
  return {
    data: {
      onboardingCompleted: false,
      stats: { played: 0 },
      ...patch,
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  }
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  useMe.mockReset()
  endSession.mockReset()
})

describe("OnboardingGate", () => {
  it("redirige un nouveau joueur vers la route d'onboarding en conservant la cible", () => {
    useMe.mockReturnValue(me())
    renderAt("/profile?tab=stats")

    expect(screen.getByText("onboarding-route")).toBeInTheDocument()
  })

  it("attend le refetch de me avant de rediriger après une partie", () => {
    useMe.mockReturnValue({ ...me(), isFetching: true })
    renderAt("/")

    expect(screen.queryByText("onboarding-route")).not.toBeInTheDocument()
    expect(screen.queryByText("application")).not.toBeInTheDocument()
  })

  it("permet d'invalider la session depuis l'écran d'erreur", () => {
    useMe.mockReturnValue({
      ...me(),
      data: undefined,
      isError: true,
      error: new Error("profile not found"),
    })
    renderAt("/")

    fireEvent.click(screen.getByRole("button", { name: "Se reconnecter" }))

    expect(endSession).toHaveBeenCalledWith("unknownUser")
  })

  it("laisse entrer directement dans une room, même sans onboarding", () => {
    useMe.mockReturnValue(me())
    renderAt("/join/room-1")

    expect(screen.getByText("application")).toBeInTheDocument()
    expect(screen.queryByText("onboarding-route")).not.toBeInTheDocument()
  })

  it("laisse entrer dans le jeu et son résultat", () => {
    useMe.mockReturnValue(me())
    const { unmount } = renderAt("/game/game-1")
    expect(screen.getByText("application")).toBeInTheDocument()
    unmount()

    renderAt("/game/game-1/result")
    expect(screen.getByText("application")).toBeInTheDocument()
  })

  it("ne redirige plus après le flag serveur ou une partie humaine", () => {
    useMe.mockReturnValue(me({ onboardingCompleted: true }))
    const { unmount } = renderAt("/")
    expect(screen.getByText("application")).toBeInTheDocument()
    unmount()

    useMe.mockReturnValue(me({ stats: { played: 1 } }))
    renderAt("/")
    expect(screen.getByText("application")).toBeInTheDocument()
  })
})
