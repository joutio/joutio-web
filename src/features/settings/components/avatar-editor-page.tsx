import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMe } from '@/features/me'
import { showPremium } from '@/features/premium'
import { useMyBadges, useMyRewards } from '@/features/profile'
import { formatNumber } from '@/features/topic'
import { useLanguageStore, useT } from '@/lib/i18n'
import { useTabParam } from '@/shared/use-tab-param'
import { loadAvatarStyle, parseAvatarOptions, previewAvatar, type AvatarDraft } from '@/shared/avatar'
import { t as avatarLabel } from '@/shared/avatar/i18n'
import { defaultOptionsFor, getAvatarStyle, humanizeVariant, isAvatarStyleLoaded, NONE_LABEL_KEY, type AvatarStyleSection } from '@/shared/avatar/styles'
import type { AvatarStyleId } from '@/shared/avatar/styles/types'
import { ROUTES } from '@/shared/routes'
import { Avatar, ColorSwatch, JoutioTabs, MobileTopBar, OptionTile, RadioGroup, RewardCard, Screen, SectionHeader, TabsScrollView, type TabsScrollPage } from '@/ui'
import { useUpdateMe } from '../hooks/use-settings'
import { styleEntries, type StyleEntry } from '../lib/avatar-styles'

const STYLES_TO_LOAD = ['micah', 'lorelei', 'notionists'] as const

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="grid gap-3">
    <SectionHeader title={title} />
    {children}
  </section>
)


/** Libellé d'une variante : celui du dictionnaire, sinon « Variante 3 », sinon l'identifiant (comme le mobile). */
function variantLabel(section: AvatarStyleSection, variant: string) {
  const key = section.labelKeys?.[variant]
  if (key) return avatarLabel(key)
  const humanized = humanizeVariant(variant)
  return humanized ? avatarLabel(humanized.key, { number: humanized.number }) : variant
}

/**
 * Un autre style part de ses réglages de référence, fond conservé ; l'avatar de base n'a aucun réglage. Tant que le
 * style charge, ses réglages de référence sont inconnus : on ne lit pas sa définition (elle lèverait).
 */
function withStyle(draft: AvatarDraft, style: string): AvatarDraft {
  if (style === draft.style) return draft
  if (style === 'base') return { style: 'base' }
  if (!isAvatarStyleLoaded(style)) return { style }
  return { ...(defaultOptionsFor(style as AvatarStyleId) as AvatarDraft), style, ...(draft.backgroundColor ? { backgroundColor: draft.backgroundColor } : {}) }
}

/**
 * Éditeur d'avatar (`design/specs/screens/avatar.md`), identique à `joutio-mobile` : onglet Style, puis **un onglet par
 * partie** du style choisi (yeux, sourcils, nez…, 2026-11-14), avec ses variantes (« Aucun » si l'élément est
 * facultatif) et sa couleur. La barre défile ; seuls l'onglet ouvert et ses voisins sont rendus.
 * Les vignettes suivent une grille adaptative (largeur minimale, 3 colonnes sur un téléphone). L'avatar de base est
 * celui du Profil, les initiales, sans aucun réglage : avec lui, seul l'onglet Style reste (2026-11-12). Aperçu fixe de
 * 140 px, l'avatar seul sans cadre de rang ; Enregistrer (actif au premier changement) met `me` à jour sur place, restauré si le
 * BFF refuse.
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
  const [tab, setTab] = useTabParam<string>(null, 'style')
  const [ready, setReady] = useState(() => STYLES_TO_LOAD.every((style) => isAvatarStyleLoaded(style)))
  const userId = me?.userId ?? ''

  // Tous les styles sont rendus dans les cartes : on les charge une fois, puis l'aperçu est synchrone.
  useEffect(() => {
    let active = true
    void Promise.all(STYLES_TO_LOAD.map((style) => loadAvatarStyle(style))).then(() => active && setReady(true))
    return () => {
      active = false
    }
  }, [])

  const close = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.editProfile, { replace: true }))
  const preview = (next: AvatarDraft) => previewAvatar(userId, next)
  const dicebear = draft.style !== 'base' && isAvatarStyleLoaded(draft.style)
  const definition = useMemo(() => (dicebear ? getAvatarStyle(draft.style) : undefined), [dicebear, draft.style])
  const sections = useMemo(() => (definition?.groups ?? []).flatMap((group) => group.sections), [definition])
  const tabs = [{ value: 'style', label: t('avatar.tabStyle') }, ...sections.map((item) => ({ value: item.id, label: avatarLabel(item.labelKey) }))]
  const changed = JSON.stringify(draft) !== JSON.stringify(initial)

  // Choisir un style suppose ses réglages de référence : on attend la fin du chargement.
  const chooseStyle = (style: string) => ready && setDraft(withStyle(draft, style))
  const rule = (entry: StyleEntry) => {
    if (entry.kind === 'free') return t('avatar.ruleFree')
    if (entry.kind === 'premium') return t('avatar.rulePremium')
    const badge = t('avatar.ruleMicah', { badge: entry.badgeLabel ?? t('streak.micahBadge'), count: formatNumber(entry.target ?? 7, language) })
    return entry.usable && entry.unlockedAt
      ? `${badge} ${t('avatar.unlockedOn', { date: new Date(entry.unlockedAt).toLocaleDateString(language, { day: 'numeric', month: 'short' }) })}`
      : badge
  }

  const section = (item: AvatarStyleSection) => {
    const title = avatarLabel(item.labelKey)
    const colorTitle = item.colorLabelKey ? avatarLabel(item.colorLabelKey) : avatarLabel('avatar.color')
    const value = (field: string) => draft[field] ?? (definition?.defaults as Record<string, string> | undefined)?.[field]
    const colors = item.colorField && item.colors && (
      <RadioGroup label={colorTitle} className="flex flex-wrap gap-1">
        {item.colors.map((color, index) => {
          const field = item.colorField as string
          return <ColorSwatch key={color} color={color} label={`${colorTitle} ${index + 1}`} selected={value(field) === color} onSelect={() => setDraft({ ...draft, [field]: color })} />
        })}
      </RadioGroup>
    )
    return (
      <div key={item.id} className="grid gap-5">
        {item.variantField && item.variants && (
          <RadioGroup label={title} className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
            {[...(item.allowsNone ? ['none'] : []), ...item.variants].map((variant) => {
              const field = item.variantField as string
              return (
                <OptionTile
                  key={variant}
                  label={variant === 'none' ? avatarLabel(NONE_LABEL_KEY) : variantLabel(item, variant)}
                  image={preview({ ...draft, [field]: variant }) ?? ''}
                  selected={value(field) === variant}
                  onSelect={() => setDraft({ ...draft, [field]: variant })}
                />
              )
            })}
          </RadioGroup>
        )}
        {/* Partie sans variantes (peau, fond) : l'onglet porte déjà son nom, la palette se passe de titre. */}
        {colors && (item.variantField ? <Section title={colorTitle}>{colors}</Section> : colors)}
      </div>
    )
  }

  const page = (content: ReactNode, gap = 'gap-6') => <div className={`grid min-w-0 content-start px-4 pb-4 ${gap}`}>{content}</div>
  const allPages: readonly TabsScrollPage<string>[] = [
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
            image={preview(withStyle(draft, entry.id))}
            progress={entry.kind === 'micah' && !entry.usable ? Math.round(((entry.done ?? 0) / Math.max(1, entry.target ?? 7)) * 100) : undefined}
            progressLabel={entry.kind === 'micah' && !entry.usable ? t('streak.progress', { done: entry.done ?? 0, target: entry.target ?? 7 }) : undefined}
            onSelect={entry.usable && ready ? () => chooseStyle(entry.id) : undefined}
            cta={entry.state === 'premium' ? { label: t('avatar.discoverPremium'), onClick: () => showPremium() } : undefined}
          />
        )),
        'gap-3',
      ),
    },
    ...sections.map((item) => ({ value: item.id, content: page(section(item)) })),
  ]
  // Chaque vignette est un rendu DiceBear : seuls l'onglet ouvert et ses voisins (pour le balayage) sont rendus.
  const current = tabs.some((option) => option.value === tab) ? tab : 'style'
  const active = Math.max(0, allPages.findIndex((item) => item.value === current))
  const pages = allPages.map((item, index) => (Math.abs(index - active) <= 1 ? item : { ...item, content: null }))

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
          <Avatar name={me?.pseudonym ?? ''} src={preview(draft)} size="preview" />
        </div>
        <div className="flex-none px-4 pb-3">
          <JoutioTabs label={t('avatar.tabs')} options={tabs} value={current} onChange={setTab} scrollable={tabs.length > 4} />
        </div>
        <div className="jo-no-scrollbar min-h-0 flex-1 overflow-y-auto">
          <TabsScrollView fill value={current} onChange={setTab} pages={pages} />
        </div>
      </div>
    </Screen>
  )
}
