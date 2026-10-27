import { useTranslation } from "react-i18next"
import { CalendarCheck } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeading,
  CardMedia,
  CardTitle,
} from "@/components/ui/card"
import { StatStrip } from "@/shared/components/stat-strip"
import { StreakCalendar } from "@/components/ui/streak-calendar"
import { useProfileActivity } from "@/features/player"
import { useLocale } from "@/lib/i18n/useLocale"

/**
 * Section « Série de présence » du profil : série courante, record et calendrier des jours
 * actifs. La série est **effective à la date de la requête** : un jour manqué la remet à zéro
 * côté backend, même sans nouvelle partie.
 */
export function StreakSection({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { data, isLoading } = useProfileActivity(userId)

  if (isLoading || !data) return null

  const periods = data.days.map((day) => ({
    periodStart: day.date,
    periodEnd: day.date,
  }))

  return (
    <section className="mb-8">
      <h2 className="mb-4 font-heading text-base font-semibold">
        {t("shell.profile.streakTitle")}
      </h2>
      <Card>
        <CardHeader>
          <CardMedia>
            <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
              <CalendarCheck className="size-4" aria-hidden />
            </span>
          </CardMedia>
          <CardHeading>
            <CardTitle>{t("shell.profile.streakCardTitle")}</CardTitle>
            <CardDescription>
              {t("shell.profile.streakDescription")}
            </CardDescription>
          </CardHeading>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <StatStrip
            items={[
              {
                label: t("shell.profile.streakCurrent"),
                value: data.currentStreak,
              },
              {
                label: t("shell.profile.streakRecord"),
                value: data.longestStreak,
              },
              {
                label: t("shell.profile.streakActiveDays"),
                value: data.totalActiveDays,
              },
            ]}
          />
          <StreakCalendar
            streak={periods}
            view="week"
            locale={locale}
            startOfWeek={1}
            showFreezes={false}
            aria-label={t("shell.profile.streakAria")}
          />
        </CardContent>
      </Card>
    </section>
  )
}
