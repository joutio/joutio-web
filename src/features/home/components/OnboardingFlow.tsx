import { useEffect, useRef, useState } from "react"
import { CircleNotchIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useCompleteOnboarding } from "../hooks/useCompleteOnboarding"
import { useOnboardingRecommendations } from "../hooks/useOnboardingRecommendations"
import { FirstDuelStep } from "./onboarding/FirstDuelStep"
import { OnboardingPreview } from "./onboarding/OnboardingPreview"
import { OnboardingShell } from "./onboarding/OnboardingShell"
import { InterestProfileForm } from "@/features/topics"
import { useStartBotGame } from "@/features/rooms"
import { useUpdateInterests } from "@/features/shell"
import { isRoomTarget, sanitizeReturnTo } from "@/lib/onboarding"
import { trackProductEvent } from "@/lib/telemetry"

const MAX_INTERESTS = 3

interface OnboardingFlowProps {
  returnTo?: string | null
  /** Intérêts déjà persistés (reprise d'un parcours interrompu). */
  initialInterests?: string[]
}

/**
 * Parcours de premier compte en 2 étapes : centres d'intérêt (1-3 univers + univers principal),
 * puis thème recommandé et premier duel **contre un bot** (sans Elo ni XP). Les intérêts sont
 * persistés dans le profil avant la fin de l'onboarding et alimentent le rail « Pour toi ».
 */
export function OnboardingFlow({
  returnTo,
  initialInterests,
}: OnboardingFlowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const updateInterests = useUpdateInterests()
  const completeOnboarding = useCompleteOnboarding()
  const startBot = useStartBotGame()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [step, setStep] = useState<0 | 1>(0)
  const [interests, setInterests] = useState<string[]>(
    () => initialInterests ?? []
  )
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recommendations = useOnboardingRecommendations(interests)
  const topics = recommendations.data ?? []
  const selectedTopic =
    topics.find((topic) => topic.topicId === selectedTopicId) ??
    topics[0] ??
    null
  const recommendationsLoading = recommendations.isPending
  const recommendationsError = recommendations.isError

  const target = sanitizeReturnTo(returnTo)
  const roomTarget = isRoomTarget(target)
  const hasTarget = !!target && target !== "/"
  const busy =
    updateInterests.isPending ||
    completeOnboarding.isPending ||
    startBot.isPending
  const displayError =
    error ?? (startBot.isError ? t("home.onboarding.startError") : null)

  useEffect(() => {
    trackProductEvent("onboarding_started")
  }, [])

  // Le contenu est la seule zone scrollable : au changement d'étape, on repart du titre
  // (sinon le nouvel écran s'ouvre au milieu, hérité du scroll de l'étape précédente).
  useEffect(() => {
    window.scrollTo(0, 0)
    headingRef.current?.focus({ preventScroll: true })
  }, [step])

  async function complete(startDuel: boolean) {
    if (busy) return
    if (startDuel && !selectedTopic) {
      setError(t("home.onboarding.noTopics"))
      return
    }
    setError(null)

    // Persiste le profil avant le flag de fin : le rail « Pour toi » et la recommandation
    // partagent ainsi la même source de vérité. On enregistre aussi une liste vide si des
    // intérêts existaient déjà (l'utilisateur les a retirés), pour ne pas les laisser en base.
    const persistInterests =
      interests.length > 0 || (initialInterests?.length ?? 0) > 0

    try {
      if (persistInterests) {
        await updateInterests.mutateAsync(interests)
      }
      await completeOnboarding.mutateAsync(
        persistInterests ? { interests } : undefined
      )
    } catch {
      setError(t("home.onboarding.saveError"))
      return
    }

    trackProductEvent(
      startDuel ? "onboarding_completed" : "onboarding_skipped",
      startDuel ? { mode: "bot", first: "true" } : {}
    )

    if (roomTarget && target) {
      void navigate(target, { replace: true })
      return
    }

    if (startDuel && selectedTopic) {
      trackProductEvent("duel_start_requested", { mode: "bot", first: "true" })
      startBot.mutate({ topicId: selectedTopic.topicId, difficulty: "NORMAL" })
      return
    }

    void navigate(target ?? "/", { replace: true })
  }

  const secondaryLabel =
    step === 0
      ? roomTarget
        ? t("home.onboarding.joinRoom")
        : t("home.onboarding.skip")
      : roomTarget
        ? undefined
        : hasTarget
          ? t("home.onboarding.continue")
          : t("home.onboarding.explore")

  const footer =
    step === 0 ? (
      <Button
        size="lg"
        className="w-full"
        disabled={interests.length === 0 || busy}
        onClick={() => setStep(1)}
      >
        {t("home.onboarding.seeTheme")}
      </Button>
    ) : roomTarget ? (
      <Button
        size="lg"
        className="w-full"
        disabled={busy}
        onClick={() => void complete(false)}
      >
        {busy && <CircleNotchIcon className="size-4 animate-spin" aria-hidden />}
        {t("home.onboarding.joinRoom")}
      </Button>
    ) : recommendationsLoading ? (
      <Button size="lg" className="w-full" disabled>
        <CircleNotchIcon className="size-4 animate-spin" aria-hidden />
        {t("home.onboarding.loadingRecommendations")}
      </Button>
    ) : recommendationsError ? (
      <Button
        size="lg"
        className="w-full"
        onClick={() => void recommendations.refetch()}
      >
        {t("home.onboarding.retry")}
      </Button>
    ) : topics.length === 0 ? (
      <Button
        size="lg"
        className="w-full"
        disabled={busy}
        onClick={() => void complete(false)}
      >
        {busy && <CircleNotchIcon className="size-4 animate-spin" aria-hidden />}
        {t("home.onboarding.explore")}
      </Button>
    ) : (
      <Button
        size="lg"
        className="w-full"
        disabled={busy || !selectedTopic}
        onClick={() => void complete(true)}
      >
        {busy && <CircleNotchIcon className="size-4 animate-spin" aria-hidden />}
        {startBot.isError
          ? t("home.onboarding.retry")
          : busy
            ? t("home.onboarding.starting")
            : t("home.onboarding.start")}
      </Button>
    )

  return (
    <OnboardingShell
      step={step}
      secondaryLabel={secondaryLabel}
      onSecondary={() => void complete(false)}
      secondaryDisabled={busy}
      preview={
        <OnboardingPreview
          step={step}
          interests={interests}
          topic={selectedTopic}
        />
      }
      footer={footer}
    >
      {step === 0 ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-accent-ink uppercase">
              {t("home.onboarding.welcome")}
            </p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="type-large-title outline-none"
            >
              {t("home.onboarding.interestsTitle")}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("home.onboarding.interestsSubtitle")}
            </p>
          </div>

          <InterestProfileForm
            value={interests}
            onChange={setInterests}
            min={1}
            max={MAX_INTERESTS}
            disabled={busy}
          />

          {displayError && (
            <p className="text-sm text-destructive" role="alert">
              {displayError}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-accent-ink uppercase">
              {t("home.onboarding.firstDuelEyebrow")}
            </p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="type-large-title outline-none"
            >
              {t("home.onboarding.firstDuelTitle")}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("home.onboarding.firstDuelSubtitle")}
            </p>
          </div>

          <FirstDuelStep
            interests={interests}
            topics={topics}
            selectedTopicId={selectedTopicId}
            onSelect={setSelectedTopicId}
            loading={recommendationsLoading}
            error={recommendationsError}
            onRetry={() => void recommendations.refetch()}
          />

          {displayError && (
            <p className="text-sm text-destructive" role="alert">
              {displayError}
            </p>
          )}
        </div>
      )}
    </OnboardingShell>
  )
}
