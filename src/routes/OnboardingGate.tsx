import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import { useTranslation } from "react-i18next"
import { useMe } from "@/features/shell"
import { endSession } from "@/features/auth"
import { hasCompletedOnboarding, isRoomFlowPath } from "@/lib/onboarding"

/**
 * Le parcours room/game est prioritaire : un invité non onboardé peut rejoindre sa salle et
 * jouer sa première partie. L'onboarding n'est déclenché qu'en sortant de ce parcours.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const location = useLocation()
  const roomFlow = isRoomFlowPath(location.pathname)
  const { data: me, isLoading, isFetching, isError, refetch } = useMe()

  // Un invité doit pouvoir entrer immédiatement dans sa room, sans attendre /api/me.
  if (roomFlow) return children

  // Après une partie, le cache `me` peut être encore à « stats 0 » pendant le refetch : on
  // attend la réponse avant de renvoyer un joueur qui vient justement de terminer son duel.
  if (isLoading || (isFetching && !hasCompletedOnboarding(me))) {
    return (
      <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">
        {t("common.app.loading")}
      </div>
    )
  }

  if (isError || !me) {
    return (
      <div className="grid min-h-svh place-items-center p-6">
        <EmptyState
          title={t("home.onboarding.loadError")}
          description={t("home.onboarding.loadError")}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => void endSession("unknownUser")}
            >
              {t("auth.login.sessionReset")}
            </Button>
            <Button variant="ghost" onClick={() => void refetch()}>
              {t("home.onboarding.retry")}
            </Button>
          </div>
        </EmptyState>
      </div>
    )
  }

  if (!hasCompletedOnboarding(me)) {
    const returnTo = `${location.pathname}${location.search}`
    return (
      <Navigate
        to={`/onboarding?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    )
  }

  return children
}
