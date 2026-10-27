import type { PendingDuel } from "../domain/pending-duel"
import { PendingDuelCard } from "./PendingDuelCard"

/**
 * Rangée horizontale de cartes en attente (défis reçus/envoyés, salons) — une carte garde une
 * largeur lisible et les suivantes se découvrent au défilement latéral. `highlightedId` cible
 * la carte d'un défi reçu depuis un toast.
 */
export function PendingDuelList({
  items,
  highlightedId,
}: {
  items: PendingDuel[]
  highlightedId?: string | null
}) {
  return (
    // Le padding laisse respirer le ring de surbrillance (offset 2 px + épaisseur 2 px) :
    // sans lui, le premier élément est rogné par le bord du rail horizontal.
    <div className="flex w-max gap-2.5 p-1.5">
      {items.map((item) => (
        <PendingDuelCard
          key={`${item.kind}-${item.id}`}
          item={item}
          highlighted={item.kind === "received" && item.id === highlightedId}
          className="w-[min(88vw,22rem)] shrink-0 snap-start scroll-m-2"
        />
      ))}
    </div>
  )
}
