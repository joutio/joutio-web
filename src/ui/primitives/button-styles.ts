/** Hiérarchie visuelle inspirée d'iOS, partagée par Button et IconButton. */
export const BUTTON_VARIANTS = ['filled', 'tinted', 'gray', 'plain'] as const
export const BUTTON_TONES = ['accent', 'neutral', 'destructive'] as const

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number]
export type ButtonTone = (typeof BUTTON_TONES)[number]

// Les couleurs vivent dans les variantes composées : variant et tone ne stylent rien seuls.
export const buttonVariantAxes = {
  variant: { filled: '', tinted: '', gray: '', plain: '' },
  tone: { accent: '', neutral: '', destructive: '' },
}

export const buttonCompoundVariants = [
  { variant: 'filled', tone: 'accent', className: 'bg-jo-accent text-jo-on-accent jo-pressed:bg-jo-accent-press' },
  { variant: 'filled', tone: 'neutral', className: 'bg-jo-text text-jo-bg jo-pressed:brightness-90' },
  { variant: 'filled', tone: 'destructive', className: 'bg-jo-wrong text-jo-on-wrong jo-pressed:brightness-90' },
  { variant: 'tinted', tone: 'accent', className: 'bg-jo-accent/16 text-jo-accent-ink jo-pressed:bg-jo-accent/28' },
  { variant: 'tinted', tone: 'neutral', className: 'bg-jo-text/10 text-jo-text jo-pressed:bg-jo-text/20' },
  { variant: 'tinted', tone: 'destructive', className: 'bg-jo-wrong/16 text-jo-wrong jo-pressed:bg-jo-wrong/28' },
  { variant: 'gray', tone: 'accent', className: 'bg-jo-raised text-jo-accent-ink jo-pressed:bg-jo-hover' },
  { variant: 'gray', tone: 'neutral', className: 'bg-jo-raised text-jo-text jo-pressed:bg-jo-hover' },
  { variant: 'gray', tone: 'destructive', className: 'bg-jo-raised text-jo-wrong jo-pressed:bg-jo-hover' },
  { variant: 'plain', tone: 'accent', className: 'text-jo-accent-ink jo-pressed:opacity-50' },
  { variant: 'plain', tone: 'neutral', className: 'text-jo-text jo-pressed:opacity-50' },
  { variant: 'plain', tone: 'destructive', className: 'text-jo-wrong jo-pressed:opacity-50' },
] as const
