import type { TFunction } from "i18next"
import type { PlayerCard } from "@/features/player/domain/profile"
import type { Suggestion } from "@/features/shell/domain/suggestion"

/** Source du sélecteur de joueur cible dans la popup de duel. */
export type PlayerSource = "following" | "followers" | "all"

/**
 * Filtre les suggestions pour le sélecteur de joueur cible : uniquement les joueurs
 * (jamais les sujets), sans soi-même, avec un libellé exploitable.
 */
export function playerSuggestions(
  suggestions: Suggestion[],
  selfUserId: string | null | undefined
): Suggestion[] {
  return suggestions.filter(
    (suggestion) =>
      suggestion.type === "PLAYER" &&
      suggestion.id !== selfUserId &&
      !suggestion.suspended &&
      Boolean(suggestion.label)
  )
}

/**
 * Convertit les cartes de personnes (abonnements / abonnés) renvoyées par le BFF
 * en suggestions pour le sélecteur de joueur cible, sans soi-même et avec un libellé.
 *
 * `t` est fourni par l'appelant (composant React) : le domaine reste pur, sans singleton i18n.
 */
export function playerCardsToSuggestions(
  cards: PlayerCard[],
  selfUserId: string | null | undefined,
  t: TFunction
): Suggestion[] {
  return cards
    .filter(
      (card) =>
        card.userId !== selfUserId &&
        !card.suspended &&
        Boolean(card.pseudonym)
    )
    .map((card) => ({
      type: "PLAYER",
      id: card.userId,
      label: card.pseudonym,
      subtitle: t("game.common.elo", { rating: card.rating ?? 200 }),
      category: null,
      emoji: null,
      color: null,
      imageUrl: null,
      avatarOptions: card.avatarOptions,
      names: null,
    }))
}
