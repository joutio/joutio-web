import { CheckCircleIcon, WarningIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMe } from '@/features/me'
import { useMyBadges } from '@/features/profile'
import { formatNumber, useMyTitles } from '@/features/topic'
import { useLanguageStore, useT } from '@/lib/i18n'
import { clearSession } from '@/lib/session'
import { ROUTES } from '@/shared/routes'
import { tierOf } from '@/shared/tier'
import { Button, CodeInput, EmptyState, MobileTopBar, Notice, Screen, tokens } from '@/ui'
import { useDeleteAccount, useRequestDeletionCode } from '../hooks/use-settings'

const CODE_LENGTH = 6

/**
 * Supprimer mon compte (`reglages.md` § 3, lab `supprimer-compte.tsx`) : ce que le joueur perd, puis le code reçu par
 * e-mail (envoyé à l'ouverture, « Renvoyer le code »). « Supprimer définitivement » s'active au 6e chiffre ; la
 * confirmation ramène à la connexion. Sans bottom nav.
 */
export function DeleteAccountPage() {
  const t = useT()
  const navigate = useNavigate()
  const language = useLanguageStore((state) => state.language)
  const me = useMe().data
  const badges = useMyBadges()
  const titles = useMyTitles()
  const request = useRequestDeletionCode()
  const remove = useDeleteAccount()
  const [code, setCode] = useState('')
  const requested = useRef(false)
  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.settings, { replace: true }))

  // Un seul code à l'ouverture (y compris en double rendu de développement) ; « Renvoyer le code » en redemande un.
  const { mutate: requestCode } = request
  useEffect(() => {
    if (requested.current) return
    requested.current = true
    requestCode()
  }, [requestCode])

  const progression = me?.progression
  const rank =
    progression && !progression.provisional ? t('deletion.rank', { tier: tokens.tier[tierOf(progression.rating)].label, rating: formatNumber(progression.rating, language) }) : ''
  const summary = t('deletion.summary', { rank, badges: badges.data?.earnedCount ?? 0, titles: titles.data?.titles.length ?? 0 })

  if (remove.isSuccess)
    return (
      <Screen>
        <EmptyState
          className="pt-24"
          icon={CheckCircleIcon}
          title={t('deletion.done')}
          description={t('deletion.doneText')}
          action={<Button onClick={() => clearSession()}>{t('deletion.finish')}</Button>}
        />
      </Screen>
    )

  return (
    <Screen header={<MobileTopBar variant="inline" back={t('profile.settings')} title={t('deletion.title')} onBack={back} />}>
      <div className="flex min-h-full flex-col gap-6 px-4 pt-4 pb-4">
        <Notice tone="error" title={t('deletion.warning')} message={summary} icon={WarningIcon} />
        <div className="jo-type-callout grid gap-3 text-pretty text-jo-muted">
          <p className="m-0">{t('deletion.games')}</p>
          <p className="m-0">{t('deletion.premium')}</p>
        </div>
        <div className="grid gap-2">
          <span className="jo-type-callout font-semibold">{request.isError ? t('deletion.codeError') : t('deletion.codeSent', { email: me?.email ?? '' })}</span>
          <CodeInput autoFocus value={code} length={CODE_LENGTH} error={remove.isError} label={t('deletion.codeLabel')} onChange={setCode} />
          {remove.isError && <span className="jo-type-caption text-jo-wrong">{t('deletion.wrongCode')}</span>}
          <Button variant="plain" size="S" className="justify-self-start" loading={request.isPending} onClick={() => request.mutate()}>
            {t('deletion.resend')}
          </Button>
        </div>
        <div className="mt-auto grid gap-2">
          <Button full variant="filled" tone="destructive" disabled={code.length < CODE_LENGTH} loading={remove.isPending} onClick={() => remove.mutate(code)}>
            {t('deletion.confirm')}
          </Button>
          <Button full variant="plain" tone="neutral" onClick={back}>
            {t('deletion.keep')}
          </Button>
        </div>
      </div>
    </Screen>
  )
}
