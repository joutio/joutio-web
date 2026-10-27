/** Helpers PWA purs (installabilité, détection de plateforme), sans dépendance navigateur. */

/** Vrai si l'app tourne déjà en mode installé (standalone), y compris l'iOS `navigator.standalone`. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  const displayMode =
    window.matchMedia?.("(display-mode: standalone)")?.matches === true
  const iosStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return displayMode || iosStandalone
}

/** Détection iOS : le Web Push n'y fonctionne que depuis une PWA installée (iOS ≥ 16.4). */
export function isIos(): boolean {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export interface InstallOfferVisibility {
  installed: boolean
  canInstall: boolean
  ios: boolean
}

/**
 * Une incitation à l'installation n'est utile que s'il y a une action possible : bouton natif
 * `beforeinstallprompt` (Chrome/Edge) ou consignes iOS (prérequis du push). Masquée si l'app
 * est déjà installée, ou sur les navigateurs sans installation PWA (Firefox, Safari macOS…).
 */
export function shouldOfferInstall({
  installed,
  canInstall,
  ios,
}: InstallOfferVisibility): boolean {
  return !installed && (canInstall || ios)
}
