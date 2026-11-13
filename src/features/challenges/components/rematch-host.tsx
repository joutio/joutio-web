import type { ChallengeView } from '@joutio/client-domain/api-types'
import { useEffect, useState } from 'react'
import { useMe, usePlayerIdentity } from '@/features/me'
import { useLanguageStore } from '@/lib/i18n'
import { readServerNow, usePersonalNotifications, type NotificationView } from '@/lib/realtime'
import { useUserAvatar } from '@/shared/avatar'
import { useToastStore } from '@/shared/toast'
import { topicName } from '@/shared/topics'
import { RematchPrompt } from '@/ui'
import { challengesService } from '../lib/challenges-service'
import { useAcceptChallenge, useDeclineChallenges } from '../hooks/use-challenges'

/** Secondes avant l'échéance de la proposition (horloge serveur). */
function useSecondsUntil(at: string | null) {
  const [now, setNow] = useState(readServerNow)
  useEffect(() => {
    if (!at) return
    const timer = window.setInterval(() => setNow(readServerNow()), 250)
    return () => window.clearInterval(timer)
  }, [at])
  return at ? Math.max(0, Math.ceil((Date.parse(at) - now) / 1000)) : 0
}

/**
 * Demandes de revanche reçues (`CHALLENGE_RECEIVED` avec la partie d'origine, `resultat.md` § 6) : `RematchPrompt` sur
 * un voile, au-dessus de toute page, repris de `joutio-mobile` (`RematchHost`). Jamais pendant un duel (toasts
 * suspendus) : la demande attend la fin s'il reste du temps. Accepter ouvre le salon ; refuser ou laisser filer le délai
 * ferme la proposition.
 */
export function RematchHost() {
  const me = useMe().data
  const language = useLanguageStore((state) => state.language)
  const immersive = useToastStore((state) => state.suppressed > 0)
  const [requests, setRequests] = useState<NotificationView[]>([])
  const [views, setViews] = useState<Record<string, ChallengeView>>({})
  const request = requests[0] ?? null
  const view = request?.sourceId ? views[request.sourceId] : undefined
  const seconds = useSecondsUntil(request?.expiresAt ?? view?.expiresAt ?? null)
  const accept = useAcceptChallenge()
  const decline = useDeclineChallenges()
  const avatar = useUserAvatar(view?.challenger)
  const identity = usePlayerIdentity()

  usePersonalNotifications(me?.userId, (notification, deleted) => {
    if (deleted) {
      setRequests((current) => current.filter((item) => item.notificationId !== notification.notificationId))
      return
    }
    if (notification.type !== 'CHALLENGE_RECEIVED' || !notification.gameId || !notification.sourceId) return
    const challengeId = notification.sourceId
    setRequests((current) => (current.some((item) => item.notificationId === notification.notificationId) ? current : [...current, notification]))
    // Pseudonyme, avatar et sujet : lus une fois sur le défi (la notification n'en porte que les identifiants).
    challengesService
      .get(challengeId)
      .then((challenge) => setViews((current) => ({ ...current, [challengeId]: challenge })))
      .catch(() => undefined)
  })

  const close = () => setRequests((current) => current.slice(1))
  // Délai écoulé : la proposition s'en va d'elle-même.
  const deadline = request?.expiresAt ?? view?.expiresAt ?? null
  useEffect(() => {
    if (!request || !deadline) return
    const timer = window.setTimeout(() => setRequests((current) => (current[0] === request ? current.slice(1) : current)), Math.max(0, Date.parse(deadline) - readServerNow()))
    return () => window.clearTimeout(timer)
  }, [request, deadline])

  if (!request || !view || immersive || seconds <= 0) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <div aria-hidden className="absolute inset-0 bg-jo-scrim" />
      <RematchPrompt
        className="relative w-full max-w-[360px]"
        name={view.challenger.pseudonym}
        premium={identity.premium(view.challenger)}
        src={avatar}
        topic={topicName(view.topic.names, language)}
        seconds={seconds}
        onAccept={() => {
          close()
          accept.mutate(view)
        }}
        onDecline={() => {
          close()
          decline.mutate([view.challengeId])
        }}
      />
    </div>
  )
}
