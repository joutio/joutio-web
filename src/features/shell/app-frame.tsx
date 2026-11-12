import { Outlet } from 'react-router-dom'
import { useT } from '@/lib/i18n'
import { DialogHost } from '@/shared/dialog-host'
import { ToastHost } from '@/shared/toast-host'
import { WebFrame } from '@/ui'

const STORES = {
  appStore: 'https://apps.apple.com/app/joutio',
  googlePlay: 'https://play.google.com/store/apps/details?id=com.joutio.app',
}

/**
 * Cadre de toute l'app (D16) : plein écran sous 640 px, colonne de 626 px (iPhone Duo ouvert) centrée au-delà, marque dans les marges dès 1 024 px.
 * La colonne est le conteneur des tailles fluides (`cqw`), des feuilles, dialogues et toasts.
 */
export function AppFrame() {
  const t = useT()
  return (
    <WebFrame stores={STORES} tagline={t('frame.tagline')}>
      <Outlet />
      <ToastHost />
      <DialogHost />
    </WebFrame>
  )
}
