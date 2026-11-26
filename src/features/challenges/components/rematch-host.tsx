import { useAcceptInvitation, useDeclineInvitations, useIncomingRematch } from '@joutio/client/rooms'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePlayerIdentity } from '@/features/me'
import { useLanguageStore, useT } from '@/lib/i18n'
import { readServerNow } from '@/lib/realtime'
import { useUserAvatar } from '@/shared/avatar'
import { ROUTES } from '@/shared/routes'
import { toast, useToastStore } from '@/shared/toast'
import { topicName } from '@/shared/topics'
import { RematchPrompt } from '@/ui'
import { selectUserId, useSessionStore } from '@/lib/session'

/** Secondes avant l'échéance de la proposition (horloge serveur), pour l'affichage seulement. */
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
 * Revanche reçue (`resultat.md` § 6) : `RematchPrompt` sur un voile, au-dessus de toute page, tant que
 * `useIncomingRematch` porte une salle `INVITED` d'origine `REMATCH`. Jamais pendant un duel (toasts suspendus) : la
 * demande attend la fin s'il reste du temps. Accepter ouvre le salon (même `roomId`) ; refuser la retire ; l'échéance
 * du serveur (salle expirée, retirée de `my-rooms`) la retire d'elle-même.
 */
export function RematchHost() {
  const t = useT()
  const navigate = useNavigate()
  const language = useLanguageStore((state) => state.language)
  const immersive = useToastStore((state) => state.suppressed > 0)
  const room = useIncomingRematch(useSessionStore(selectUserId) ?? undefined).data
  const seconds = useSecondsUntil(room?.expiresAt ?? null)
  const accept = useAcceptInvitation()
  const decline = useDeclineInvitations()
  const avatar = useUserAvatar(room?.opponent)
  const identity = usePlayerIdentity()
  // Revanche acceptée depuis le résultat : le salon remplace la partie précédente dans l'historique, Quitter ne ramène
  // pas à l'ancien résultat (2026-11-16).
  const { pathname } = useLocation()

  if (!room || immersive || seconds <= 0) return null
  const topic = { topicId: room.topic.topicId, name: topicName(room.topic.names, language), category: room.topic.category }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <div aria-hidden className="absolute inset-0 bg-jo-scrim" />
      <RematchPrompt
        className="relative w-full max-w-[360px]"
        name={room.opponent?.pseudonym ?? t('topic.opponent')}
        premium={identity.premium(room.opponent)}
        src={avatar}
        topic={topic.name}
        seconds={seconds}
        onAccept={() =>
          accept.mutate(room.roomId, {
            onSuccess: () => void navigate(ROUTES.room(room.roomId), { state: { topic }, replace: pathname.startsWith('/games/') }),
            onError: () => toast.error(t('challenges.acceptError')),
          })
        }
        onDecline={() => decline.mutate([room.roomId], { onError: () => toast.error(t('challenges.declineError'), t('challenges.retryText')) })}
      />
    </div>
  )
}
