import { describe, expect, it } from "vitest"

/**
 * Garde-fou statique des boutons `destructive`.
 *
 * Règle : le rouge est réservé aux actions qui **détruisent** quelque chose ou **terminent
 * irréversiblement** un état — supprimer, retirer, vider, abandonner, se déconnecter, refuser
 * un défi (la commande `decline` supprime l'invitation en attente côté backend), ou **annuler
 * un engagement en cours** (recherche d'appariement, défi envoyé, salon créé).
 * Les autres actions de **fermeture, d'annulation, de réinitialisation ou de nettoyage**
 * restent neutres (`outline`/`ghost`), y compris dans une confirmation destructive : seul le
 * bouton de confirmation est rouge.
 *
 * Incidents à l'origine du garde-fou : une passe d'harmonisation « toutes les annulations en
 * rouge » avait coloré des actions primaires (le « Lancer » d'une popup de duel, le
 * « Rejoindre » d'une bannière de reprise) ; puis les deux boutons de la confirmation
 * « supprimer toutes les notifications » étaient rouges.
 *
 * Exception produit : le « Tout effacer » du footer d'une **bottom sheet de filtres** est rouge
 * (demande explicite), alors que les resets hors popup restent neutres.
 */
/**
 * La galerie design system est une page de référence DEV-only. Elle contient
 * volontairement des exemples destructifs (annulation d'engagement, refus de défi)
 * pour documenter la règle ; elle ne fait pas partie du produit et est exclue.
 */
const DESIGN_SYSTEM_GALLERY =
  "features/design-system/pages/DesignSystemPage.tsx"

const SOURCES = Object.fromEntries(
  Object.entries(
    import.meta.glob("../**/*.tsx", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>
  ).filter(
    ([file]) =>
      !file.endsWith(DESIGN_SYSTEM_GALLERY) && !file.includes(".test.")
  )
)

/** Actions qui justifient réellement un bouton rouge. */
const DESTRUCTIVE_INTENT = new RegExp(
  [
    "delete",
    "supprim",
    "remove",
    "retir",
    "purge",
    "vider",
    "abandon",
    "forfeit",
    "logout",
    "deconnect",
    "desabonn",
    "unfollow",
    "decline",
    "refus",
    "closeRoom",
  ].join("|"),
  "i"
)

/**
 * Exception produit : annuler un engagement en cours est destructif (recherche d'appariement,
 * défi envoyé, salon créé) — même si le libellé dit « annuler » ou « fermer ».
 */
const CANCELLATION_INTENT =
  /matchmaking\.cancel|social\.pending\.cancel|cancelChallenge|cancelDuel|closeRoom/i

/**
 * Exception produit : « Tout effacer » dans le footer d'une bottom sheet de filtres est rouge.
 * Le même libellé existe dans la barre desktop (neutre) : on ne l'exempte que dans la popup
 * (`BottomSheetClose` présent dans la fenêtre du bouton).
 */
function isPopupFilterReset(
  file: string,
  window: string,
  label: string
): boolean {
  return (
    label === "shared.searchToolbar.clearAll" &&
    file.endsWith("search-toolbar.tsx") &&
    window.includes("BottomSheetClose")
  )
}

/** Actions de fermeture, d'annulation ou de nettoyage : jamais rouges. */
const DISMISSIVE_INTENT = new RegExp(
  [
    "cancel",
    "annul",
    "close",
    "fermer",
    "retour",
    "back",
    "later",
    "continue",
    "previous",
    "reset",
    "reinitial",
    "clear",
    "effac",
    "quit",
    "leave",
  ].join("|"),
  "i"
)

/** Fenêtres de code des boutons destructifs : de leur ouverture à leur libellé. */
function destructiveWindows(source: string): string[] {
  const windows: string[] = []
  const lines = source.split("\n")

  lines.forEach((line, index) => {
    const isDestructive =
      /variant="destructive"/.test(line) || /variant: "destructive"/.test(line)
    if (!isDestructive) return

    let start = index
    for (let position = index; position >= 0; position -= 1) {
      const candidate = lines[position] ?? ""
      if (/<Button|buttonVariants\(/.test(candidate)) {
        start = position
        break
      }
    }
    windows.push(lines.slice(start, index + 25).join("\n"))
  })

  return windows
}

/**
 * Clé de traduction du bouton : premier `t("…")` **après** la variante destructive. On ne prend
 * pas tout le voisinage, sinon un lien « retour » plus bas dans la page ferait passer un bouton
 * « Se déconnecter » pour une action de fermeture. Quand le libellé est porté par une variable
 * (`{cancelLabel}`), on résout sa définition dans la source.
 */
function labelKey(window: string, source: string): string {
  const variant = window.search(/variant="destructive"|variant: "destructive"/)
  if (variant < 0) return ""
  const after = window.slice(variant)
  const literal = after.match(/t\("([^"]+)"\)/)?.[1]
  if (literal) return literal

  const variable = after.match(/>\s*\{([A-Za-z_$][\w$]*)\}/)?.[1]
  if (!variable) return ""
  const definition =
    source.match(
      new RegExp(
        `const ${variable}\\s*=[\\s\\S]*?(?=\\n\\s*(?:const|let|return|function)\\b)`
      )
    )?.[0] ?? ""
  return [...definition.matchAll(/t\("([^"]+)"\)/g)]
    .map((match) => match[1])
    .join(" ")
}

describe("garde-fou : boutons destructifs", () => {
  it("chaque bouton `destructive` porte une intention destructive", () => {
    const offenders: string[] = []

    for (const [file, source] of Object.entries(SOURCES)) {
      if (!source.includes('"destructive"')) continue
      for (const window of destructiveWindows(source)) {
        const label = labelKey(window, source)
        if (isPopupFilterReset(file, window, label)) continue
        if (CANCELLATION_INTENT.test(label)) continue
        const handler = window.match(/onClick=\{([^}]+)\}/)?.[1] ?? ""
        if (!DESTRUCTIVE_INTENT.test(`${label} ${handler}`)) {
          offenders.push(
            `${file}\n      ${window.trim().split("\n").join(" ").slice(0, 120)}`
          )
        }
      }
    }

    expect(
      offenders,
      `Bouton(s) « destructive » sans intention destructive (utiliser une variante neutre) :\n  - ${offenders.join(
        "\n  - "
      )}`
    ).toEqual([])
  })

  it("aucun bouton de fermeture, d'annulation ou de nettoyage n'est destructif", () => {
    const offenders: string[] = []

    for (const [file, source] of Object.entries(SOURCES)) {
      if (!source.includes('"destructive"')) continue
      for (const window of destructiveWindows(source)) {
        const label = labelKey(window, source)
        if (isPopupFilterReset(file, window, label)) continue
        if (CANCELLATION_INTENT.test(label)) continue
        if (DISMISSIVE_INTENT.test(label)) {
          offenders.push(
            `${file}\n      ${window.trim().split("\n").join(" ").slice(0, 120)}`
          )
        }
      }
    }

    expect(
      offenders,
      `Bouton(s) de fermeture/annulation/nettoyage en « destructive » (utiliser outline/ghost) :\n  - ${offenders.join(
        "\n  - "
      )}`
    ).toEqual([])
  })
})
