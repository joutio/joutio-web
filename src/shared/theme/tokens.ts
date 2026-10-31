/**
 * Pointeurs vers les variables CSS.
 * Utilisés dans les `style={{}}` de la maquette. À l'intégration shadcn, ces styles
 * inline deviennent des classes Tailwind (`bg-primary`, `text-muted-foreground`, …)
 * qui pointent exactement sur les mêmes variables : rien à re-mapper.
 */
export const TOKEN = {
  bg: "var(--background)",
  fg: "var(--foreground)",
  card: "var(--card)",
  popover: "var(--popover)",
  primary: "var(--primary)",
  primaryFg: "var(--primary-foreground)",
  secondary: "var(--secondary)",
  muted: "var(--muted)",
  mutedFg: "var(--muted-foreground)",
  accent: "var(--accent)",
  accentInk: "var(--accent-ink)",
  destructive: "var(--destructive)",
  border: "var(--border)",
  ring: "var(--ring)",
  sidebar: "var(--sidebar)",
  sidebarBorder: "var(--sidebar-border)",
  sidebarAccent: "var(--sidebar-accent)",
  duelBg: "var(--duel-bg)",
  duelSurface: "var(--duel-surface)",
  duelSurfaceFg: "var(--duel-surface-foreground)",
  duelSurfaceMuted: "var(--duel-surface-muted)",
  duelSurfaceMutedFg: "var(--duel-surface-muted-foreground)",
  correct: "var(--duel-correct)",
  correctAccent: "var(--duel-correct-accent)",
  correctFg: "var(--duel-correct-foreground)",
  wrong: "var(--duel-wrong)",
  wrongAccent: "var(--duel-wrong-accent)",
  wrongFg: "var(--duel-wrong-foreground)",
  gauge: "var(--duel-gauge)",
  gaugeTrack: "var(--duel-gauge-track)",
  score: "var(--duel-score)",
  timer: "var(--duel-timer)",
  timerUrgent: "var(--duel-timer-urgent)",
  fontSans: "var(--font-sans)",
  fontDisplay: "var(--font-display)",
} as const

/** Rayons du design system (`design/tokens.json`). */
export const RADIUS = {
  xs: "var(--radius-xs)",
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
} as const

/** Voile translucide à partir d'une couleur quelconque (hex de sujet ou variable CSS). */
export const veil = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`

/**
 * Contrat device (source unique, miroir des variants CSS `compact`/`tablet`/`desktop`) :
 * - `compact`  : < 640 px  → nav basse, modales plein écran, bottom sheets, 1-2 colonnes
 * - `tablet`   : 640-1023 px → sidebar en rail replié, 2-3 colonnes
 * - `desktop`  : >= 1024 px → sidebar étendue, densité compacte
 * Détail : `best-practices/.frontend/responsive-sizing.md`.
 */
export const DEVICE = {
  compact: 640,
  desktop: 1024,
} as const

/** Durée du repli/dépli du chrome haut (miroir de `--qu-chrome-motion-duration`). */
export const CHROME_MOTION_MS = 250
