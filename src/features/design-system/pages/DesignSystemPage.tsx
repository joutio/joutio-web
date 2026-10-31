import { useState, type ReactNode } from "react"
import {
  ArrowRightIcon,
  CaretDownIcon,
  CheckIcon,
  DoorOpenIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  ProhibitIcon,
  SunIcon,
  TrashIcon,
  UserMinusIcon,
  XIcon,
} from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardHeading,
  CardMedia,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Toggle } from "@/components/ui/toggle"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs"
import { AnimatedSwitch } from "@/components/spectrumui/animated-switch"
import { BottomSheet } from "@/components/arc/bottom-sheet/bottom-sheet"
import { AppDialog } from "@/shared/components/app-dialog"
import { PagePattern } from "@/shared/components/page-pattern"
import { showToast } from "@/shared/utils/toast"
import { useTheme } from "@/features/shell"

const SECTIONS = [
  { id: "rules", label: "Règles" },
  { id: "colors", label: "Couleurs" },
  { id: "typography", label: "Typographie" },
  { id: "spacing", label: "Espacements" },
  { id: "buttons", label: "Boutons" },
  { id: "forms", label: "Formulaires" },
  { id: "cards", label: "Cartes" },
  { id: "controls", label: "Contrôles" },
  { id: "overlays", label: "Overlays" },
  { id: "shell", label: "Shell" },
  { id: "parity", label: "Parité mobile" },
  { id: "responsive", label: "Responsive" },
]

const COLOR_TOKENS: Array<{
  token: string
  label: string
  text?: boolean
  /** Fond de la pastille pour les tokens de texte clairs (ex. texte sur accent). */
  on?: string
}> = [
  { token: "--background", label: "Fond de page" },
  { token: "--foreground", label: "Texte principal", text: true },
  { token: "--card", label: "Carte" },
  { token: "--popover", label: "Popover" },
  { token: "--primary", label: "Accent de marque" },
  { token: "--primary-foreground", label: "Texte sur accent", text: true, on: "--primary" },
  { token: "--secondary", label: "Secondaire" },
  { token: "--muted", label: "Muted" },
  { token: "--muted-foreground", label: "Texte muted", text: true },
  { token: "--accent", label: "Accent" },
  { token: "--destructive", label: "Destructif" },
  { token: "--border", label: "Bordure" },
  { token: "--input", label: "Champ" },
  { token: "--ring", label: "Focus ring" },
  { token: "--sidebar", label: "Sidebar" },
  { token: "--sidebar-accent", label: "Sidebar actif" },
  { token: "--success-600", label: "Victoire / succès" },
  { token: "--loss", label: "Défaite" },
  { token: "--draw", label: "Égalité" },
  { token: "--duel-bg", label: "Duel — fond" },
  { token: "--duel-surface", label: "Duel — surface" },
  { token: "--duel-score", label: "Duel — score" },
  { token: "--duel-correct", label: "Duel — correct" },
  { token: "--duel-wrong", label: "Duel — incorrect" },
]

const TYPE_SCALE = [
  { label: "Display", className: "text-4xl font-semibold tracking-tight", sample: "Joutio" },
  { label: "Title", className: "text-3xl font-semibold tracking-tight", sample: "Titre de page" },
  { label: "Heading", className: "text-2xl font-semibold", sample: "Titre de section" },
  { label: "Subheading", className: "text-lg font-semibold", sample: "Sous-section" },
  { label: "Body large", className: "text-base", sample: "Corps de texte principal." },
  { label: "Body", className: "text-sm", sample: "Texte courant des écrans." },
  { label: "Label", className: "text-sm font-medium", sample: "Libellé fort" },
  { label: "Caption", className: "text-xs text-muted-foreground", sample: "Légende secondaire" },
  { label: "Badge", className: "text-2xs", sample: "PLANCHER 11 PX" },
]

const SPACING_TOKENS = [
  { token: "1", px: 4, className: "w-1" },
  { token: "2", px: 8, className: "w-2" },
  { token: "3", px: 12, className: "w-3" },
  { token: "4", px: 16, className: "w-4" },
  { token: "6", px: 24, className: "w-6" },
  { token: "8", px: 32, className: "w-8" },
  { token: "12", px: 48, className: "w-12" },
  { token: "16", px: 64, className: "w-16" },
]

const RADIUS_TOKENS = [
  { token: "rounded-sm", label: "sm" },
  { token: "rounded-md", label: "md" },
  { token: "rounded-lg", label: "lg" },
  { token: "rounded-xl", label: "xl" },
  { token: "rounded-2xl", label: "2xl" },
  { token: "rounded-3xl", label: "3xl" },
  { token: "rounded-card", label: "card (34)" },
  { token: "rounded-full", label: "full" },
]

const DESTRUCTIVE_ACTIONS = [
  {
    label: "Quitter le duel",
    icon: DoorOpenIcon,
    note: "Abandon irréversible d'une partie en cours.",
  },
  {
    label: "Annuler la recherche",
    icon: MagnifyingGlassIcon,
    note: "Termine un engagement en cours (ticket d'appariement).",
  },
  {
    label: "Annuler la salle",
    icon: XIcon,
    note: "Ferme une salle créée et son cycle de préparation.",
  },
  {
    label: "Refuser un défi",
    icon: UserMinusIcon,
    note: "Supprime l'invitation en attente côté backend.",
  },
  {
    label: "Supprimer une notification",
    icon: TrashIcon,
    note: "Suppression définitive dans l'inbox du joueur.",
  },
]

const MOBILE_PARITY = [
  { web: 'Button variant="default"', mobile: "AppButton (filled)", rule: "Action principale" },
  { web: 'Button variant="outline"', mobile: 'AppButton variant="outlined"', rule: "Action secondaire" },
  { web: 'Button variant="ghost" / "link"', mobile: 'AppButton variant="text"', rule: "Action discrète" },
  { web: 'Button variant="destructive"', mobile: 'AppButton tone="danger"', rule: "Le rouge reste réservé à la destruction" },
  { web: "Card", mobile: "AppCard (surface / outlined / flat)", rule: "Surface, bordure, rayon" },
  { web: "Badge", mobile: "AppChip · AppDot", rule: "Statut ou filtre court" },
  { web: "Input + Field", mobile: "AppTextField", rule: "Libellé, aide, erreur" },
  { web: "Select", mobile: "Picker (Expo UI)", rule: "Choix fermé" },
  { web: "Switch (AnimatedSwitch)", mobile: "AppSwitch", rule: "Interrupteur natif" },
  { web: "Tabs (beui)", mobile: "Picker segmenté · onglets natifs", rule: "Vue locale, jamais la navigation" },
  { web: "Progress", mobile: "ProgressBar", rule: "Valeur et libellé accessibles" },
  { web: "Skeleton", mobile: "AppSkeleton · AppSkeletonCard", rule: "Chargement sans texte" },
  { web: "Typography (text-*)", mobile: "AppText variant / tone", rule: "Rôles display → caption" },
  { web: "CSS variables", mobile: "useNativeColors()", rule: "background, surface, text, accent, danger" },
]

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
]

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div className="space-y-1">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </section>
  )
}

function TokenLabel({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-2xs text-muted-foreground">
      {children}
    </code>
  )
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
      {children}
    </code>
  )
}

export function DesignSystemPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const [tab, setTab] = useState("overview")
  const [notify, setNotify] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <LightningIcon className="size-4 fill-current" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Design system</p>
            <p className="truncate text-xs text-muted-foreground">
              Joutio Web → Joutio Mobile
            </p>
          </div>
          <Badge variant="outline" className="ml-1 hidden tablet-up:inline-flex">
            DEV ONLY
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label={
                resolvedTheme === "dark"
                  ? "Passer en thème clair"
                  : "Passer en thème sombre"
              }
            >
              {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
              <span className="hidden tablet-up:inline">
                {resolvedTheme === "dark" ? "Clair" : "Sombre"}
              </span>
            </Button>
          </div>
        </div>
        <nav aria-label="Sommaire" className="border-t border-border/60">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 py-1.5">
            {SECTIONS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="shrink-0 rounded-full px-2.5 py-1 text-xs whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-5 py-10">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Référence canonique</Badge>
            <Badge variant="outline">shadcn + tokens Joutio</Badge>
            <Badge variant="outline">Sans couche Apple</Badge>
          </div>
          <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight compact:text-3xl">
            Le vocabulaire visuel de Joutio, au même endroit.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Cette page documente le design system <strong>actuel</strong> :
            primitives shadcn, tokens de thème et contrat responsive. Elle sert
            de référence pour le web et de cible de parité pour{" "}
            <span className="font-medium text-foreground">joutio-mobile</span>.
          </p>
        </div>

        <Section
          id="rules"
          title="Règles structurantes"
          description="Quatre décisions qui priment sur les variantes locales."
        >
          <div className="grid gap-3 tablet-up:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardMedia className="rounded-xl bg-destructive/10 text-destructive">
                  <ProhibitIcon className="size-4" />
                </CardMedia>
                <CardHeading>
                  <CardTitle>Le rouge est réservé à la destruction</CardTitle>
                  <CardDescription>
                    Supprimer, retirer, abandonner, refuser, se déconnecter.
                  </CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent className="pt-0 text-xs leading-relaxed text-muted-foreground">
                Annuler, fermer, revenir et réinitialiser restent neutres. Dans
                une confirmation, seul le bouton de suppression est rouge.
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardMedia className="rounded-xl bg-muted">
                  <CaretDownIcon className="size-4" />
                </CardMedia>
                <CardHeading>
                  <CardTitle>Ordre des actions en compact</CardTitle>
                  <CardDescription>
                    La confirmation est au-dessus, l’annulation en dessous.
                  </CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent className="pt-0 text-xs leading-relaxed text-muted-foreground">
                Footer en <InlineCode>flex-col-reverse</InlineCode>. Jamais de{" "}
                <InlineCode>flex-1</InlineCode> sur un bouton en colonne.
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardMedia className="rounded-xl bg-muted">
                  <LightningIcon className="size-4" />
                </CardMedia>
                <CardHeading>
                  <CardTitle>Les cartes sont à plat</CardTitle>
                  <CardDescription>
                    Bordure 1 px, rayon <InlineCode>rounded-card</InlineCode>,
                    aucune ombre au repos.
                  </CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent className="pt-0 text-xs leading-relaxed text-muted-foreground">
                L’ombre est réservée aux overlays, aux visuels springboard et aux
                cartes de l’Accueil en sombre.
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardMedia className="rounded-xl bg-muted">
                  <CheckIcon className="size-4" />
                </CardMedia>
                <CardHeading>
                  <CardTitle>Une échelle, pas de valeurs arbitraires</CardTitle>
                  <CardDescription>
                    Typographie Tailwind, espacements 4 px, cibles 44 px.
                  </CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent className="pt-0 text-xs leading-relaxed text-muted-foreground">
                Pas de <InlineCode>text-[Npx]</InlineCode>, pas d’unité{" "}
                <InlineCode>vh</InlineCode> brute. Utiliser les variants{" "}
                <InlineCode>compact</InlineCode> /{" "}
                <InlineCode>tablet-up</InlineCode> /{" "}
                <InlineCode>desktop</InlineCode>.
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          id="colors"
          title="Couleurs"
          description="Tokens sémantiques. Bascule le thème en haut à droite : chaque pastille lit la variable, pas une valeur figée."
        >
          <div className="grid gap-3 tablet-up:grid-cols-3 desktop:grid-cols-4">
            {COLOR_TOKENS.map(({ token, label, text, on }) => (
              <div
                key={token}
                className="rounded-lg border border-border bg-card p-3"
              >
                {text ? (
                  <span
                    className="inline-flex rounded-md px-1.5 text-lg font-semibold"
                    style={{
                      color: `var(${token})`,
                      background: on ? `var(${on})` : undefined,
                    }}
                  >
                    Aa
                  </span>
                ) : (
                  <div
                    className="h-9 rounded-md border border-border"
                    style={{ background: `var(${token})` }}
                  />
                )}
                <p className="mt-2 text-xs font-medium">{label}</p>
                <TokenLabel>{token}</TokenLabel>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="typography"
          title="Typographie"
          description="Geist et Geist Mono. Échelle de design/tokens.json, plancher 12 px."
        >
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {TYPE_SCALE.map(({ label, className, sample }) => (
                <div
                  key={label}
                  className="flex flex-col gap-2 px-5 py-4 tablet-up:flex-row tablet-up:items-baseline tablet-up:justify-between"
                >
                  <span className={className}>{sample}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{label}</Badge>
                    <TokenLabel>{className}</TokenLabel>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Section>

        <Section
          id="spacing"
          title="Espacements, rayons, élévation"
          description="Rythme de 4 px, rayon de carte 34 px, ombres réservées aux overlays."
        >
          <div className="grid gap-3 desktop:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardHeading>
                  <CardTitle>Espacements</CardTitle>
                  <CardDescription>Échelle Tailwind en pixels</CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {SPACING_TOKENS.map(({ token, px, className }) => (
                  <div key={token} className="flex items-center gap-3">
                    <span className="w-8 font-mono text-2xs text-muted-foreground">
                      {token}
                    </span>
                    <div className={`h-2 rounded-full bg-primary ${className}`} />
                    <span className="text-2xs text-muted-foreground">
                      {px} px
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardHeading>
                  <CardTitle>Rayons</CardTitle>
                  <CardDescription>
                    <InlineCode>rounded-card</InlineCode> porte la recette des
                    cartes.
                  </CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {RADIUS_TOKENS.map(({ token, label }) => (
                  <div key={token} className="space-y-1.5">
                    <div
                      className={`size-14 border border-border bg-muted ${token}`}
                    />
                    <TokenLabel>{label}</TokenLabel>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card size="sm" className="desktop:col-span-2">
              <CardHeader>
                <CardHeading>
                  <CardTitle>Élévation</CardTitle>
                  <CardDescription>
                    Plates au repos ; l’ombre sert aux overlays et aux
                    célébrations.
                  </CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-6">
                {[
                  { label: "Carte", className: "shadow-none" },
                  { label: "Flottant", className: "shadow-lg" },
                  { label: "Overlay", className: "shadow-2xl" },
                ].map(({ label, className }) => (
                  <div key={label} className="space-y-1.5">
                    <div
                      className={`grid size-20 place-items-center rounded-2xl border border-border bg-card ${className}`}
                    >
                      <span className="text-2xs text-muted-foreground">
                        {label}
                      </span>
                    </div>
                    <TokenLabel>{className}</TokenLabel>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          id="buttons"
          title="Boutons"
          description="Les variants shadcn couvrent la hiérarchie. Les tailles respectent les cibles tactiles sous 1024 px."
        >
          <Card size="sm">
            <CardHeader>
              <CardHeading>
                <CardTitle>Variants</CardTitle>
                <CardDescription>
                  Une seule action pleine emphase par zone.
                </CardDescription>
              </CardHeading>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button>
                <LightningIcon /> Jouer
              </Button>
              <Button variant="secondary">Secondaire</Button>
              <Button variant="outline">Détails</Button>
              <Button variant="ghost">Plus tard</Button>
              <Button variant="link">
                En savoir plus <ArrowRightIcon />
              </Button>
              <Button variant="destructive">
                <TrashIcon /> Supprimer
              </Button>
              <Button disabled>Désactivé</Button>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardHeading>
                <CardTitle>Tailles</CardTitle>
                <CardDescription>
                  <InlineCode>xs</InlineCode> · <InlineCode>sm</InlineCode> ·{" "}
                  <InlineCode>default</InlineCode> ·{" "}
                  <InlineCode>lg</InlineCode> ·{" "}
                  <InlineCode>icon</InlineCode>
                </CardDescription>
              </CardHeading>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button size="xs">XS</Button>
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Ajouter">
                <LightningIcon />
              </Button>
              <Button size="icon-sm" aria-label="Ajouter (petit)">
                <LightningIcon />
              </Button>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardHeading>
                <CardTitle>Le rouge est réservé à la destruction</CardTitle>
                <CardDescription>
                  Exemples d’actions qui justifient{" "}
                  <InlineCode>variant=&quot;destructive&quot;</InlineCode>.
                </CardDescription>
              </CardHeading>
            </CardHeader>
            <CardContent className="grid gap-2 tablet-up:grid-cols-2">
              {DESTRUCTIVE_ACTIONS.map(({ label, icon: Icon, note }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <Button variant="destructive" size="sm">
                    <Icon /> {label}
                  </Button>
                  <p className="pt-1 text-2xs leading-relaxed text-muted-foreground">
                    {note}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </Section>

        <Section
          id="forms"
          title="Formulaires"
          description="La disposition de référence est FormSection / FormRow. Les champs suivent le contrat tactile : 44 px et 16 px minimum sous 1024."
        >
          <Card size="sm">
            <CardHeader>
              <CardHeading>
                <CardTitle>Field · label · aide · erreur</CardTitle>
                <CardDescription>
                  La description et l’erreur sont associées au champ.
                </CardDescription>
              </CardHeading>
            </CardHeader>
            <CardContent className="grid max-w-4xl gap-6 tablet-up:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="ds-pseudo">Pseudonyme</FieldLabel>
                <Input id="ds-pseudo" placeholder="Nadjim" />
                <FieldDescription>
                  Le nom affiché dans les duels et les classements.
                </FieldDescription>
              </Field>
              <Field data-invalid="true">
                <FieldLabel htmlFor="ds-email">Adresse e-mail</FieldLabel>
                <Input
                  id="ds-email"
                  aria-invalid
                  defaultValue="adresse-invalide"
                />
                <FieldError>Cette adresse e-mail est invalide.</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="ds-langue">Langue</FieldLabel>
                <Select items={LANGUAGES} defaultValue="fr">
                  <SelectTrigger id="ds-langue" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>Langue de l’interface.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="ds-bio">Bio</FieldLabel>
                <Textarea
                  id="ds-bio"
                  rows={3}
                  placeholder="Présente-toi en quelques mots."
                />
                <FieldDescription>160 caractères maximum.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="ds-otp">Code de vérification</FieldLabel>
                <InputOTP
                  id="ds-otp"
                  maxLength={6}
                  containerClassName="justify-start"
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <FieldDescription>
                  Le code expire après 10 minutes.
                </FieldDescription>
              </Field>
              <div className="space-y-3">
                <Label>Interrupteur</Label>
                <div className="flex items-center gap-3">
                  <AnimatedSwitch
                    label="Notifications"
                    checked={notify}
                    onCheckedChange={setNotify}
                  />
                  <span className="text-sm text-muted-foreground">
                    {notify ? "Activées" : "Désactivées"}
                  </span>
                </div>
                <FieldDescription>
                  Un interrupteur par réglage, 44 px de cible.
                </FieldDescription>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section
          id="cards"
          title="Cartes"
          description="La carte est une surface pleine, bordée, sans ombre. L’en-tête est une rangée de 64 px avec visuel, copie et action."
        >
          <div className="grid gap-4 tablet-up:grid-cols-2">
            <Card className="max-w-xl">
              <CardHeader>
                <CardMedia className="rounded-xl bg-muted">
                  <LightningIcon className="size-4" />
                </CardMedia>
                <CardHeading>
                  <CardTitle>Culture générale</CardTitle>
                  <CardDescription>
                    12 questions · difficulté normale
                  </CardDescription>
                </CardHeading>
                <CardAction>
                  <Badge variant="secondary">Nouveau</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Surface pleine, bordure <InlineCode>--border</InlineCode>,
                  rayon <InlineCode>rounded-card</InlineCode>.
                </p>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span>Entraînement</span>
                  <AnimatedSwitch defaultChecked label="Entraînement" />
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm">Jouer</Button>
                <Button size="sm" variant="outline">
                  Détails
                </Button>
              </CardFooter>
            </Card>

            <Card interactive className="max-w-xl">
              <CardHeader>
                <CardMedia className="rounded-xl bg-muted">
                  <ArrowRightIcon className="size-4" />
                </CardMedia>
                <CardHeading>
                  <CardTitle>Carte interactive</CardTitle>
                  <CardDescription>
                    Hover <InlineCode>--surface-muted</InlineCode>, bordure
                    inchangée.
                  </CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                Utiliser <InlineCode>CARD_INTERACTIVE_CLASS</InlineCode> ou la
                prop <InlineCode>interactive</InlineCode>. Jamais{" "}
                <InlineCode>hover:bg-muted/50</InlineCode> : le motif de page
                traverserait le fond.
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          id="controls"
          title="Contrôles et navigation"
          description="Tabs beui, toggle, badges, progression, skeletons. Les onglets shadcn et l’interrupteur shadcn sont bannis au profit des composants de l’app."
        >
          <div className="grid gap-4 tablet-up:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardHeading>
                  <CardTitle>Onglets beui</CardTitle>
                  <CardDescription>
                    Indicateur animé partagé, scroll horizontal intégré.
                  </CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent>
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList>
                    <TabsTrigger value="overview">Vue d’ensemble</TabsTrigger>
                    <TabsTrigger value="games">Parties</TabsTrigger>
                    <TabsTrigger value="stats">Stats</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview">
                    <p className="text-sm text-muted-foreground">
                      Le panneau suit l’onglet actif avec un fondu court.
                    </p>
                  </TabsContent>
                  <TabsContent value="games">
                    <p className="text-sm text-muted-foreground">
                      Les listes et filtres vivent dans l’onglet.
                    </p>
                  </TabsContent>
                  <TabsContent value="stats">
                    <p className="text-sm text-muted-foreground">
                      Les barres V/N/D restent dans le bandeau.
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardHeading>
                  <CardTitle>Filtres et badges</CardTitle>
                  <CardDescription>
                    Toggle pour un filtre, Badge pour un état court.
                  </CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Toggle aria-label="Filtrer les sujets">
                    <MagnifyingGlassIcon /> Filtres
                  </Toggle>
                  <Toggle variant="outline" aria-label="Vue compacte">
                    <LightningIcon /> Compact
                  </Toggle>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>Nouveau</Badge>
                  <Badge variant="secondary">Suivi</Badge>
                  <Badge variant="outline">Archivé</Badge>
                  <Badge variant="destructive">Suspendu</Badge>
                </div>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardHeading>
                  <CardTitle>Progression</CardTitle>
                  <CardDescription>
                    Libellé, valeur et piste accessible.
                  </CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent>
                <Progress value={64}>
                  <ProgressLabel>Maîtrise du sujet</ProgressLabel>
                  <ProgressValue />
                </Progress>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardHeading>
                  <CardTitle>Chargement</CardTitle>
                  <CardDescription>
                    Skeleton pulsé, sans texte.
                  </CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          id="overlays"
          title="Overlays"
          description="AppDialog pour une décision, bottom sheet Arc pour une tâche secondaire, toast pour une confirmation."
        >
          <Card size="sm">
            <CardContent className="flex flex-wrap items-center gap-3 p-5">
              <Button variant="outline" onClick={() => setDialogOpen(true)}>
                Ouvrir un dialogue
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(true)}>
                Ouvrir une bottom sheet
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  showToast({
                    tone: "success",
                    title: "Réglages enregistrés",
                    description: "Ton profil est à jour.",
                  })
                }
              >
                Afficher un toast
              </Button>
            </CardContent>
          </Card>

          <AppDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title="Supprimer la notification"
            sub="Cette action est définitive."
            sheetOnTouch
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDialogOpen(false)}
                >
                  Supprimer
                </Button>
              </>
            }
          >
            <p className="text-sm text-muted-foreground">
              Le dialogue est centré sur desktop et devient une bottom sheet en
              tactile via <InlineCode>sheetOnTouch</InlineCode>.
            </p>
          </AppDialog>

          <BottomSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            title="Filtres"
            description="Affine la liste des sujets."
            detents={[0.45, 0.92]}
            initialDetent={1}
            footer={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSheetOpen(false)}
                >
                  Réinitialiser
                </Button>
                <Button className="flex-1" onClick={() => setSheetOpen(false)}>
                  Voir les résultats
                </Button>
              </div>
            }
          >
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Glisse la feuille pour changer de detent. Le footer reste
                épinglé sous le contenu.
              </p>
              <Field>
                <FieldLabel htmlFor="ds-sheet-search">Recherche</FieldLabel>
                <Input id="ds-sheet-search" placeholder="Nom du sujet" />
              </Field>
            </div>
          </BottomSheet>
        </Section>

        <Section
          id="shell"
          title="Shell et surfaces"
          description="Le canvas de contenu reprend la surface de la sidebar en clair et --background en sombre ; la topbar et les cartes restent claires."
        >
          <Card size="sm" className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 text-xs text-muted-foreground">
              <span>
                Canvas <TokenLabel>--qu-shell-bg</TokenLabel> · tuile{" "}
                <TokenLabel>--qu-shell-pattern-size</TokenLabel>
              </span>
              <span>
                clair : 374 px / 5 % · sombre : 374 px / 8 %
              </span>
            </div>
            <div className="relative overflow-hidden bg-[var(--qu-shell-bg)] p-4">
              <PagePattern size="var(--qu-shell-pattern-size)" />
              <div className="relative z-10 overflow-hidden rounded-card border border-border bg-background/80 shadow-sm backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <LightningIcon className="size-3.5 fill-current" />
                    </span>
                    <span className="text-sm font-semibold">Joutio</span>
                  </div>
                  <Badge variant="outline">Accueil</Badge>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-[150px_1fr]">
                  <div className="hidden rounded-lg border border-border bg-sidebar p-3 text-xs text-muted-foreground sm:block">
                    <p className="font-medium text-foreground">Sidebar</p>
                    <p className="mt-1">Surface dédiée</p>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-sm font-semibold">
                        Carte sur le canvas de contenu
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Le motif est un masque décoratif : il ne capte aucun
                        clic et reste sous le contenu.
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-sm font-semibold">
                        Topbar : surface pleine → verre
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <InlineCode>data-scrolled</InlineCode> active le verre
                        dépoli dès que le contenu passe dessous (seuil 8 px) ;
                        la nav basse reste en verre permanent.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Section>

        <Section
          id="parity"
          title="Parité mobile"
          description="Même rôle, même hiérarchie : le web shadcn et joutio-mobile partagent les tokens, pas les primitives."
        >
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Web</th>
                  <th className="px-4 py-3 font-medium">Mobile</th>
                  <th className="px-4 py-3 font-medium">Règle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOBILE_PARITY.map((row) => (
                  <tr key={row.web}>
                    <td className="px-4 py-3 font-mono text-xs">{row.web}</td>
                    <td className="px-4 py-3 text-xs">{row.mobile}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {row.rule}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          id="responsive"
          title="Contrat responsive"
          description="Trois classes, une source unique : shared/theme/tokens.ts et les variants CSS."
        >
          <div className="grid gap-3 tablet-up:grid-cols-3">
            {[
              {
                label: "compact",
                value: "< 640 px",
                note: "Nav basse, modales plein écran, bottom sheets.",
              },
              {
                label: "tablet",
                value: "640 – 1023 px",
                note: "Sidebar en rail, cibles 44 px, sheets conservés.",
              },
              {
                label: "desktop",
                value: "≥ 1024 px",
                note: "Sidebar étendue, densité compacte.",
              },
            ].map(({ label, value, note }) => (
              <Card key={label} size="sm">
                <CardHeader>
                  <CardHeading>
                    <CardTitle>{label}</CardTitle>
                    <CardDescription>{value}</CardDescription>
                  </CardHeading>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  {note}
                </CardContent>
              </Card>
            ))}
          </div>
          <Card size="sm">
            <CardContent className="space-y-2 p-5 text-xs leading-relaxed text-muted-foreground">
              <p>
                Cibles tactiles : <strong>44 px</strong> sous 1024 via{" "}
                <InlineCode>--control-h-*</InlineCode>. Champs :{" "}
                <strong>16 px</strong> minimum pour éviter le zoom iOS.
              </p>
              <p>
                Gouttières : <InlineCode>--page-gutter-x</InlineCode>. Topbar :{" "}
                <InlineCode>--topbar-h</InlineCode>. Typo : jamais de valeur
                arbitraire, plancher <InlineCode>text-2xs</InlineCode> (11 px).
              </p>
            </CardContent>
          </Card>
        </Section>

        <footer className="border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
          Page de développement, accessible uniquement via{" "}
          <code className="font-mono">/design-system</code> et exclue du routage
          de production. La galerie mobile équivalente est accessible dans
          l’application via Réglages → Développement → Galerie design.
        </footer>
      </main>
    </div>
  )
}
