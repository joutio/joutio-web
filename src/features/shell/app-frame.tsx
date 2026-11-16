import { matchPath, Outlet, useLocation } from 'react-router-dom'
import { useMe } from '@/features/me'
import { ShareHost } from '@/features/share'
import { useT } from '@/lib/i18n'
import { DialogHost } from '@/shared/dialog-host'
import { STORES } from '@/shared/stores'
import { ToastHost } from '@/shared/toast-host'
import { WebFrame } from '@/ui'

/**
 * Cadre de toute l'app (D16, révisée le 2026-11-16) : plein écran sur téléphone ; iPhone Duo ouvert en portrait
 * (626 × 890) pour une fenêtre en portrait d'au moins 674 px (tablette) ; en paysage (890 × 626) dès 938 px, marque dans
 * les marges dès 1 280 px ; réduit si la fenêtre est moins haute. Largeur « regular » (cadre paysage, ou ≥ 700 px en
 * paysage) : rail de navigation à gauche, Résultat en deux volets. L'écran est le conteneur des tailles fluides
 * (`cqw`), des feuilles, dialogues et toasts. Publicité dans la marge : joueur connu et non Premium, jamais pendant un
 * duel (`AdSlot`).
 */
export function AppFrame() {
  const t = useT()
  const me = useMe().data
  const { pathname } = useLocation()
  const inDuel = matchPath('/games/:gameId', pathname) !== null
  return (
    <WebFrame stores={STORES} tagline={t('frame.tagline')} ads={me !== undefined && !me.premium && !inDuel}>
      <Outlet />
      <ToastHost />
      <DialogHost />
      <ShareHost />
    </WebFrame>
  )
}
