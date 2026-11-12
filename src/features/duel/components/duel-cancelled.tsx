import { HourglassLowIcon, UserCircleDashedIcon } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { playService, type PlayTopic } from '@/features/play'
import { useT } from '@/lib/i18n'
import { ROUTES } from '@/shared/routes'
import { toast } from '@/shared/toast'
import { Button, EmptyState } from '@/ui'

/**
 * Partie expirée (`etats-systeme.md`, lab `duel.tsx`) : « Adversaire absent » si elle n'a jamais démarré, « Partie
 * expirée » sinon. Toujours sombre, Elo inchangé. Refaire une recherche remplace le duel par l'appariement.
 */
export function DuelCancelled({ started, topic }: { started: boolean; topic?: PlayTopic }) {
  const t = useT()
  const navigate = useNavigate()
  const back = () => (topic ? void navigate(ROUTES.topic(topic.topicId), { replace: true }) : void navigate(ROUTES.home, { replace: true }))
  const search = useMutation({
    mutationFn: () => playService.enqueue(topic?.topicId ?? ''),
    onSuccess: (ticket) => void navigate(ROUTES.play(ticket.ticketId), { replace: true, state: { topic } }),
    onError: () => toast.error(t('play.matchmakingError'), t('home.errorText')),
  })
  return (
    <div data-jo-theme="dark" className="grid h-full place-items-center bg-jo-bg px-4 pt-[var(--jo-safe-top,0px)] pb-[var(--jo-safe-bottom,0px)] text-jo-text">
      <EmptyState
        icon={started ? HourglassLowIcon : UserCircleDashedIcon}
        title={t(started ? 'duel.expired' : 'duel.absent')}
        description={t(started ? 'duel.expiredText' : 'duel.absentText')}
        action={
          <div className="grid gap-2">
            {topic && (
              <Button full loading={search.isPending} onClick={() => search.mutate()}>
                {t('duel.searchAgain')}
              </Button>
            )}
            <Button full variant="plain" tone="neutral" onClick={back}>
              {t('duel.backToTopic')}
            </Button>
          </div>
        }
      />
    </div>
  )
}
