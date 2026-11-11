import { useEffect } from 'react'
import { useT } from '@/lib/i18n'
import { trackEvent } from '@/lib/telemetry'
import { Button, CategoryTile, Notice, tokens, type CategoryCode } from '@/ui'
import { useSaveInterests } from '../hooks/use-onboarding'
import { MAX_UNIVERSES, useOnboardingStore } from '../onboarding-store'
import { Steps } from './steps'

const UNIVERSES = Object.keys(tokens.category) as CategoryCode[]

/** Univers : 1 à 3 choix ; au 3e, les autres se désactivent. « Passer » saute le premier thème. */
export function UniversesStep() {
  const t = useT()
  const selected = useOnboardingStore((state) => state.universes)
  const setUniverses = useOnboardingStore((state) => state.setUniverses)
  const setSkipped = useOnboardingStore((state) => state.setSkipped)
  const go = useOnboardingStore((state) => state.go)
  const save = useSaveInterests()
  const full = selected.length === MAX_UNIVERSES

  useEffect(() => trackEvent('onboarding_started'), [])

  return (
    <Steps
      index={0}
      action={
        <Button
          variant="plain"
          tone="neutral"
          onClick={() => {
            setSkipped(true)
            go('notifications')
          }}
        >
          {t('onboarding.universes.skip')}
        </Button>
      }
      footer={
        <div className="grid gap-2">
          {save.isError && <Notice tone="error" title={t('onboarding.universes.saveError')} message={t('common.checkConnection')} />}
          <Button
            full
            disabled={selected.length === 0}
            loading={save.isPending}
            onClick={() =>
              save.mutate(selected, {
                onSuccess: () => {
                  setSkipped(false)
                  go('notifications')
                },
              })
            }
          >
            {selected.length > 0 ? t('onboarding.universes.count', { count: selected.length, max: MAX_UNIVERSES }) : t('onboarding.universes.continue')}
          </Button>
        </div>
      }
    >
      <div className="grid gap-2">
        <h1 className="jo-type-title-1 m-0 text-balance">{t('onboarding.universes.title')}</h1>
        <p className="jo-type-body m-0 text-pretty text-jo-muted">{t('onboarding.universes.subtitle')}</p>
      </div>
      <div role="group" aria-label={t('onboarding.universes.grid', { count: selected.length, max: MAX_UNIVERSES })} className="grid grid-cols-3 gap-2">
        {UNIVERSES.map((category) => {
          const on = selected.includes(category)
          return (
            <CategoryTile
              key={category}
              category={category}
              selected={on}
              disabled={full && !on}
              onToggle={() => setUniverses(on ? selected.filter((item) => item !== category) : [...selected, category])}
            />
          )
        })}
      </div>
    </Steps>
  )
}
