import { HouseIcon, LightningIcon, SquaresFourIcon, UserIcon, UsersThreeIcon } from '@phosphor-icons/react'
import type { MessageKey } from '@/lib/i18n'

/** Bottom nav à 5 onglets, mêmes icônes que le lab (`design/src/lab/fixtures/nav.ts`), une URL par onglet. */
export const TABS = [
  { key: 'home', label: 'nav.home', icon: HouseIcon, path: '/' },
  { key: 'topics', label: 'nav.topics', icon: SquaresFourIcon, path: '/topics' },
  { key: 'social', label: 'nav.social', icon: UsersThreeIcon, path: '/social' },
  { key: 'challenges', label: 'nav.challenges', icon: LightningIcon, path: '/challenges' },
  { key: 'profile', label: 'nav.profile', icon: UserIcon, path: '/me' },
] as const satisfies readonly { key: string; label: MessageKey; icon: unknown; path: string }[]

export type TabKey = (typeof TABS)[number]['key']
