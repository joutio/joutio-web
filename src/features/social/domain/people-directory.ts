import type {
  PeopleDirection,
  PeopleSort,
  PlayerCard,
} from "@/features/player/domain/profile"

/** Directions disponibles dans l'annuaire Social, dans l'ordre d'affichage. */
export const PEOPLE_DIRECTIONS = [
  "following",
  "followers",
] as const satisfies readonly PeopleDirection[]

/**
 * Direction(s) sélectionnée(s) depuis `?tab=` : valeur simple (`following`, `followers`) ou
 * liste séparée par des virgules (`following,followers`). Une valeur absente ou invalide
 * retombe sur « Abonnements » (le filtre par défaut).
 */
export function parsePeopleDirections(raw: string): PeopleDirection[] {
  const requested = new Set(raw.split(",").map((value) => value.trim()))
  const selected = PEOPLE_DIRECTIONS.filter((direction) =>
    requested.has(direction)
  )
  return selected.length > 0 ? [...selected] : ["following"]
}

/**
 * Ajoute ou retire une direction. La dernière direction sélectionnée ne peut pas être retirée :
 * l'annuaire montre toujours au moins un périmètre.
 */
export function togglePeopleDirection(
  current: readonly PeopleDirection[],
  direction: PeopleDirection
): PeopleDirection[] {
  const selected = new Set(current)
  if (selected.has(direction)) {
    if (selected.size === 1) return [...current]
    selected.delete(direction)
  } else {
    selected.add(direction)
  }
  return PEOPLE_DIRECTIONS.filter((item) => selected.has(item))
}

/** Union dédupliquée, en conservant l'ordre des listes fournies. */
export function mergePeopleCards(lists: readonly PlayerCard[][]): PlayerCard[] {
  const seen = new Set<string>()
  const merged: PlayerCard[] = []
  for (const list of lists) {
    for (const person of list) {
      if (seen.has(person.userId)) continue
      seen.add(person.userId)
      merged.push(person)
    }
  }
  return merged
}

function pseudonymOf(person: PlayerCard): string {
  return person.pseudonym ?? ""
}

function comparePseudonyms(left: PlayerCard, right: PlayerCard): number {
  return pseudonymOf(left).localeCompare(pseudonymOf(right), undefined, {
    sensitivity: "base",
  })
}

/**
 * Tri de l'annuaire fusionné. `RECENT` conserve l'ordre fourni par les listes serveur
 * (Abonnements puis Abonnés) : `PlayerCardView` n'expose pas la date de suivi.
 */
export function sortPeopleCards(
  people: readonly PlayerCard[],
  sort: PeopleSort
): PlayerCard[] {
  if (sort === "RECENT") return [...people]
  const sorted = [...people]
  if (sort === "ELO") {
    sorted.sort(
      (left, right) =>
        (right.rating ?? 0) - (left.rating ?? 0) ||
        comparePseudonyms(left, right)
    )
  } else {
    sorted.sort(comparePseudonyms)
  }
  return sorted
}
