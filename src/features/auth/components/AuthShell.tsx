import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { JoutioMark } from "@/shared/components/joutio-mark"
import { HexagonBackground } from "@/components/animate-ui/components/backgrounds/hexagon"

/**
 * Layout des écrans d'auth (blocs shadcn `login-02` / `signup-02`) : formulaire à gauche,
 * visuel de couverture à droite (masqué en mobile). La couverture est toujours sombre
 * (tokens duel) pour rester lisible en thème clair comme sombre, sur un fond en nid d'abeille.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh w-full">
      <div className="flex min-w-0 flex-1 flex-col p-6 tablet-up:p-10">
        <div className="flex items-center justify-center gap-2 tablet-up:justify-start">
          <JoutioMark className="size-7" />
          <span className="text-sm font-semibold">Joutio</span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[320px]">{children}</div>
        </div>
      </div>

      <div
        className="relative hidden flex-col items-center justify-center overflow-hidden border-l desktop:flex"
        style={{ flex: "0 0 46%", backgroundColor: "var(--duel-bg)" }}
      >
        <HexagonBackground
          aria-hidden
          className="absolute inset-0 bg-[var(--duel-bg)] dark:bg-[var(--duel-bg)]"
          hexagonSize={64}
          hexagonMargin={2}
          hexagonProps={{
            className:
              "before:bg-white/10 after:bg-[var(--duel-bg)] " +
              "hover:before:bg-white/20 hover:after:bg-[var(--duel-bg)] " +
              "dark:before:bg-white/10 dark:after:bg-[var(--duel-bg)] " +
              "dark:hover:before:bg-white/20 dark:hover:after:bg-[var(--duel-bg)]",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-[18px] p-10 text-center">
          <JoutioMark className="size-32" />
          <div className="font-heading text-2xl font-bold tracking-[-0.03em] text-[var(--duel-surface)]">
            {t("shell.brand.tagline")}
          </div>
          <p className="max-w-[34ch] text-sm leading-relaxed text-[var(--duel-surface-muted)]">
            {t("auth.shell.hero")}
          </p>
        </div>
      </div>
    </div>
  )
}
