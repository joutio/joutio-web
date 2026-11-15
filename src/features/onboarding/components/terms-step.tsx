import { ScrollIcon } from '@phosphor-icons/react'
import { useAcceptTerms, useMe } from '@/features/me'
import { useT } from '@/lib/i18n'
import { toast } from '@/shared/toast'
import { Button, Screen } from '@/ui'

/**
 * Acceptation des CGU (2026-11-15) : présentée avant de jouer tant que la version en vigueur (`MeView.termsVersion`)
 * n'est pas acceptée, à la première connexion comme à chaque nouvelle version. L'acceptation est conservée dans
 * identity (preuve du consentement).
 */
export function TermsStep() {
  const t = useT()
  const me = useMe()
  const accept = useAcceptTerms()
  const version = me.data?.termsVersion ?? ''
  return (
    <Screen
      bottomNav={
        <div className="flex-none bg-jo-bg px-4 pt-2 pb-[calc(var(--jo-safe-bottom,0px)+16px)]">
          <Button
            full
            disabled={!version}
            loading={accept.isPending}
            onClick={() => accept.mutate(version, { onError: () => toast.error(t('terms.error'), t('home.errorText')) })}
          >
            {t('terms.accept')}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 px-4 pt-8 pb-4">
        <div className="grid gap-2">
          <span className="grid size-14 -rotate-6 place-items-center rounded-jo-lg bg-jo-accent text-jo-on-accent">
            <ScrollIcon size={28} weight="fill" aria-hidden />
          </span>
          <h1 className="jo-type-title-1 m-0 text-balance">{t('terms.title')}</h1>
          <p className="jo-type-body m-0 text-pretty text-jo-muted">{t('terms.text')}</p>
          {version && <p className="jo-type-caption m-0 text-jo-muted">{t('terms.version', { version })}</p>}
        </div>
        <div className="grid gap-3">
          <a href="/terms.html" target="_blank" rel="noreferrer" className="jo-type-callout jo-focus w-fit rounded-jo-xs underline">
            {t('terms.read')}
          </a>
          <a href="/privacy.html" target="_blank" rel="noreferrer" className="jo-type-callout jo-focus w-fit rounded-jo-xs underline">
            {t('terms.privacy')}
          </a>
        </div>
      </div>
    </Screen>
  )
}
