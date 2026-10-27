import { useTranslation } from "react-i18next"
import { Hourglass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import { useGoBack } from "@/shared/hooks/useGoBack"
import { PageContainer } from "./PageContainer"

/**
 * Écran « Bientôt disponible » : feature temporairement désactivée (`shared/feature-flags.ts`).
 * Affiché à la place des pages de l'atelier sujet tant qu'il est coupé pour le MVP.
 */
export function ComingSoonPage() {
  const { t } = useTranslation()
  const goBack = useGoBack("/topics")

  return (
    <PageContainer>
      <EmptyState
        icon={<Hourglass className="size-6 text-muted-foreground" />}
        title={t("shell.comingSoon.title")}
        description={t("shell.comingSoon.description")}
      >
        <Button variant="outline" onClick={goBack}>
          {t("shell.comingSoon.back")}
        </Button>
      </EmptyState>
    </PageContainer>
  )
}
