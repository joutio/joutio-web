import { Outlet } from 'react-router-dom'
import { useT } from '@/lib/i18n'
import { DialogHost } from '@/shared/dialog-host'
import { STORES } from '@/shared/stores'
import { ToastHost } from '@/shared/toast-host'
import { WebFrame } from '@/ui'

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
