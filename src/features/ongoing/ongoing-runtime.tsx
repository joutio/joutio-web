import { useActiveGames } from '@joutio/client/game'
import { useContext, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLanguageStore, useT } from '@/lib/i18n'
import { selectUserId, useSessionStore } from '@/lib/session'
import { ROUTES } from '@/shared/routes'
import { topicName } from '@/shared/topics'
import { Banner, GlobalBannerContext } from '@/ui'

/**
 * Reprendre une partie (`etats-systeme.md`, repris du mobile) : `useActiveGames`, lu une fois puis tenu à jour par
 * `@joutio/client` (partie créée : la salle quitte `my-rooms` ; partie finie, abandonnée ou annulée : retirée). Aucun
 * polling ni relecture maison. Le bandeau « Partie en cours » (sujet, Rejoindre) prend la place globale ; la bannière
 * de connexion l'emporte. Sans redirection automatique ; il disparaît dans l'arène de cette partie.
 */
export function OngoingRuntime({ children }: { children: ReactNode }) {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const language = useLanguageStore((state) => state.language)
  const active = useActiveGames(useSessionStore(selectUserId) ?? undefined)

  // La plus ancienne d'abord ; pas dans l'arène de cette même partie.
  const game = [...(active.data ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).find((item) => !location.pathname.startsWith(ROUTES.game(item.gameId)))
  const connectionBanner = useContext(GlobalBannerContext)
  const banner =
    connectionBanner ??
    (game ? (
      <Banner
        tone="live"
        title={t('ongoing.title')}
        message={topicName(game.topic.names, language)}
        action={{
          label: t('ongoing.join'),
          onClick: () => void navigate(ROUTES.game(game.gameId), { state: { topic: { topicId: game.topic.topicId, name: topicName(game.topic.names, language), category: game.topic.category } } }),
        }}
      />
    ) : null)

  return <GlobalBannerContext.Provider value={banner}>{children}</GlobalBannerContext.Provider>
}
