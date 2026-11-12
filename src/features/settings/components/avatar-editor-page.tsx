import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMe } from '@/features/me'
import { showPremium } from '@/features/premium'
import { useMyBadges, useMyRewards } from '@/features/profile'
import { formatNumber } from '@/features/topic'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import { BACKGROUND_COLORS, HAIR_COLORS, loadAvatarStyle, parseAvatarOptions, previewAvatar, type AvatarDraft } from '@/shared/avatar'
import { ROUTES } from '@/shared/routes'
import { tierOf } from '@/shared/tier'
import { Avatar, ColorSwatch, JoutioTabs, MobileTopBar, OptionTile, RadioGroup, RewardCard, Screen, SectionHeader, TabsScrollView, type TabsScrollPage } from '@/ui'
import { useUpdateMe } from '../hooks/use-settings'
import { styleEntries, type StyleEntry } from '../lib/avatar-styles'

type Tab = 'style' | 'face' | 'hair' | 'glasses' | 'background'

const TABS: readonly { value: Tab; label: MessageKey }[] = [
  { value: 'style', label: 'avatar.tabStyle' },
  { value: 'face', label: 'avatar.tabFace' },
  { value: 'hair', label: 'avatar.tabHair' },
  { value: 'glasses', label: 'avatar.tabGlasses' },
  { value: 'background', label: 'avatar.tabBackground' },
]

/** Variantes Micah maquettées par le lab (`fixtures/avatars.ts`), dans le même ordre. */
const HAIR = ['fonze', 'dannyPhantom', 'dougFunny', 'full', 'mrClean', 'mrT', 'pixie', 'turban'] as const
const EYES = ['eyes', 'eyesShadow', 'round', 'smiling', 'smilingShadow'] as const
const MOUTHS = ['laughing', 'smile', 'smirk', 'surprised', 'nervous', 'pucker', 'frown', 'sad'] as const
const GLASSES = ['none', 'round', 'square'] as const

/** Réglages Micah par défaut (lab `DEFAULT_AVATAR`), posés en passant à Micah depuis un autre style. */
const MICAH_DEFAULTS = { hair: 'fonze', hairColor: '#18181b', eyes: 'eyes', mouth: 'laughing', glasses: 'none' }

const STYLES_TO_LOAD = ['micah', 'lorelei', 'notionists'] as const

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="grid gap-3">
    <SectionHeader title={title} />
    {children}
  </section>
)

/**
 * Éditeur d'avatar (`design/specs/screens/avatar.md`, lab `avatar-editor.tsx`) : modale plein écran, sans bottom nav.
 * Annuler, « Mon avatar », Enregistrer (actif au premier changement) ; aperçu fixe de 140 px avec le cadre du rang ;
 * onglets Style, Visage, Cheveux, Lunettes, Fond (les styles Premium n'ont que Style et Fond). L'avatar de base est celui
 * du Profil, les initiales, sans aucun réglage : avec lui, seul l'onglet Style reste (2026-11-12).
 * Enregistrer met `me` à jour sur place, restauré si le BFF refuse.
 */
export function AvatarEditorPage() {
  const t = useT()
  const navigate = useNavigate()
  const language = useLanguageStore((state) => state.language)
  const me = useMe().data
  const rewards = useMyRewards()
  const badges = useMyBadges()
  const save = useUpdateMe('avatarOptions')
  const [initial] = useState(() => parseAvatarOptions(me?.avatarOptions))
  const [draft, setDraft] = useState<AvatarDraft>(initial)
  const [tab, setTab] = useState<Tab>('style')
  const [, setLoaded] = useState(0)
  const userId = me?.userId ?? ''

  // Tous les styles sont rendus dans les cartes : on les charge une fois, puis l'aperçu est synchrone.
  useEffect(() => {
    let active = true
    void Promise.all(STYLES_TO_LOAD.map((style) => loadAvatarStyle(style))).then(() => active && setLoaded((count) => count + 1))
    return () => {
      active = false
    }
  }, [])

  const close = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.settings, { replace: true }))
  const preview = (next: AvatarDraft) => previewAvatar(userId, next)
  const micah = draft.style === 'micah'
  const tabs = TABS.filter(({ value }) => micah || value === 'style' || (value === 'background' && draft.style !== 'base'))
  const changed = JSON.stringify(draft) !== JSON.stringify(initial)
  const rating = me?.progression && !me.progression.provisional ? me.progression.rating : undefined

  const chooseStyle = (style: string) => {
    if (style === draft.style) return
    if (style === 'base') return setDraft({ style })
    setDraft(style === 'micah' ? { ...MICAH_DEFAULTS, ...draft, style } : { style, backgroundColor: draft.backgroundColor })
  }
  const rule = (entry: StyleEntry) => {
    if (entry.kind === 'free') return t('avatar.ruleFree')
    if (entry.kind === 'premium') return t('avatar.rulePremium')
    const badge = t('avatar.ruleMicah', { badge: entry.badgeLabel ?? t('streak.micahBadge'), count: formatNumber(entry.target ?? 7, language) })
    return entry.usable && entry.unlockedAt
      ? `${badge} ${t('avatar.unlockedOn', { date: new Date(entry.unlockedAt).toLocaleDateString(language, { day: 'numeric', month: 'short' }) })}`
      : badge
  }

  const variants = (title: string, field: string, options: readonly string[]) => (
    <Section title={title}>
      <RadioGroup label={title} className="grid grid-cols-4 gap-2">
        {options.map((value) => (
          <OptionTile key={value} label={t(`avatar.${field}.${value}` as MessageKey)} image={preview({ ...draft, [field]: value }) ?? ''} selected={draft[field] === value} onSelect={() => setDraft({ ...draft, [field]: value })} />
        ))}
      </RadioGroup>
    </Section>
  )
  const colors = (title: string, field: string, palette: readonly string[]) => (
    <Section title={title}>
      <RadioGroup label={title} className="flex flex-wrap gap-1">
        {palette.map((color, index) => (
          <ColorSwatch key={color} color={color} label={`${title} ${index + 1}`} selected={draft[field] === color} onSelect={() => setDraft({ ...draft, [field]: color })} />
        ))}
      </RadioGroup>
    </Section>
  )

  const page = (content: ReactNode, gap = 'gap-6') => <div className={`grid min-w-0 content-start px-4 pb-4 ${gap}`}>{content}</div>
  const allPages: readonly TabsScrollPage<Tab>[] = [
    {
      value: 'style',
      content: page(
        styleEntries(me, rewards.data, badges.data, draft.style).map((entry) => (
          <RewardCard
            key={entry.id}
            title={entry.title}
            rule={rule(entry)}
            state={entry.state}
            avatarName={me?.pseudonym}
            image={preview(entry.id === draft.style ? draft : entry.id === 'micah' ? { ...MICAH_DEFAULTS, style: 'micah', backgroundColor: draft.backgroundColor } : { style: entry.id, backgroundColor: draft.backgroundColor })}
            progress={entry.kind === 'micah' && !entry.usable ? Math.round(((entry.done ?? 0) / Math.max(1, entry.target ?? 7)) * 100) : undefined}
            progressLabel={entry.kind === 'micah' && !entry.usable ? t('streak.progress', { done: entry.done ?? 0, target: entry.target ?? 7 }) : undefined}
            onSelect={entry.usable ? () => chooseStyle(entry.id) : undefined}
            cta={entry.state === 'premium' ? { label: t('avatar.discoverPremium'), onClick: () => showPremium() } : undefined}
          />
        )),
        'gap-3',
      ),
    },
    { value: 'face', content: page(<>{variants(t('avatar.eyes'), 'eyes', EYES)}{variants(t('avatar.mouth'), 'mouth', MOUTHS)}</>) },
    { value: 'hair', content: page(<>{variants(t('avatar.hairStyle'), 'hair', HAIR)}{colors(t('avatar.hairColor'), 'hairColor', HAIR_COLORS)}</>) },
    { value: 'glasses', content: page(variants(t('avatar.tabGlasses'), 'glasses', GLASSES)) },
    { value: 'background', content: page(colors(t('avatar.tabBackground'), 'backgroundColor', BACKGROUND_COLORS)) },
  ]
  const pages = allPages.filter(({ value }) => tabs.some((option) => option.value === value))

  return (
    <Screen
      header={
        <MobileTopBar
          variant="modal"
          title={t('avatar.title')}
          cancel={t('common.cancel')}
          confirm={t('settings.save')}
          confirmDisabled={!changed || save.isPending}
          onCancel={close}
          onConfirm={() => {
            // Optimiste : `me` change tout de suite, restauré (avec un toast) si le BFF refuse.
            save.mutate(JSON.stringify(draft))
            close()
          }}
        />
      }
    >
      <div className="flex h-full flex-col">
        <div className="grid flex-none justify-items-center py-3">
          <Avatar name={me?.pseudonym ?? ''} src={preview(draft)} tier={rating !== undefined ? tierOf(rating) : undefined} size="preview" />
        </div>
        <div className="flex-none px-4 pb-3">
          <JoutioTabs label={t('avatar.tabs')} options={tabs.map((option) => ({ value: option.value, label: t(option.label) }))} value={tab} onChange={setTab} />
        </div>
        <div className="jo-no-scrollbar min-h-0 flex-1 overflow-y-auto">
          <TabsScrollView fill value={tabs.some((option) => option.value === tab) ? tab : 'style'} onChange={setTab} pages={pages} />
        </div>
      </div>
    </Screen>
  )
}
