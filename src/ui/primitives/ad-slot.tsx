import { cn } from '../lib/cn'
import { useT } from '@/lib/i18n'

export type AdSlotProps = {
  /** `banner` : bannière 320×50 dans un écran ; `skyscraper` : 600 px de haut, dans les marges du cadre web. */
  format?: 'banner' | 'skyscraper'
  /** Texte de la maquette, à la place de la régie. */
  placeholder?: string
  className?: string
}

/** Emplacement de bannière. Toujours libellé « Publicité », jamais pendant un duel ni pour un joueur Premium. */
export function AdSlot({ format = 'banner', placeholder, className }: AdSlotProps) {
  const t = useT()
  return (
    <aside aria-label={t('ds.ad')} className={cn('grid w-full gap-1', className)}>
      <span className="jo-type-caption font-semibold text-jo-muted">{t('ds.ad')}</span>
      <div
        className={cn('jo-type-caption grid place-items-center rounded-jo-sm font-mono text-jo-muted', format === 'banner' ? 'h-[50px]' : 'h-[600px]')}
        style={{ background: 'repeating-linear-gradient(135deg, var(--jo-raised) 0 8px, var(--jo-hover) 8px 16px)' }}
      >
        {placeholder ?? (format === 'banner' ? 'régie · 320×50' : 'régie · 600')}
      </div>
    </aside>
  )
}
