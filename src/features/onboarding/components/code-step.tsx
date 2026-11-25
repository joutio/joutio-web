import { zodResolver } from '@hookform/resolvers/zod'
import { OTP_LENGTH, OTP_RESEND_SECONDS, otpSchema } from '@joutio/client/me'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { isApiError } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { CodeInput, MobileTopBar, Screen, Button } from '@/ui'
import { useLoginWithCode, useRequestLoginCode } from '../hooks/use-onboarding'
import { useOnboardingStore } from '../onboarding-store'

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

/** Saisie du code : validé seul au 6e chiffre. Un code refusé colore les cases ; une panne réseau le dit autrement. */
export function CodeStep() {
  const t = useT()
  const email = useOnboardingStore((state) => state.email)
  const go = useOnboardingStore((state) => state.go)
  const form = useForm({ resolver: zodResolver(otpSchema), defaultValues: { code: '' } })
  const code = useWatch({ control: form.control, name: 'code' })
  const [wait, setWait] = useState(OTP_RESEND_SECONDS)
  const login = useLoginWithCode()
  const resend = useRequestLoginCode()

  useEffect(() => {
    if (wait === 0) return
    const timer = setTimeout(() => setWait((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  const submit = form.handleSubmit(({ code: value }) => login.mutate({ email, code: value }))
  const onChange = (value: string) => {
    form.setValue('code', value)
    if (login.isError) login.reset()
    if (value.length === OTP_LENGTH) void submit()
  }

  const rejected = isApiError(login.error) && !login.error.transient
  const message = login.isError ? (rejected ? t('onboarding.code.wrong') : t('common.checkConnection')) : null

  return (
    <Screen header={<MobileTopBar variant="inline" back={t('onboarding.code.back')} onBack={() => go('login')} />}>
      <div className="grid gap-6 px-4 pt-4 pb-6">
        <div className="grid gap-2">
          <h1 className="jo-type-title-1 m-0">{t('onboarding.code.title')}</h1>
          <p className="jo-type-body m-0 text-jo-muted">
            {t('onboarding.code.sentTo')} <strong className="text-jo-text">{email}</strong>. {t('onboarding.code.validity')}
          </p>
        </div>
        <div className="grid gap-2">
          <CodeInput autoFocus value={code} length={OTP_LENGTH} error={rejected} onChange={login.isPending ? () => undefined : onChange} />
          {message && (
            <span role="alert" className="jo-type-caption text-jo-wrong">
              {message}
            </span>
          )}
        </div>
        {wait > 0 ? (
          <span className="jo-type-callout text-center text-jo-muted">{t('onboarding.code.resendIn', { time: clock(wait) })}</span>
        ) : (
          <Button
            variant="plain"
            tone="accent"
            className="justify-self-center"
            loading={resend.isPending}
            onClick={() =>
              resend.mutate(email, {
                onSuccess: () => {
                  form.reset()
                  login.reset()
                  setWait(OTP_RESEND_SECONDS)
                },
              })
            }
          >
            {t('onboarding.code.resend')}
          </Button>
        )}
      </div>
    </Screen>
  )
}
