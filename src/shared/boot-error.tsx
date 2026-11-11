import { useState } from 'react'
import { useT } from '@/lib/i18n'
import { logout } from '@/lib/session'
import { Button, Notice, Screen } from '@/ui'

/** `GET /api/me` a échoué au démarrage : réessayer, ou se déconnecter (session incohérente après un reset). */
export function BootError({ onRetry, retrying = false }: { onRetry: () => void; retrying?: boolean }) {
  const t = useT()
  const [leaving, setLeaving] = useState(false)
  return (
    <Screen>
      <div className="flex min-h-full flex-col justify-center gap-4 px-4 pt-8 pb-6">
        <Notice tone="error" title={t('boot.title')} message={t('common.checkConnection')} />
        <Button full loading={retrying} onClick={onRetry}>
          {t('common.retry')}
        </Button>
        <Button
          full
          variant="plain"
          tone="neutral"
          loading={leaving}
          onClick={() => {
            setLeaving(true)
            void logout()
          }}
        >
          {t('onboarding.ended.logout')}
        </Button>
      </div>
    </Screen>
  )
}
