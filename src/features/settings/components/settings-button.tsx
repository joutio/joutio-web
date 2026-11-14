import { GearSixIcon } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import type { TabKey } from '@/features/shell'
import { useT } from '@/lib/i18n'
import { ROUTES } from '@/shared/routes'
import { IconButton } from '@/ui'

/**
 * Roue dentée des barres d'onglets (Accueil, Sujets, Social, Défis) et du Profil : ouvre les Réglages en retenant
 * l'onglet d'origine (`from`), où la barre et le retour reviennent. `media` sur l'image du Profil.
 */
export function SettingsButton({ from, media = false }: { from: TabKey; media?: boolean }) {
  const t = useT()
  const navigate = useNavigate()
  return (
    <IconButton
      icon={GearSixIcon}
      label={t('profile.settings')}
      {...(media ? { media: true } : { variant: 'plain' as const, tone: 'neutral' as const })}
      onClick={() => void navigate(ROUTES.settings, { state: { from } })}
    />
  )
}
