import * as React from "react"
import { Check, Snowflake, X } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Types (inlined - only fields used by this component)
interface StreakPeriod {
  periodStart: string
  periodEnd: string
  usedFreeze?: boolean
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Helper to check if a date falls within a streak period
function isDateInPeriod(date: Date, period: StreakPeriod): boolean {
  const d = formatDateKey(date)
  return d >= period.periodStart && d <= period.periodEnd
}

// Helper to check if date used a freeze
function didUseFreezeOnDate(date: Date, periods: StreakPeriod[]): boolean {
  for (const period of periods) {
    if (isDateInPeriod(date, period) && period.usedFreeze) {
      return true
    }
  }
  return false
}

// Helper to check if date was active in streak
function wasDateActive(date: Date, periods: StreakPeriod[]): boolean {
  for (const period of periods) {
    if (isDateInPeriod(date, period)) {
      return true
    }
  }
  return false
}

// Get days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// Get day of week for first day of month (0 = Sunday)
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

// Props
interface StreakCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Streak periods */
  streak: StreakPeriod[]
  /** Calendar layout variant */
  view?: "week" | "month" | "year"
  /** Month to display (default: current month) */
  month?: Date
  /** Date used for week view (default: today) */
  referenceDate?: Date
  /** Show freeze indicators */
  showFreezes?: boolean
  /** Start of week: 0 = Sunday, 1 = Monday */
  startOfWeek?: 0 | 1
  /** Locale used by month/day labels (ex. `fr-FR`, `en-US`). */
  locale?: string
  /** Callback when a day is clicked */
  onDayClick?: (date: Date, wasActive: boolean) => void
}

function getDateKey(date: Date): string {
  return formatDateKey(date)
}

function getWeekStart(date: Date, startOfWeek: 0 | 1): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  const day = next.getDay()
  const offset = startOfWeek === 1 ? (day + 6) % 7 : day
  next.setDate(next.getDate() - offset)
  return next
}

function getWeekDates(reference: Date, startOfWeek: 0 | 1): Date[] {
  const start = getWeekStart(reference, startOfWeek)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function getWeekdayIndex(date: Date, startOfWeek: 0 | 1): number {
  const day = date.getDay()
  return startOfWeek === 1 ? (day + 6) % 7 : day
}

function getGitDates(endDate: Date): Date[] {
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  return Array.from({ length: 365 }, (_, index) => {
    const date = new Date(end)
    date.setDate(end.getDate() - (364 - index))
    return date
  })
}

function getGitCells(
  endDate: Date,
  startOfWeek: 0 | 1
): {
  cells: (Date | null)[]
  dates: Date[]
} {
  const dates = getGitDates(endDate)
  const firstDate = dates[0]
  if (!firstDate) return { cells: [], dates: [] }

  const leadingEmptyCells = getWeekdayIndex(firstDate, startOfWeek)
  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingEmptyCells }, () => null),
    ...dates,
  ]

  return { cells, dates }
}

const StreakCalendar = React.forwardRef<HTMLDivElement, StreakCalendarProps>(
  (
    {
      className,
      streak,
      view = "week",
      month = new Date(),
      referenceDate = new Date(),
      showFreezes = true,
      startOfWeek = 0,
      locale = "en-US",
      onDayClick,
      ...props
    },
    ref
  ) => {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const daysInMonth = getDaysInMonth(year, monthIndex)
    const firstDayOfMonth = getFirstDayOfMonth(year, monthIndex)

    // Adjust first day based on start of week preference
    const adjustedFirstDay =
      startOfWeek === 1
        ? (firstDayOfMonth + 6) % 7 // Monday start
        : firstDayOfMonth // Sunday start

    const weekdays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(2024, 0, startOfWeek === 1 ? 1 : 7)
      date.setDate(date.getDate() + index)
      return date.toLocaleDateString(locale, { weekday: "short" })
    })
    const french = locale.toLowerCase().startsWith("fr")
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const periods = streak ?? []
    const weekDates = getWeekDates(referenceDate, startOfWeek)
    const { cells: gitCells, dates: gitDates } = getGitCells(today, startOfWeek)
    const gitColumnCount = Math.ceil(gitCells.length / 7)
    const gitGridTemplateColumns = `repeat(${gitColumnCount}, 1rem)`
    const gitMonthLabels: Array<{ column: number; label: string }> = []
    const seenGitMonths = new Set<string>()

    gitCells.forEach((date, cellIndex) => {
      if (!date) return
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      if (!seenGitMonths.has(monthKey) && date.getDate() === 1) {
        seenGitMonths.add(monthKey)
        gitMonthLabels.push({
          column: Math.floor(cellIndex / 7),
          label: date.toLocaleDateString(locale, { month: "short" }),
        })
      }
    })

    const firstDate = gitDates[0]
    if (firstDate) {
      const firstMonthKey = `${firstDate.getFullYear()}-${firstDate.getMonth()}`
      if (!seenGitMonths.has(firstMonthKey)) {
        gitMonthLabels.unshift({
          column: 0,
          label: firstDate.toLocaleDateString(locale, { month: "short" }),
        })
      }
    }

    // Generate calendar days
    const days: (number | null)[] = []

    // Add empty cells for days before the first of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    const monthName = month.toLocaleDateString(locale, { month: "long" })
    const gitEndMonthName = today.toLocaleDateString(locale, {
      month: "long",
    })

    const freezeColorStyles = {
      "--freeze-color": "var(--info)",
      "--freeze-foreground-color": "var(--info-foreground)",
    } as React.CSSProperties

    // Même disque que les pastilles d'issue des cartes d'historique : 80 % de la teinte
    // (`--success-600` / `--loss`) + noir, icône blanche.
    const activeDayStyle: React.CSSProperties = {
      backgroundColor: "color-mix(in oklab, var(--success-600) 80%, black)",
      borderColor: "color-mix(in oklab, var(--success-600) 80%, black)",
      color: "#fff",
    }
    const missedDayStyle: React.CSSProperties = {
      backgroundColor: "color-mix(in oklab, var(--loss) 80%, black)",
      borderColor: "color-mix(in oklab, var(--loss) 80%, black)",
      color: "#fff",
    }
    const cellToneStyle = (
      isActive: boolean,
      isMissed: boolean,
      usedFreeze: boolean
    ): React.CSSProperties | undefined =>
      usedFreeze
        ? freezeColorStyles
        : isActive
          ? activeDayStyle
          : isMissed
            ? missedDayStyle
            : undefined

    const getCellState = (date: Date) => {
      const isToday = date.getTime() === today.getTime()
      const isFuture = date > today
      const isActive = wasDateActive(date, periods)
      const usedFreeze = showFreezes && didUseFreezeOnDate(date, periods)
      // Un jour passé sans activité est un jour **manqué** (rouge), pas une simple case vide.
      // Aujourd'hui n'est pas encore manqué : la journée est en cours.
      const isMissed = !isToday && !isFuture && !isActive && !usedFreeze
      return { isToday, isFuture, isActive, isMissed, usedFreeze }
    }

    return (
      <div
        ref={ref}
        role="grid"
        aria-label={`Streak calendar ${view} view`}
        className={cn(
          "w-full",
          view === "month" ? "max-w-sm" : "max-w-3xl",
          className
        )}
        {...props}
      >
        {view === "month" && (
          <>
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold" id="streak-calendar-title">
                {monthName} {year}
              </h3>
            </div>
            <div role="row" className="mb-2 grid grid-cols-7 gap-1">
              {weekdays.map((day) => (
                <div
                  key={day}
                  role="columnheader"
                  className="text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            <div role="rowgroup" className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (day === null) {
                  return (
                    <div key={`empty-${index}`} className="aspect-square" />
                  )
                }
                const date = new Date(year, monthIndex, day)
                const { isToday, isFuture, isActive, isMissed, usedFreeze } =
                  getCellState(date)
                const dateLabel = date.toLocaleDateString(locale, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
                const statusLabel = usedFreeze
                  ? french
                    ? "gel utilisé"
                    : "freeze used"
                  : isActive
                    ? french
                      ? "série active"
                      : "streak active"
                    : isFuture
                      ? french
                        ? "à venir"
                        : "future"
                      : isMissed
                        ? french
                          ? "jour manqué"
                          : "missed day"
                        : french
                          ? "aucune activité"
                          : "no activity"
                return (
                  <button
                    key={day}
                    type="button"
                    role="gridcell"
                    aria-label={`${dateLabel}${isToday ? (french ? ", aujourd’hui" : ", today") : ""}, ${statusLabel}`}
                    aria-current={isToday ? "date" : undefined}
                    onClick={() => onDayClick?.(date, isActive)}
                    disabled={isFuture}
                    className={cn(
                      "relative flex aspect-square items-center justify-center rounded-lg text-sm transition-colors",
                      "p-1 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      isToday &&
                        "bg-muted text-foreground ring-2 ring-primary ring-offset-0 ring-inset",
                      isFuture &&
                        "cursor-not-allowed bg-muted text-muted-foreground/50",
                      isMissed && "text-white",
                      isActive && !usedFreeze && "text-white",
                      usedFreeze &&
                        "bg-[var(--freeze-color)] text-[var(--freeze-foreground-color)] hover:opacity-90"
                    )}
                    style={cellToneStyle(isActive, isMissed, usedFreeze)}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {view === "week" && (
          <div role="rowgroup" className="grid grid-cols-7 gap-2">
            {weekDates.map((date) => {
              const { isToday, isFuture, isActive, isMissed, usedFreeze } =
                getCellState(date)
              const dayLabel = date.toLocaleDateString(locale, {
                weekday: "short",
              })
              const statusLabel = usedFreeze
                ? french
                  ? "gel utilisé"
                  : "freeze used"
                : isActive
                  ? french
                    ? "série active"
                    : "streak active"
                  : isFuture
                    ? french
                      ? "à venir"
                      : "future"
                    : isMissed
                      ? french
                        ? "jour manqué"
                        : "missed day"
                      : french
                        ? "aucune activité"
                        : "no activity"
              return (
                <div
                  key={getDateKey(date)}
                  className="flex flex-col items-center gap-2"
                >
                  <button
                    type="button"
                    role="gridcell"
                    aria-current={isToday ? "date" : undefined}
                    aria-label={`${date.toLocaleDateString(locale, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}, ${statusLabel}`}
                    onClick={() => onDayClick?.(date, isActive)}
                    disabled={isFuture}
                    className={cn(
                      "relative flex h-12 w-12 items-center justify-center rounded-full border border-2 transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                      !isFuture && "hover:opacity-90",
                      isToday &&
                        "bg-muted text-foreground ring-2 ring-primary ring-offset-2 ring-offset-background",
                      isFuture &&
                        "cursor-not-allowed border-border bg-muted text-muted-foreground/50",
                      isActive && !usedFreeze && "text-white",
                      usedFreeze &&
                        "border-[var(--freeze-color)] bg-[var(--freeze-color)] text-[var(--freeze-foreground-color)]",
                      isMissed && "text-white",
                      !isActive &&
                        !usedFreeze &&
                        !isFuture &&
                        !isMissed &&
                        "border-border bg-muted text-foreground"
                    )}
                    style={cellToneStyle(isActive, isMissed, usedFreeze)}
                  >
                    {usedFreeze ? (
                      <Snowflake className="h-5 w-5" />
                    ) : isActive ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : isMissed ? (
                      <X className="h-5 w-5 text-white" />
                    ) : null}
                  </button>
                  <span
                    className={cn(
                      "text-sm",
                      isFuture ? "text-muted-foreground/50" : "text-foreground"
                    )}
                  >
                    {dayLabel}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {view === "year" && (
          <>
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold" id="streak-calendar-title">
                {french ? "365 derniers jours" : "Last 365 days"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {french ? "Jusqu’au" : "Ending"} {gitEndMonthName}{" "}
                {today.getDate()}
              </p>
            </div>
            <div className="overflow-x-auto">
              <div className="inline-block pr-16">
                <div
                  aria-hidden="true"
                  className="mb-2 grid gap-1"
                  style={{ gridTemplateColumns: gitGridTemplateColumns }}
                >
                  {gitMonthLabels.map((month) => (
                    <span
                      key={`${month.column}-${month.label}`}
                      className="text-xs whitespace-nowrap text-muted-foreground"
                      style={{ gridColumnStart: month.column + 1 }}
                    >
                      {month.label}
                    </span>
                  ))}
                </div>
                <TooltipProvider>
                  <div
                    role="rowgroup"
                    className="grid grid-flow-col grid-rows-7 gap-1"
                    style={{ gridTemplateColumns: gitGridTemplateColumns }}
                  >
                    {gitCells.map((date, index) => {
                      if (!date) {
                        return (
                          <div key={`git-empty-${index}`} className="h-4 w-4" />
                        )
                      }
                      const { isToday, isActive, usedFreeze } =
                        getCellState(date)
                      const dateLabel = date.toLocaleDateString(locale, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                      return (
                        <Tooltip key={getDateKey(date)}>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                role="gridcell"
                                aria-current={isToday ? "date" : undefined}
                                aria-label={`${dateLabel}, ${usedFreeze ? (french ? "gel utilisé" : "freeze used") : isActive ? (french ? "série active" : "streak active") : french ? "aucune activité" : "no activity"}`}
                                onClick={() => onDayClick?.(date, isActive)}
                                className={cn(
                                  "h-4 w-4 rounded-[0.4rem] border border-border/40 transition-colors",
                                  "hover:ring-1 hover:ring-ring",
                                  isToday &&
                                    "border-primary !bg-primary-foreground !text-primary",
                                  isActive &&
                                    !usedFreeze &&
                                    "border-primary/80 bg-primary",
                                  usedFreeze &&
                                    "border-[var(--freeze-color)] bg-[var(--freeze-color)]",
                                  !isActive && !usedFreeze && "bg-muted/40"
                                )}
                                style={
                                  usedFreeze ? freezeColorStyles : undefined
                                }
                              />
                            }
                          ></TooltipTrigger>
                          <TooltipContent side="top">
                            {dateLabel}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                </TooltipProvider>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }
)
StreakCalendar.displayName = "StreakCalendar"

export { StreakCalendar }
export type { StreakCalendarProps, StreakPeriod }
