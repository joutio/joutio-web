import { matchPath, Outlet, useLocation } from 'react-router-dom'
import { useMe } from '@/features/me'
import { ShareHost } from '@/features/share'
import { useT } from '@/lib/i18n'
import { DialogHost } from '@/shared/dialog-host'
import { STORES } from '@/shared/stores'
import { ToastHost } from '@/shared/toast-host'
import { WebFrame } from '@/ui'

/**
 * Cadre de toute l'app (D16) : plein écran sous 640 px, écran de l'iPhone Duo ouvert (626 × 890, réduit si la fenêtre est
 * moins haute) centré au-delà, marque dans les marges dès 1 024 px. L'écran est le conteneur des tailles fluides
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
