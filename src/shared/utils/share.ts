export type ShareTargetId = "whatsapp" | "x" | "facebook" | "telegram"

export interface ShareTarget {
  id: ShareTargetId
  label: string
  /** Couleur de marque (ou `currentColor` pour X, monochrome selon le thème). */
  color: string
  href: string
}

/**
 * Construit les liens de partage social (intents web, sans SDK tiers) pour un texte et une URL.
 */
export function shareTargets(text: string, url: string): ShareTarget[] {
  const encodedText = encodeURIComponent(text)
  const encodedUrl = encodeURIComponent(url)
  return [
    {
      id: "whatsapp",
      label: "WhatsApp",
      color: "#25D366",
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    },
    {
      id: "x",
      label: "X",
      color: "currentColor",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      color: "#1877F2",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id: "telegram",
      label: "Telegram",
      color: "#229ED9",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
  ]
}
