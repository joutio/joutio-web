// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { TIER_COLORS } from "@/features/progression/domain/progression"
import type { TopicCard } from "@/features/topics/domain/topic"
import { TopicTitlesTab } from "./TopicTitlesTab"

vi.mock("@/features/shell", () => ({
  useMe: () => ({ data: { userId: "user-1" } }),
  PageContainer: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
}))

const topic: TopicCard = {
  topicId: "t1",
  names: { fr: "Histoire" },
  description: null,
  category: null,
  categoryLabel: null,
  emoji: null,
  color: null,
  imageUrl: null,
  bannerUrl: null,
  followersCount: 0,
  questionsCount: 20,
  followed: false,
  status: "PUBLISHED",
}

/** Paliers atteints : Fer → Argent (2 000 XP) ; le titre porté est « Argent ». */
const progress = {
  xp: 2000,
  games: 1,
  tier: "ARGENT",
  tierProgressPercent: 20,
  tierRemainingXp: 2000,
  nextTier: "OR",
}

/** Carte dépliable qui contient le déclencheur (le panneau est rendu même replié). */
function cardOf(trigger: HTMLElement): HTMLElement {
  const card = trigger.closest("article")
  if (!card) throw new Error("carte de titre introuvable")
  return card
}

function renderTab(overrides: Partial<typeof progress> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TopicTitlesTab
        topic={topic}
        titles={null}
        progress={{ ...progress, ...overrides }}
        equippedKey="t1:ARGENT"
      />
    </QueryClientProvider>
  )
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("TopicTitlesTab", () => {
  it("ne porte que le titre sur la carte repliée (aucune XP, aucun état)", () => {
    renderTab()

    // Le nom accessible du déclencheur vaut le seul titre : la description repliée a disparu.
    expect(
      screen.getByRole("button", { name: "Argent · Histoire" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Platine · Histoire" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /XP/ })).toBeNull()
  })

  it("marque les paliers atteints d'une coche (cadenas sinon)", () => {
    renderTab()

    expect(
      screen
        .getByRole("button", { name: "Argent · Histoire" })
        .querySelector(".lucide-check")
    ).not.toBeNull()
    expect(
      screen
        .getByRole("button", { name: "Platine · Histoire" })
        .querySelector(".lucide-lock")
    ).not.toBeNull()
  })

  it("réserve l'XP aux paliers verrouillés dans le panneau déplié", () => {
    renderTab()

    // Le palier courant est atteint : aucune barre ni condition d'XP sur sa carte.
    expect(screen.queryByText(/XP avant Or/)).toBeNull()
    // Paliers verrouillés : seuil et restant, dans leur propre carte.
    expect(screen.getAllByText(/Plus que/)).toHaveLength(4)
    // Progression chiffrée + pourcentage, comme la fiche d'un badge.
    expect(screen.getAllByText(/2\s?000\s*\/\s*4\s?000\s*XP/)).toHaveLength(1)
    expect(screen.getAllByText("50 %")).toHaveLength(1)
    expect(screen.getByText(/2\s?000\s*\/\s*9\s?000\s*XP/)).toBeInTheDocument()
    // Fond de barre contrasté sur la carte dépliée (teintée) : 20 % de foreground.
    expect(document.querySelector('[class*="bg-foreground/20"]')).not.toBeNull()
  })

  it("n'affiche ni barre ni condition sur un palier débloqué", () => {
    renderTab()

    for (const label of ["Fer · Histoire", "Bronze · Histoire", "Argent · Histoire"]) {
      const card = within(cardOf(screen.getByRole("button", { name: label })))
      expect(card.queryByText(/XP/)).toBeNull()
      expect(card.queryByText(/Plus que/)).toBeNull()
      expect(card.queryByText(/XP avant/)).toBeNull()
      expect(card.queryByText(/%/)).toBeNull()
    }

    // La carte du palier courant reste lisible : état et action, sans progression d'XP.
    expect(
      within(
        cardOf(screen.getByRole("button", { name: "Argent · Histoire" }))
      ).getByText("Affiché")
    ).toBeInTheDocument()
  })

  it("nomme l'action « Utiliser ce titre »", () => {
    renderTab()

    expect(
      screen.getAllByRole("button", { name: "Utiliser ce titre" })
    ).toHaveLength(2)
  })

  it("indique la rareté du titre dans le panneau déplié, teintée par son rang", () => {
    renderTab()

    expect(screen.getAllByText(/Rareté :/)).toHaveLength(7)

    const fer = within(
      cardOf(screen.getByRole("button", { name: "Fer · Histoire" }))
    ).getByText("Rareté : Fer")
    expect(fer.style.color).toBe(TIER_COLORS.FER.text)

    const diamant = within(
      cardOf(screen.getByRole("button", { name: "Diamant · Histoire" }))
    ).getByText("Rareté : Diamant")
    expect(diamant.style.color).toBe(TIER_COLORS.DIAMANT.text)
  })

  it("distingue l'état porté de l'état acquis", () => {
    renderTab()

    expect(screen.getByText("Affiché")).toBeInTheDocument()
    expect(screen.getAllByText("Débloqué")).toHaveLength(2)
  })

  it("sans partie humaine : toute l'échelle est verrouillée et Fer annonce sa condition", () => {
    renderTab({
      xp: 120,
      games: 0,
      tier: "FER",
      tierProgressPercent: 0,
      tierRemainingXp: 500,
      nextTier: "BRONZE",
    })

    const fer = screen.getByRole("button", { name: "Fer · Histoire" })
    expect(fer.querySelector(".lucide-lock")).not.toBeNull()

    fireEvent.click(fer)
    expect(
      within(cardOf(fer)).getByText(
        "Joue une première partie contre un humain pour le débloquer"
      )
    ).toBeInTheDocument()

    for (const tier of [
      "Bronze · Histoire",
      "Argent · Histoire",
      "Or · Histoire",
      "Platine · Histoire",
      "Émeraude · Histoire",
      "Diamant · Histoire",
    ]) {
      expect(
        screen
          .getByRole("button", { name: tier })
          .querySelector(".lucide-lock")
      ).not.toBeNull()
    }

    // Les autres titres affichent directement leur seuil d'XP, sans répéter la condition Fer.
    expect(
      within(
        cardOf(screen.getByRole("button", { name: "Bronze · Histoire" }))
      ).getByText("Plus que 380 XP")
    ).toBeInTheDocument()
    expect(screen.queryByText(/Débloque d'abord le titre Fer/)).toBeNull()
  })

  it("après une partie humaine à 0 XP : Fer est acquis et affiche sa propre condition", () => {
    renderTab({
      xp: 0,
      games: 1,
      tier: "FER",
      tierProgressPercent: 0,
      tierRemainingXp: 500,
      nextTier: "BRONZE",
    })

    const fer = screen.getByRole("button", { name: "Fer · Histoire" })
    expect(fer.querySelector(".lucide-check")).not.toBeNull()
    expect(
      screen.getByText("Débloqué par ta première partie contre un humain")
    ).toBeInTheDocument()
    // La condition Fer n'est plus « XP avant Bronze » (celle du palier suivant).
    expect(screen.queryByText(/XP avant Bronze/)).toBeNull()
    // Fer ne porte aucune barre ni compteur d'XP : il se débloque par une partie humaine.
    expect(within(cardOf(fer)).queryByText(/XP/)).toBeNull()
    expect(within(cardOf(fer)).queryByText("0 %")).toBeNull()
    // Bronze, lui, affiche bien son seuil d'XP.
    const bronze = screen.getByRole("button", { name: "Bronze · Histoire" })
    expect(
      within(cardOf(bronze)).getByText("Plus que 500 XP")
    ).toBeInTheDocument()
    expect(bronze.querySelector(".lucide-lock")).not.toBeNull()
  })
})
