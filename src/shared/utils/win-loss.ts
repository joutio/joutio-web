export interface WinLoss {
  wins: number
  draws: number
  losses: number
}

export interface WinLossSegment {
  key: "wins" | "draws" | "losses"
  label: string
  value: number
  percent: number
  barClassName: string
  textClassName: string
}

const LABELS: Record<WinLossSegment["key"], string> = {
  wins: "Victoires",
  draws: "Nuls",
  losses: "Défaites",
}

const BAR_CLASSES: Record<WinLossSegment["key"], string> = {
  wins: "bg-win",
  draws: "bg-draw",
  losses: "bg-loss",
}

const TEXT_CLASSES: Record<WinLossSegment["key"], string> = {
  wins: "text-win",
  draws: "text-draw",
  losses: "text-loss",
}

/** Y a-t-il des résultats à afficher ? (sinon on masque la barre V/N/D). */
export function hasWinLossResults(stats: WinLoss): boolean {
  return stats.wins + stats.draws + stats.losses > 0
}

/**
 * Segments visibles de la barre V/N/D : seules les issues non nulles sont conservées
 * (100 % de défaites ⇒ un seul segment « Défaites 100 % », pas de 0 % victoires/nuls).
 */
export function winLossSegments(stats: WinLoss): WinLossSegment[] {
  const total = stats.wins + stats.draws + stats.losses
  if (total <= 0) {
    return []
  }
  return (["wins", "draws", "losses"] as const)
    .map((key) => ({
      key,
      label: LABELS[key],
      value: stats[key],
      percent: Math.round((stats[key] / total) * 100),
      barClassName: BAR_CLASSES[key],
      textClassName: TEXT_CLASSES[key],
    }))
    .filter((segment) => segment.value > 0)
}
