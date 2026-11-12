import { BellIcon, GearSixIcon, HourglassIcon, MagnifyingGlassIcon, PlusIcon, SparkleIcon, TrashIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useThemeStore } from '@/lib/theme'
import {
  Avatar,
  Badge,
  Banner,
  BottomNav,
  Button,
  Carousel,
  Chip,
  Dialog,
  EmptyState,
  FeedFooter,
  Field,
  IconButton,
  ListRow,
  Logo,
  Menu,
  MobileSheet,
  MobileTopBar,
  Notice,
  Pill,
  Screen,
  SearchField,
  SectionHeader,
  Segmented,
  Skeleton,
  Switch,
  Toast,
  UnlockSequence,
} from '@/ui'
import { TABS } from '@/features/shell'

/**
 * Banc d'essai du socle (dev uniquement, `/dev/ui`) : chaque groupe de `web-kit.md` § 5, à comparer avec la galerie du
 * lab (`design`, `npm run dev`). Pas un écran du produit.
 */
export function DevUiPage() {
  const { preference, setPreference } = useThemeStore()
  const [sheet, setSheet] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [review, setReview] = useState(false)
  const [slide, setSlide] = useState(0)
  const [unlock, setUnlock] = useState(false)
  const [step, setStep] = useState(0)
  const [toggle, setToggle] = useState(true)
  const [segment, setSegment] = useState<'all' | 'week' | 'month'>('all')
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('home')

  return (
    <Screen
      header={
        <MobileTopBar
          title="Socle"
          subtitle="web-kit § 5"
          right={<IconButton icon={BellIcon} label="Notifications" badge={3} />}
        />
      }
      bottomNav={<BottomNav items={TABS.map((item) => ({ key: item.key, label: item.key, icon: item.icon, badge: item.key === 'challenges' ? 2 : undefined }))} active={tab} onChange={setTab} />}
      overlay={
        <>
          <MobileSheet open={sheet} onClose={() => setSheet(false)} title="Feuille" subtitle="Échap, scrim ou bouton">
            <ListRow label="Première ligne" sub="Avec sous-titre" />
            <ListRow label="Interrupteur" control="toggle" on={toggle} onToggle={setToggle} last />
          </MobileSheet>
          {/* Carrousel (Embla) dans une feuille haute (Vaul) : balayage horizontal, chaque page défile verticalement. */}
          <MobileSheet open={review} onClose={() => setReview(false)} title="Carrousel" subtitle={`Page ${slide + 1} sur 3`} tall>
            <Carousel
              label="Pages"
              className="-mx-4 h-full"
              index={slide}
              onIndexChange={setSlide}
              slides={[0, 1, 2].map((page) => (
                <div key={page} className="grid gap-2 px-4">
                  {Array.from({ length: 24 }, (_, row) => (
                    <ListRow key={row} label={`Page ${page + 1} · ligne ${row + 1}`} last={row === 23} />
                  ))}
                </div>
              ))}
            />
          </MobileSheet>
          {unlock && (
            <div className="absolute inset-0 z-30">
              <UnlockSequence
                step={step}
                steps={3}
                last={step === 2}
                slides={[0, 1, 2].map((page) => (
                  <div key={page} className="grid flex-1 place-items-center jo-type-title-1">
                    Déblocage {page + 1}
                  </div>
                ))}
                onStepChange={setStep}
                onContinue={() => (step === 2 ? setUnlock(false) : setStep(step + 1))}
                onSkip={() => setUnlock(false)}
              />
            </div>
          )}
          <Dialog
            open={dialog}
            onClose={() => setDialog(false)}
            title="Supprimer ?"
            message="Cette action est définitive."
            icon={TrashIcon}
            tone="danger"
            actions={[
              { label: 'Supprimer', variant: 'filled', tone: 'destructive', onClick: () => setDialog(false) },
              { label: 'Annuler', variant: 'plain', onClick: () => setDialog(false) },
            ]}
          />
        </>
      }
    >
      <div className="grid gap-8 px-4 py-4">
        <section className="grid gap-3">
          <SectionHeader title="Thème" />
          <Segmented
            label="Thème"
            value={preference}
            onChange={setPreference}
            options={[
              { value: 'system', label: 'Système' },
              { value: 'light', label: 'Clair' },
              { value: 'dark', label: 'Sombre' },
            ]}
          />
        </section>

        <section className="grid gap-3">
          <SectionHeader title="1 · Primitives" />
          <div className="flex flex-wrap gap-2">
            <Button variant="filled">Jouer</Button>
            <Button variant="tinted">Suivre</Button>
            <Button variant="gray">Annuler</Button>
            <Button variant="plain">Tout voir</Button>
            <Button variant="filled" loading>
              Chargement
            </Button>
            <Button variant="filled" tone="destructive" icon={TrashIcon}>
              Supprimer
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <IconButton icon={PlusIcon} label="Ajouter" />
            <IconButton icon={GearSixIcon} label="Réglages" badge="dot" />
            <Pill tone="online">En ligne</Pill>
            <Pill tone="pending">En attente</Pill>
            <Badge>Nouveau</Badge>
            <Badge variant="accent">Premium</Badge>
            <Badge variant="tier" tier="DIAMANT">
              Diamant
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name="Camille Durand" size="lg" presence="online" />
            <Avatar name="Léo Martin" size="xl" tier="OR" />
            <Avatar name="Inès Benali" size="xl" tier="DIAMANT" />
            <Logo variant="lockup" size={28} />
          </div>
          <div className="grid gap-2">
            <Skeleton width="60%" />
            <Skeleton shape="row" />
          </div>
        </section>

        <section className="grid gap-3">
          <SectionHeader title="3 · Listes et formulaires" />
          <div className="rounded-jo-lg bg-jo-surface">
            <ListRow label="Notifications" icon={BellIcon} control="toggle" on={toggle} onToggle={setToggle} />
            <ListRow label="Langue" control="value" value="Français" />
            <ListRow label="Supprimer mon compte" destructive last />
          </div>
          <Segmented label="Période" value={segment} onChange={setSegment} options={[{ value: 'all', label: 'Tout' }, { value: 'week', label: 'Semaine' }, { value: 'month', label: 'Mois' }]} />
          <div className="flex items-center gap-3">
            <Switch label="Activer" checked={toggle} onChange={setToggle} />
            <Chip selected icon={SparkleIcon}>
              Pour toi
            </Chip>
            <Chip count={12}>Science</Chip>
          </div>
          <Field label="Pseudo" placeholder="Ton pseudo" hint="3 à 20 caractères" counter="0/20" />
          <Field label="Email" defaultValue="pas-un-email" error="Adresse invalide" />
          <SearchField value={query} onChange={setQuery} />
        </section>

        <section className="grid gap-3">
          <SectionHeader title="4 · Superpositions et retours" />
          <div className="flex flex-wrap gap-2">
            <Button variant="gray" onClick={() => setReview(true)}>
              Carrousel
            </Button>
            <Button
              variant="gray"
              onClick={() => {
                setStep(0)
                setUnlock(true)
              }}
            >
              Déblocages
            </Button>
            <Button variant="gray" onClick={() => setSheet(true)}>
              Ouvrir la feuille
            </Button>
            <Button variant="gray" onClick={() => setDialog(true)}>
              Ouvrir le dialogue
            </Button>
          </div>
          <Toast tone="success" title="Lien copié" />
          <Toast title="Camille te défie" description="Histoire de France" actor={{ name: 'Camille Durand', tier: 'OR' }} />
          <Notice tone="info" title="Notifications du navigateur désactivées" action={{ label: 'Activer' }} />
          <Notice tone="live" title="Partie en cours" message="Contre Léo, manche 3" action={{ label: 'Reprendre' }} />
          <Banner connection="reconnecting" />
          <Banner tone="info" title="Ouvrir dans l'app" action={{ label: 'Ouvrir' }} />
          <Menu items={[{ label: 'Partager', checked: false }, { label: 'Signaler', destructive: true, separated: true }]} />
        </section>

        <section className="grid gap-3">
          <SectionHeader title="5 · Contenu" subtitle="Sections, vide, fin de liste" action={<Button variant="plain" size="S">Tout voir</Button>} />
          <EmptyState icon={HourglassIcon} title="Rien pour l'instant" description="Tes parties apparaîtront ici." />
          <EmptyState icon={MagnifyingGlassIcon} title="Aucun résultat" />
          <FeedFooter state="more" pages={1} />
          <FeedFooter state="error" pages={2} />
          <FeedFooter state="end" pages={3} />
        </section>
      </div>
    </Screen>
  )
}
