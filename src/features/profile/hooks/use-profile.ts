import { useRewards } from '@joutio/client/me'
import { DEFAULT_HISTORY_FILTERS, useActivity, useBadges, useHistory, usePlayedTopics } from '@joutio/client/profile'
import { selectUserId, useSessionStore } from '@/lib/session'

/** Lectures du joueur connecté : `@joutio/client` avec l'identifiant de la session. */
const useMyId = () => useSessionStore(selectUserId) ?? undefined

/** Série et jours joués sur 365 jours. */
export const useMyActivity = () => useActivity(useMyId())

/** Collection de badges, par famille. */
export const useMyBadges = () => useBadges(useMyId())

/** Sujets joués : parties et XP par sujet (donut, Sujets joués). */
export const useMyTopics = () => usePlayedTopics(useMyId())

/** Récompenses (styles d'avatar) : Micah dans la page Série. */
export const useMyRewards = useRewards

/** Mes parties, les plus récentes d'abord (onglet Historique du Profil : les 10 premières). */
export const useMyRecentGames = () => useHistory(useMyId(), DEFAULT_HISTORY_FILTERS)

/** Dernières parties de l'onglet Historique du Profil. */
export const RECENT_GAMES = 10
