import { Navigate, useSearchParams } from "react-router-dom"
import { useUrlParams } from "@/shared/hooks/useUrlParam"
import { PeopleDirectory } from "../components/PeopleDirectory"
import { parsePeopleDirections } from "../domain/people-directory"
import type { PeopleDirection } from "@/features/player/domain/profile"

/**
 * Espace **Social** : annuaire des personnes (abonnements / abonnés). Les directions vivent
 * dans l'URL (`?tab=following,followers`) et se choisissent dans la barre de recherche — plus
 * d'onglets. Les anciens liens de l'onglet « Défis & Salons » sont redirigés vers la page
 * dédiée `/challenges` en conservant leurs filtres (`type`, `sort`, `q`, `challenge`).
 */
export function SocialPage() {
  const [searchParams] = useSearchParams()
  const updateParams = useUrlParams()
  const rawTab = searchParams.get("tab") ?? "following"

  if (rawTab === "challenges" || rawTab === "rooms") {
    const params = new URLSearchParams(searchParams)
    params.delete("tab")
    if (rawTab === "rooms" && !params.has("type")) params.set("type", "room")
    const query = params.toString()
    return (
      <Navigate to={query ? `/challenges?${query}` : "/challenges"} replace />
    )
  }

  const directions = parsePeopleDirections(rawTab)
  const setDirections = (next: PeopleDirection[]) =>
    updateParams((params) => {
      if (next.length === 1 && next[0] === "following") params.delete("tab")
      else params.set("tab", next.join(","))
    })

  return (
    <PeopleDirectory
      directions={directions}
      onDirectionsChange={setDirections}
    />
  )
}
