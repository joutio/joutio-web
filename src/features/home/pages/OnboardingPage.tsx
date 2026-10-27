import { useTranslation } from "react-i18next"
import { Navigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import { useMe } from "@/features/shell"
import { endSession } from "@/features/auth"
import { OnboardingFlow } from "../components/OnboardingFlow"
import { hasCompletedOnboarding, sanitizeReturnTo } from "@/lib/onboarding"

/** Route dédiée du premier compte ; le shell applicatif n'est pas monté pendant le flow. */
export function OnboardingPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const returnTo = sanitizeReturnTo(params.get("returnTo"))
  const { data: me, isLoading: meLoading, isError: meError, refetch } = useMe()

  if (hasCompletedOnboarding(me)) {
    return <Navigate to={returnTo ?? "/"} replace />
  }

  if (meLoading) {
    return (
      <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">
        {t("common.app.loading")}
      </div>
    )
  }

  if (meError || !me) {
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

  return (
    <OnboardingFlow returnTo={returnTo} initialInterests={me.interests ?? []} />
  )
}
