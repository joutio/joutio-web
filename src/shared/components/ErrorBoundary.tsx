import { Component, type ErrorInfo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { reportClientError } from "@/lib/telemetry"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

/** Repli localisé (fonction : accès au hook de traduction). */
function ErrorFallback({ error }: { error?: Error }) {
  const { t } = useTranslation()
  return (
    <div className="grid min-h-svh place-items-center bg-background p-6 text-center">
      <div className="flex max-w-md flex-col items-center gap-3">
        <h1 className="font-heading text-xl font-extrabold">
          {t("shell.error.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {error?.message ?? t("shell.error.fallback")}
        </p>
        <Button onClick={() => window.location.reload()}>
          {t("shell.error.reload")}
        </Button>
      </div>
    </div>
  )
}

/** Filet de sécurité UI : évite l'écran blanc en cas d'erreur de rendu. */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[UI] Unhandled render error", error, info)
    reportClientError(error, {
      type: "REACT_RENDER",
      componentStack: info.componentStack ?? undefined,
      source: "ErrorBoundary",
    })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}
