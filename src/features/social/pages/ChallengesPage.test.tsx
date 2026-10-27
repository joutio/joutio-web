// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { ChallengeView } from "@/features/challenges/domain/challenge"
import type { RoomView } from "@/features/rooms/domain/room"
import {
  useAcceptChallenge,
  useCancelChallenge,
  useDeclineChallenge,
  useMyChallenges,
} from "@/features/challenges"
import { useCancelRoom, useMyOpenRooms } from "@/features/rooms"
import { ChallengesPage } from "./ChallengesPage"

vi.mock("@/features/auth", () => ({ getSessionUserId: () => "me" }))
vi.mock("@/features/shell", () => ({
  PageContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  useTopicName: () => (names: Record<string, string>) => names.fr ?? "",
  useImmersiveNavigate: () => vi.fn(),
}))
vi.mock("@/shared/clock/useServerClock", () => ({
  useServerClock: () => ({
    serverNow: () => Date.now(),
    synced: true,
    resync: vi.fn(),
  }),
}))
vi.mock("@/features/notifications", () => ({
  useResolveChallenge: () => vi.fn(),
}))
// Barre de filtres en mode desktop : les puces de type sont rendues directement.
vi.mock("@/shared/hooks/use-device", () => ({
  useDevice: () => "desktop",
  useIsTouchLayout: () => false,
}))
vi.mock("@/features/challenges", () => ({
  useMyChallenges: vi.fn(),
  useAcceptChallenge: vi.fn(),
  useDeclineChallenge: vi.fn(),
  useCancelChallenge: vi.fn(),
}))
vi.mock("@/features/rooms", () => ({
  useMyOpenRooms: vi.fn(),
  useCancelRoom: vi.fn(),
}))

const TOPIC = {
  topicId: "t1",
  names: { fr: "Pokémon", en: "Pokémon" },
  category: null,
  emoji: null,
  color: null,
  imageUrl: null,
  titles: null,
}

/** Échéance à ~1 jour : au-delà de la fenêtre d'un `setTimeout` 32 bits, le countdown prévient. */
const FUTURE = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

function challenge(overrides: Partial<ChallengeView> = {}): ChallengeView {
  return {
    challengeId: "c1",
    topic: TOPIC,
    challenger: { userId: "u9", pseudonym: "Nadjim", avatarOptions: null },
    opponent: { userId: "me", pseudonym: "Moi", avatarOptions: null },
    status: "PENDING",
    roomId: null,
    gameId: null,
    createdAt: "2026-01-01T10:00:00Z",
    expiresAt: FUTURE,
    ...overrides,
  }
}

function room(overrides: Partial<RoomView> = {}): RoomView {
  return {
    roomId: "r1",
    topic: TOPIC,
    status: "WAITING_PLAYERS",
    vsBot: false,
    canCancel: true,
    opponent: { userId: "u9", pseudonym: "Nadjim", avatarOptions: null },
    initiatorPresent: true,
    participantPresent: false,
    gameId: null,
    createdAt: "2026-01-01T10:00:00Z",
    expiresAt: FUTURE,
    updatedAt: "2026-01-01T10:00:00Z",
    ...overrides,
  }
}

const accept = vi.fn().mockResolvedValue({ status: "accepted", roomId: null })
const decline = vi.fn().mockResolvedValue(undefined)

function renderPage(extra = "") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/challenges${extra}`]}>
        <ChallengesPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  accept.mockReset().mockResolvedValue({ status: "accepted", roomId: null })
  decline.mockReset().mockResolvedValue(undefined)
  vi.mocked(useMyChallenges).mockReturnValue({
    data: [challenge()],
    isLoading: false,
  } as never)
  vi.mocked(useMyOpenRooms).mockReturnValue({
    data: [room()],
    isLoading: false,
  } as never)
  vi.mocked(useAcceptChallenge).mockReturnValue({
    accept,
    pending: false,
  } as never)
  vi.mocked(useDeclineChallenge).mockReturnValue({
    decline,
    pending: false,
  } as never)
  vi.mocked(useCancelChallenge).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never)
  vi.mocked(useCancelRoom).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never)
})

describe("ChallengesPage", () => {
  it("affiche les invitations reçues, les défis envoyés et les salons ouverts", async () => {
    vi.mocked(useMyChallenges).mockReturnValue({
      data: [
        challenge(),
        challenge({
          challengeId: "c2",
          challenger: { userId: "me", pseudonym: "Moi", avatarOptions: null },
          opponent: { userId: "u9", pseudonym: "Nadjim", avatarOptions: null },
        }),
      ],
      isLoading: false,
    } as never)

    renderPage()

    // Invitations reçues : cartes dans un ScrollArea horizontal, mêmes actions inline.
    const received = screen.getByRole("region", { name: "Défis reçus (1)" })
    expect(received).toBeInTheDocument()
    expect(received.parentElement).toHaveAttribute(
      "data-orientation",
      "horizontal"
    )
    expect(screen.getByText("Défi reçu")).toBeInTheDocument()
    expect(screen.getByText("de Nadjim")).toBeInTheDocument()

    // Défis envoyés : rail horizontal, action unique (annuler) en rouge.
    const sent = screen.getByRole("region", { name: "Défis envoyés (1)" })
    expect(sent).toBeInTheDocument()
    expect(sent.parentElement).toHaveAttribute("data-orientation", "horizontal")
    expect(screen.getByText("Défi envoyé")).toBeInTheDocument()
    expect(screen.getByText("à Nadjim")).toBeInTheDocument()
    const cancel = within(sent).getByRole("button", { name: "Annuler" })
    expect(cancel).toHaveClass("text-destructive")

    // L'avatar du sujet ouvre la fiche du sujet, comme l'avatar joueur ouvre le profil.
    expect(
      within(received).getByRole("link", { name: "Voir le sujet Pokémon" })
    ).toHaveAttribute("href", "/topics/t1")

    // Les salons ouverts vivent sur la même page, dans leur propre rail horizontal.
    const rooms = screen.getByRole("region", { name: "Salons (1)" })
    expect(rooms.parentElement).toHaveAttribute(
      "data-orientation",
      "horizontal"
    )
    expect(screen.getByText("Salon ouvert")).toBeInTheDocument()

    // Carte reçue : le bouton « Accepter » tranche l'invitation.
    await userEvent.click(screen.getByRole("button", { name: "Accepter" }))
    expect(accept).toHaveBeenCalledWith("c1")
  })

  it("met en évidence la carte ciblée par ?challenge=", () => {
    renderPage("?type=received&challenge=c1")

    const card = screen
      .getByText("Défi reçu")
      .closest<HTMLElement>('[data-slot="card"]')
    expect(card).not.toBeNull()
    expect(card).toHaveAttribute("id", "challenge-c1")
    expect(card).toHaveAttribute("data-highlighted", "true")
    // Le ring a de la place dans le rail horizontal (padding) et le scrollIntoView garde
    // une marge autour de la carte ciblée.
    expect(card).toHaveClass("scroll-m-2")
    expect(card?.parentElement).toHaveClass("p-1.5")
  })

  it("filtre les cartes par type", async () => {
    renderPage()

    await userEvent.click(screen.getByRole("button", { name: "Salons" }))

    expect(screen.getByText("Salon ouvert")).toBeInTheDocument()
    expect(screen.queryByText("Défi reçu")).toBeNull()
    expect(screen.queryByText("Défi envoyé")).toBeNull()
  })

  it("combine plusieurs types de cartes", async () => {
    renderPage()

    await userEvent.click(screen.getByRole("button", { name: "Reçus" }))
    expect(screen.getByText("Défi reçu")).toBeInTheDocument()
    expect(screen.queryByText("Défi envoyé")).toBeNull()
    expect(screen.queryByText("Salon ouvert")).toBeNull()

    await userEvent.click(screen.getByRole("button", { name: "Salons" }))
    expect(screen.getByText("Défi reçu")).toBeInTheDocument()
    expect(screen.queryByText("Défi envoyé")).toBeNull()
    expect(screen.getByText("Salon ouvert")).toBeInTheDocument()
  })

  it("lit plusieurs types depuis l'URL", () => {
    vi.mocked(useMyChallenges).mockReturnValue({
      data: [
        challenge(),
        challenge({
          challengeId: "c2",
          challenger: { userId: "me", pseudonym: "Moi", avatarOptions: null },
          opponent: { userId: "u9", pseudonym: "Nadjim", avatarOptions: null },
        }),
      ],
      isLoading: false,
    } as never)

    renderPage("?type=received,sent")

    expect(screen.getByText("Défi reçu")).toBeInTheDocument()
    expect(screen.getByText("Défi envoyé")).toBeInTheDocument()
    expect(screen.queryByText("Salon ouvert")).toBeNull()
  })

  it("le refus part par le bouton destructif de la carte", async () => {
    renderPage()

    const refuse = screen.getByRole("button", { name: "Refuser" })
    expect(refuse).toHaveClass("text-destructive")
    await userEvent.click(refuse)
    expect(decline).toHaveBeenCalledWith("c1")
  })

  it("filtre les salons avec ?type=room", () => {
    renderPage("?type=room")

    expect(screen.getByText("Salon ouvert")).toBeInTheDocument()
    expect(screen.getByText("avec Nadjim")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Ouvrir la salle" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Fermer le salon" })
    ).toBeInTheDocument()
  })

  it("salle sans adversaire : affiche l'attente", () => {
    vi.mocked(useMyOpenRooms).mockReturnValue({
      data: [room({ opponent: null })],
      isLoading: false,
    } as never)

    renderPage("?type=room")

    expect(screen.getByText("Salon ouvert")).toBeInTheDocument()
    expect(screen.getByText("En attente d'un joueur")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Ouvrir la salle" })
    ).toBeInTheDocument()
  })

  it("sans rien en attente : un état vide commun", () => {
    vi.mocked(useMyChallenges).mockReturnValue({
      data: [],
      isLoading: false,
    } as never)
    vi.mocked(useMyOpenRooms).mockReturnValue({
      data: [],
      isLoading: false,
    } as never)

    renderPage()

    expect(
      screen.getByText("Aucun défi ni salon en attente")
    ).toBeInTheDocument()
    // La barre de recherche et ses filtres restent disponibles même sans données.
    expect(
      screen.getByPlaceholderText("Rechercher un sujet ou un joueur…")
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tous" })).toBeInTheDocument()
  })
})
