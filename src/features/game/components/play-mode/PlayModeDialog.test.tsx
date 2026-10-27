// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { Suggestion } from "@/features/shell/domain/suggestion"
import { PlayModeDialog } from "./PlayModeDialog"

/** Force le rendu **desktop** (modale centrée Radix) : jsdom n'a pas de vrai `matchMedia`. */
beforeAll(async () => {
  await i18n.changeLanguage("fr")
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: query.includes("min-width: 1024px"),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList
})

const playerSuggestion: Suggestion = {
  type: "PLAYER",
  id: "player-1",
  label: "Ada",
  subtitle: "Elo 200",
  category: null,
  emoji: null,
  color: null,
  imageUrl: null,
  avatarOptions: null,
  names: null,
}

function renderDialog(
  overrides: Partial<Parameters<typeof PlayModeDialog>[0]>
) {
  const props = {
    open: true,
    onClose: vi.fn(),
    onStartWorld: vi.fn(),
    onStartBot: vi.fn(),
    onStartPlayer: vi.fn(),
    onStartPrivate: vi.fn(),
    playerQuery: "",
    onPlayerQueryChange: vi.fn(),
    playerSource: "following" as const,
    onPlayerSourceChange: vi.fn(),
    playerResults: [playerSuggestion],
    playersLoading: false,
    ...overrides,
  }
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <PlayModeDialog {...props} />
    </QueryClientProvider>
  )
  return props
}

describe("PlayModeDialog", () => {
  it("bot : choix de la difficulté puis lancement immédiat", async () => {
    const user = userEvent.setup()
    const props = renderDialog({})

    // Étape 1 : sélection de l’adversaire.
    await screen.findByText("Qui veux-tu défier ?")

    await user.click(
      screen.getByRole("button", { name: /S'entraîner avec un robot/ })
    )
    await user.click(screen.getByRole("button", { name: "Suivant" }))

    // Étape 2 : difficulté, le bouton final devient « Lancer ».
    await screen.findByText("Quelle difficulté ?")
    await user.click(screen.getByRole("button", { name: /Difficile/ }))
    await user.click(screen.getByRole("button", { name: "Lancer" }))

    expect(props.onStartBot).toHaveBeenCalledWith("HARD")
    expect(props.onStartWorld).not.toHaveBeenCalled()
  })

  it("reste ouvert et affiche le lancement pendant une requête lente", async () => {
    renderDialog({ pending: true })

    await screen.findByText("Qui veux-tu défier ?")
    expect(screen.getByRole("button", { name: "Lancement…" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Annuler" })).toBeDisabled()
  })

  it("garde le bot disponible mais désactive le salon privé quand un salon est déjà ouvert", async () => {
    const user = userEvent.setup()
    const props = renderDialog({ roomAlreadyOpenOnTopic: true })

    await screen.findByText("Qui veux-tu défier ?")

    expect(
      screen.getByText(/Un salon privé est déjà ouvert sur ce sujet/)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /S'entraîner avec un robot/ })
    ).toBeEnabled()
    expect(
      screen.getByRole("button", { name: /Créer un salon/ })
    ).toBeDisabled()
    expect(
      screen.getByRole("button", { name: /Défier le monde/ })
    ).toBeEnabled()

    // Le bot reste un entraînement : la popup doit pouvoir le lancer malgré le salon privé.
    await user.click(
      screen.getByRole("button", { name: /S'entraîner avec un robot/ })
    )
    await user.click(screen.getByRole("button", { name: "Suivant" }))
    await user.click(screen.getByRole("button", { name: /Difficile/ }))
    await user.click(screen.getByRole("button", { name: "Lancer" }))
    expect(props.onStartBot).toHaveBeenCalledWith("HARD")
  })

  it("rend non sélectionnable un joueur déjà en défi sur le sujet", async () => {
    const user = userEvent.setup()
    renderDialog({ blockedOpponentIds: new Set(["player-1"]) })

    await screen.findByText("Qui veux-tu défier ?")
    await user.click(screen.getByRole("button", { name: /Défier un joueur/ }))
    await user.click(screen.getByRole("button", { name: "Suivant" }))
    await screen.findByText("Où chercher ton adversaire ?")
    await user.click(screen.getByRole("button", { name: "Suivant" }))
    await screen.findByText("Choisis un joueur")

    expect(
      screen.getByText("Défi déjà en attente sur ce sujet.")
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Ada/ })
    ).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lancer" })).toBeDisabled()
  })

  it("joueur : source de recherche puis sélection nominative", async () => {
    const user = userEvent.setup()
    const props = renderDialog({})

    await screen.findByText("Qui veux-tu défier ?")
    await user.click(screen.getByRole("button", { name: /Défier un joueur/ }))
    await user.click(screen.getByRole("button", { name: "Suivant" }))

    // Étape 2 : source (abonnements / abonnés / recherche universelle).
    await screen.findByText("Où chercher ton adversaire ?")
    await user.click(screen.getByRole("button", { name: /Mes abonnés/ }))
    expect(props.onPlayerSourceChange).toHaveBeenCalledWith("followers")
    await user.click(screen.getByRole("button", { name: "Suivant" }))

    // Étape 3 : sélection du joueur — « Lancer » exige un choix.
    await screen.findByText("Choisis un joueur")
    const launch = screen.getByRole("button", { name: "Lancer" })
    expect(launch).toBeDisabled()

    await user.click(screen.getByRole("button", { name: /Ada/ }))
    await user.click(screen.getByRole("button", { name: "Lancer" }))

    expect(props.onStartPlayer).toHaveBeenCalledWith("player-1")
    expect(props.onStartBot).not.toHaveBeenCalled()
  })

  it("retour : revient à l'étape précédente et réinitialise la sélection", async () => {
    const user = userEvent.setup()
    renderDialog({})

    await screen.findByText("Qui veux-tu défier ?")
    await user.click(screen.getByRole("button", { name: /Défier un joueur/ }))
    await user.click(screen.getByRole("button", { name: "Suivant" }))
    await screen.findByText("Où chercher ton adversaire ?")
    await user.click(screen.getByRole("button", { name: "Suivant" }))
    await screen.findByText("Choisis un joueur")

    await user.click(screen.getByRole("button", { name: "Précédent" }))
    expect(
      await screen.findByText("Où chercher ton adversaire ?")
    ).toBeInTheDocument()
  })
})
