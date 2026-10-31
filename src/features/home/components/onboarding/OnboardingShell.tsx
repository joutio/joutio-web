import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { JoutioMark } from "@/shared/components/joutio-mark"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface OnboardingShellProps {
  step: 0 | 1
  secondaryLabel?: string
  onSecondary?: () => void
  secondaryDisabled?: boolean
  children: ReactNode
  preview?: ReactNode
  footer: ReactNode
}

/**
 * Coquille de la page `/onboarding`, calquée sur `AvatarEditorPage` : header et footer
 * **sticky**, seul le contenu défile. Le header porte la progression et l'action secondaire
 * (« Passer », « Explorer », « Continuer vers ma page ») ; le footer ne porte qu'une action
 * principale, pleine largeur en compact.
 */
export function OnboardingShell({
  step,
  secondaryLabel,
  onSecondary,
  secondaryDisabled = false,
  children,
  preview,
  footer,
}: OnboardingShellProps) {
  const { t } = useTranslation()
  const current = step + 1

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/85 pt-[var(--qu-safe-top)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-(--page-gutter-x) py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <JoutioMark className="size-7" />
              <span className="text-sm font-semibold">Joutio</span>
            </div>
            {secondaryLabel && onSecondary && (
              <Button
                variant="ghost"
                size="sm"
                disabled={secondaryDisabled}
                onClick={onSecondary}
              >
                {secondaryLabel}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
              {t("home.onboarding.stepLabel", { current, total: 2 })}
            </span>
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={t("home.onboarding.stepperLabel")}
              aria-valuemin={1}
              aria-valuemax={2}
              aria-valuenow={current}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${(current / 2) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div
          className={cn(
            "mx-auto grid w-full max-w-[1200px] gap-10 px-(--page-gutter-x) py-8 pb-[calc(6rem+var(--qu-safe-bottom))] desktop:pb-12",
            preview
              ? "desktop:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] desktop:items-start"
              : "max-w-[640px]"
          )}
        >
          <div className="w-full max-w-[600px] min-w-0 justify-self-center desktop:justify-self-start">
            {children}
          </div>
          {preview && (
            <aside className="hidden min-w-0 desktop:block" aria-hidden>
              {preview}
            </aside>
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 z-20 border-t bg-background/70 pb-[var(--qu-safe-bottom)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-end px-(--page-gutter-x) py-3">
          <div className="w-full compact:w-full desktop:w-auto desktop:min-w-[260px]">
            {footer}
          </div>
        </div>
      </footer>
    </div>
  )
}
