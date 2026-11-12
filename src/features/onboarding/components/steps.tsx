import type { ReactNode } from 'react'
import { PageDots, Screen } from '@/ui'

/** Cadre des étapes après connexion : points de progression, action d'en-tête, pied fixe. */
export function Steps({
  index,
  action,
  fill = false,
  children,
  footer,
}: {
  index: number
  action?: ReactNode
  /** Le contenu remplit l'écran et gère son propre défilement. */
  fill?: boolean
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <Screen
      header={
        <div className="flex min-h-13 items-center justify-between gap-3 pr-2 pl-4">
          <PageDots count={3} index={index} />
          {action}
        </div>
      }
      bottomNav={<div className="flex-none bg-jo-bg px-4 pt-2 pb-[calc(var(--jo-safe-bottom,0px)+16px)]">{footer}</div>}
    >
      <div className={fill ? 'flex h-full flex-col gap-4 px-4 pt-2 pb-2' : 'grid gap-6 px-4 pt-2 pb-4'}>{children}</div>
    </Screen>
  )
}
