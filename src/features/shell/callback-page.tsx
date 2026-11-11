import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WarningCircleIcon } from '@phosphor-icons/react'
import { useT } from '@/lib/i18n'
import { completeLogin, continueUrl } from '@/lib/session'
import { Button, EmptyState, Screen, Skeleton } from '@/ui'

/** Retour OIDC (`/callback`) : échange le code, puis rouvre la page demandée (ou l'autorisation d'un client tiers). */
export function CallbackPage() {
  const t = useT()
  const navigate = useNavigate()
  const ran = useRef(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    completeLogin(window.location.search)
      .then((target) => {
        if (!continueUrl.resume()) void navigate(target, { replace: true })
      })
      .catch(() => setFailed(true))
  }, [navigate])

  return (
    <Screen>
      <div role="status" aria-live="polite" className="grid h-full content-center justify-items-center gap-4 px-6">
        {failed ? (
          <EmptyState
            icon={WarningCircleIcon}
            title={t('callback.error')}
            action={
              <Button variant="filled" onClick={() => void navigate('/welcome', { replace: true })}>
                {t('callback.retry')}
              </Button>
            }
          />
        ) : (
          <>
            <Skeleton shape="circle" className="size-16" />
            <p className="jo-type-callout text-jo-muted">{t('callback.loading')}</p>
          </>
        )}
      </div>
    </Screen>
  )
}
