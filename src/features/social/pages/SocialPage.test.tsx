// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { usePeople } from "@/features/follows"
import type { PlayerCard } from "@/features/player/domain/profile"
import { SocialPage } from "./SocialPage"

vi.mock("@/features/shell", () => ({
  PageContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  useMe: () => ({ data: { followingCount: 3, followersCount: 1 } }),
}))
vi.mock("@/features/follows", () => ({
  PersonTile: () => null,
  usePeople: vi.fn(),
}))
vi.mock("@/shared/hooks/use-device", () => ({
  useDevice: () => "desktop",
  useIsTouchLayout: () => false,
}))

function renderSocial(entry = "/social?tab=following") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <SocialPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function LocationProbe() {
  const location = useLocation()
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  )
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

function person(
  userId: string,
  overrides: Partial<PlayerCard> = {}
): PlayerCard {
  return {
    userId,
    pseudonym: userId,
    avatarOptions: null,
    rating: 200,
    provisional: true,
    following: false,
    presence: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(usePeople).mockImplementation(
    (direction) =>
      ({
        data: {
          content: direction === "following" ? [person("u1")] : [person("u2")],
          totalElements: 1,
        },
        isError: false,
        isLoading: false,
        refetch: vi.fn(),
      }) as never
  )
})

describe("SocialPage", () => {
  it("présente Abonnements et Abonnés comme filtres, sans onglets", () => {
    renderSocial()

    expect(screen.queryByRole("tab")).toBeNull()
    expect(
      screen.getByRole("button", { name: "Abonnements (3)" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Abonnés (1)" })
    ).toBeInTheDocument()
  })

  it("combine Abonnements et Abonnés en multi-sélection", async () => {
    renderSocial()

    const following = screen.getByRole("button", { name: "Abonnements (3)" })
    const followers = screen.getByRole("button", { name: "Abonnés (1)" })
    await userEvent.click(followers)

    expect(following).toHaveAttribute("aria-pressed", "true")
    expect(followers).toHaveAttribute("aria-pressed", "true")
    expect(
      vi
        .mocked(usePeople)
        .mock.calls.filter((call) => call[2] === true)
        .slice(-2)
        .map((call) => call[0])
    ).toEqual(["following", "followers"])
  })

  it("déduplique les joueurs présents dans les deux listes", async () => {
    vi.mocked(usePeople).mockImplementation(
      (direction) =>
        ({
          data: {
            content:
              direction === "following"
                ? [person("u1"), person("u2")]
                : [person("u2"), person("u3")],
            totalElements: 2,
          },
          isError: false,
          isLoading: false,
          refetch: vi.fn(),
        }) as never
    )

    renderSocial("/social?tab=following,followers")

    expect(screen.getByText("3 personnes")).toBeInTheDocument()
  })

  it("revient à Abonnements seul quand Abonnés est retiré", async () => {
    renderSocial("/social?tab=following,followers")

    await userEvent.click(screen.getByRole("button", { name: "Abonnés (1)" }))

    expect(
      screen.getByRole("button", { name: "Abonnements (3)" })
    ).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Abonnés (1)" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  it("redirige l'ancien onglet Défis vers /challenges en conservant les filtres", async () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={["/social?tab=challenges&type=received&challenge=c1"]}
        >
          <Routes>
            <Route path="/social" element={<SocialPage />} />
            <Route path="/challenges" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/challenges?type=received&challenge=c1"
    )
  })

  it("redirige l'ancien onglet Salons vers le filtre room", async () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/social?tab=rooms&sort=LATEST"]}>
          <Routes>
            <Route path="/social" element={<SocialPage />} />
            <Route path="/challenges" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/challenges?sort=LATEST&type=room"
    )
  })
})
