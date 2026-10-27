import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Zap } from "lucide-react"

interface LegalShellProps {
  title: string
  updatedAt: string
  children: ReactNode
}

/**
 * Layout public des pages légales (confidentialité, conditions d'utilisation).
 * Accessible sans authentification : ces URLs sont exigées par les consoles
 * Meta / Google pour la publication de l'application.
 */
export function LegalShell({ title, updatedAt, children }: LegalShellProps) {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-foreground">
              <Zap
                size={15}
                className="text-background"
                fill="currentColor"
                strokeWidth={0}
              />
            </span>
            <span className="text-sm font-semibold">Joutio</span>
          </Link>
          <Link
            to="/login"
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Retour à la connexion
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="font-heading text-3xl font-extrabold tracking-[-0.02em]">
          {title}
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Dernière mise à jour : {updatedAt}
        </p>
        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-foreground/90">
          {children}
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-6 text-xs text-muted-foreground">
          <Link to="/privacy" className="underline underline-offset-2">
            Politique de confidentialité
          </Link>
          <Link to="/terms" className="underline underline-offset-2">
            Conditions d&apos;utilisation
          </Link>
          <Link to="/data-deletion" className="underline underline-offset-2">
            Suppression des données
          </Link>
          <span>Contact : joutio.contacts@gmail.com</span>
        </div>
      </footer>
    </div>
  )
}

interface LegalSectionProps {
  id?: string
  title: string
  children: ReactNode
}

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-2">
      <h2 className="font-heading text-lg font-bold">{title}</h2>
      {children}
    </section>
  )
}
