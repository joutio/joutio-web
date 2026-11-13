import { displayShareUrl } from '@joutio/client-domain/share'
import { AppleLogoIcon, CheckIcon, CopyIcon, GooglePlayLogoIcon, ShareNetworkIcon } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { renderSVG } from 'uqr'
import { useT } from '@/lib/i18n'
import { STORES } from '@/shared/stores'
import { toast } from '@/shared/toast'
import { Button, MobileSheet } from '@/ui'
import { useShareStore } from './share-store'

/**
 * Feuille « Partager » du web (`partage.md` § 4, lab `use-share.tsx`) : le lien et son QR code (à scanner avec le
 * téléphone), « Copier le lien », « Plus d'options » quand le navigateur a une feuille de partage, puis l'invitation
 * à installer l'app.
 */
export function ShareHost() {
  const t = useT()
  const current = useShareStore((state) => state.current)
  const close = useShareStore((state) => state.close)
  const [copiedUrl, setCopiedUrl] = useState<string>()
  const copied = current !== null && copiedUrl === current.url
  const qr = useMemo(() => (current ? `data:image/svg+xml;utf8,${encodeURIComponent(renderSVG(current.url, { border: 1 }))}` : undefined), [current])

  const copy = () => {
    if (!current) return
    void navigator.clipboard
      ?.writeText(current.url)
      .then(() => {
        setCopiedUrl(current.url)
        toast.success(t('common.linkCopied'))
      })
      .catch(() => toast.error(t('common.copyError')))
  }

  return (
    <MobileSheet open={current !== null} onClose={close} title={current?.title ?? t('share.title')}>
      {current && (
        <div className="grid gap-4">
          <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-4 rounded-jo-lg bg-jo-raised p-4">
            <img src={qr} alt={t('share.qr', { link: displayShareUrl(current.url) })} className="size-28 rounded-jo-md bg-white" />
            <div className="grid min-w-0 gap-2">
              <span className="jo-type-caption truncate font-mono text-jo-muted">{displayShareUrl(current.url)}</span>
              <Button variant="gray" tone="neutral" size="S" full icon={copied ? CheckIcon : CopyIcon} onClick={copy}>
                {t(copied ? 'common.linkCopied' : 'topic.copyLink')}
              </Button>
            </div>
          </div>
          {typeof navigator.share === 'function' && (
            <Button full variant="tinted" icon={ShareNetworkIcon} onClick={() => void navigator.share({ title: current.title, text: current.text, url: current.url }).catch(() => undefined)}>
              {t('share.more')}
            </Button>
          )}
          <div className="grid gap-3 rounded-jo-lg bg-jo-warm p-4">
            <div className="grid gap-1">
              <span className="jo-type-headline">{t('home.appBanner')}</span>
              <span className="jo-type-callout text-pretty text-jo-muted">{t('share.appText')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="gray" tone="neutral" size="S" icon={AppleLogoIcon} onClick={() => window.open(STORES.appStore, '_blank', 'noopener')}>
                App Store
              </Button>
              <Button variant="gray" tone="neutral" size="S" icon={GooglePlayLogoIcon} onClick={() => window.open(STORES.googlePlay, '_blank', 'noopener')}>
                Google Play
              </Button>
            </div>
          </div>
        </div>
      )}
    </MobileSheet>
  )
}
