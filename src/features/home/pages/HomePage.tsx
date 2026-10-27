import type { ReactNode } from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { PageContainer } from "@/features/shell"
import { usePreloadImages } from "@/shared/hooks/usePreloadImages"
import { SectionHeader } from "../components/section-header"
import { TopicCarousel } from "@/features/topics"
import { useHome } from "../hooks/useHome"

function Section({
  title,
  actionLabel,
  compactActionLabel,
  onAction,
  children,
}: {
  title: string
  actionLabel?: string
  compactActionLabel?: string
  onAction?: () => void
  children: ReactNode
}) {
  return (
    <section className="mb-8 compact:mb-6">
      <SectionHeader
        title={title}
        actionLabel={actionLabel}
        compactActionLabel={compactActionLabel}
        onAction={onAction}
      />
      {children}
    </section>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useHome()

  const followedTopics = data?.followedTopics ?? []
  const trendingTopics = data?.trendingTopics ?? []
  const newTopics = data?.newTopics ?? []
  const recommendedTopics = data?.recommendedTopics ?? []

  // Visuels des premières cartes préchargés en priorité basse (navigation instantanée ensuite).
  // Les rails paysage utilisent la bannière quand elle existe ; le Top 10 utilise la couverture.
  const preloadUrls = useMemo(
    () => [
      ...(data?.trendingTopics ?? []).map((topic) => topic.imageUrl),
      ...(data?.followedTopics ?? []).map(
        (topic) => topic.bannerUrl ?? topic.imageUrl
      ),
      ...(data?.newTopics ?? []).map(
        (topic) => topic.bannerUrl ?? topic.imageUrl
      ),
      ...(data?.recommendedTopics ?? []).map(
        (topic) => topic.bannerUrl ?? topic.imageUrl
      ),
    ],
    [
      data?.trendingTopics,
      data?.followedTopics,
      data?.newTopics,
      data?.recommendedTopics,
    ]
  )
  usePreloadImages(preloadUrls, { limit: 8, priority: "low" })

  return (
    <PageContainer>
      {/* Top 10. Masquée quand la fenêtre 24 h est vide et que le relais all-time
          n'apporte rien ; le chargement et l'erreur (avec « Réessayer ») restent visibles. */}
      {!(data && trendingTopics.length === 0) && (
        <Section
          title={t("home.trending.title")}
          actionLabel={t("home.trending.browse")}
          compactActionLabel={t("home.trending.browseCompact")}
          onAction={() => void navigate("/topics?sort=MOST_PLAYED")}
        >
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              {t("common.app.loading")}
            </p>
          ) : isError ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {t("home.trending.error")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                {t("home.trending.retry")}
              </Button>
            </div>
          ) : (
            <TopicCarousel
              topics={trendingTopics}
              onOpen={(id) => void navigate(`/topics/${id}`)}
              label={t("home.trending.title")}
              format="poster"
              ranked
            />
          )}
        </Section>
      )}

      {/* Section masquée tant que l'utilisateur n'a suivi aucun sujet (pas d'état vide). */}
      {!isLoading && followedTopics.length > 0 && (
        <Section
          title={t("home.followedTopics.title")}
          actionLabel={t("home.seeAll")}
          onAction={() => void navigate("/topics?followed=true")}
        >
          <TopicCarousel
            topics={followedTopics}
            onOpen={(id) => void navigate(`/topics/${id}`)}
            label={t("home.followedTopics.title")}
            format="landscape"
          />
        </Section>
      )}

      <Section
        title={t("home.newTopics.title")}
        actionLabel={t("home.seeAll")}
        onAction={() => void navigate("/topics?sort=RECENT")}
      >
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            {t("common.app.loading")}
          </p>
        ) : newTopics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("home.newTopics.empty")}
          </p>
        ) : (
          <TopicCarousel
            topics={newTopics}
            onOpen={(id) => void navigate(`/topics/${id}`)}
            label={t("home.newTopics.title")}
            format="landscape"
          />
        )}
      </Section>

      {/* Sélection personnalisée issue des centres d'intérêt persistés, affichée après les
          nouveautés. Masquée sans intérêt ou sans sujet jouable. */}
      {!isLoading && recommendedTopics.length > 0 && (
        <Section title={t("home.forYou.title")}>
          <TopicCarousel
            topics={recommendedTopics}
            onOpen={(id) => void navigate(`/topics/${id}`)}
            label={t("home.forYou.title")}
            format="landscape"
          />
        </Section>
      )}
    </PageContainer>
  )
}
