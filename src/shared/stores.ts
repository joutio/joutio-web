/** Fiches de l'app mobile dans les stores (cadre `WebFrame`, bannière « Joutio est meilleur dans l'app »). */
export const STORES = {
  appStore: 'https://apps.apple.com/app/joutio',
  googlePlay: 'https://play.google.com/store/apps/details?id=com.joutio.app',
} as const

/** Store de l'appareil : Google Play sur Android, l'App Store ailleurs (iPhone, iPad, ordinateur). */
export function storeUrl(userAgent = navigator.userAgent): string {
  return /android/i.test(userAgent) ? STORES.googlePlay : STORES.appStore
}
