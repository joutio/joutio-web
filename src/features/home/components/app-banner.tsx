import { DeviceMobileIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useT } from '@/lib/i18n'
import { storeUrl } from '@/shared/stores'
import { Banner } from '@/ui'

const KEY = 'joutio.appBanner.dismissed'

const dismissed = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/**
 * « Joutio est meilleur dans l'app » (`web.md` § 3, Accueil état `app`) : `Banner` `info` tout en haut de l'Accueil web.
 * « Ouvrir » mène au store de l'appareil et la masque pour de bon (mémorisé sur l'appareil). La bande globale (connexion,
 * partie en cours) l'emporte. Dès 1 024 px, les marges de `WebFrame` invitent déjà à installer l'app : elle s'y efface.
 */
export function useAppBanner() {
  const t = useT()
  const [hidden, setHidden] = useState(dismissed)
  if (hidden) return undefined
  const open = () => {
    window.open(storeUrl(), '_blank', 'noopener')
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // Stockage indisponible : masquée jusqu'au prochain chargement.
    }
    setHidden(true)
  }
  return (
    <Banner
      tone="info"
      icon={DeviceMobileIcon}
      title={t('home.appBanner')}
      message={t('home.appBannerText')}
      action={{ label: t('home.appBannerOpen'), onClick: open }}
      className="@min-[1024px]/web:hidden"
    />
  )
}
