import { useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { Flame, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useFeatureFlag } from "@/shared/hooks/use-feature-flag"
import { useDevice } from "@/shared/hooks/use-device"
import { ProfileMenu } from "./ProfileMenu"
import { ThemeToggle } from "./ThemeToggle"
import { Breadcrumb, type Crumb } from "./Breadcrumb"
import { useMe } from "../hooks/useMe"
import { useTopicName } from "../hooks/useTopicName"
import { useLogout } from "@/features/auth"
import { compactNumber } from "@/lib/helpers"
import { useTopicOverview } from "@/features/topic-detail"
import { usePlayerProfile } from "@/features/player"
import { NotificationBell } from "@/features/notifications"

import type { TranslationKey } from "@/lib/i18n/types"

const ROUTE_SUBTITLES = {
  home: "shell.topbar.subtitles.home",
  topics: "shell.topbar.subtitles.topics",
  social: "shell.topbar.subtitles.social",
  challenges: "shell.topbar.subtitles.challenges",
  notifications: "shell.topbar.subtitles.notifications",
  profile: "shell.topbar.subtitles.profile",
  player: "shell.topbar.subtitles.player",
  settings: "shell.topbar.subtitles.settings",
  avatar: "shell.topbar.subtitles.avatar",
} as const satisfies Record<string, TranslationKey>

interface TopbarProps {
  onOpenPalette: () => void
}

/** Barre supérieure : fil d'Ariane + sous-titre, série, palette ⌘K, menu profil (mobile). */
export function Topbar({ onOpenPalette }: TopbarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const device = useDevice()
  const topicAuthoring = useFeatureFlag("topicAuthoring")
  const { data: me, userId } = useMe()
  const meProfile = usePlayerProfile(userId ?? "")
  const logout = useLogout()

  const topicMatch = /^\/topics\/([^/]+)(?:\/manage)?$/.exec(pathname)
  const topicId =
    topicMatch && topicMatch[1] !== "new" && topicMatch[1] !== "mine"
      ? topicMatch[1]
      : ""
  const playerId = pathname.startsWith("/players/")
    ? pathname.split("/")[2]
    : ""

  const topicQuery = useTopicOverview(topicId)
  const playerQuery = usePlayerProfile(playerId)
  const resolveName = useTopicName()

  const player = {
    name: me?.pseudonym ?? userId ?? t("shell.settings.fallbackPlayer"),
    userId: userId ?? undefined,
    avatarOptions: me?.avatarOptions ?? undefined,
  }

  const { crumbs, subtitle } = buildCrumbs(
    pathname,
    (path) => void navigate(path),
    t,
    {
      topicName: topicQuery.data
        ? resolveName(topicQuery.data.topic.names)
        : undefined,
      topicCategoryLabel: topicQuery.data?.topic.categoryLabel,
      topicFollowers: topicQuery.data?.topic.followersCount,
      playerName: playerQuery.data?.pseudonym,
    },
    topicAuthoring
  )

  return (
    <header className="qu-scroll-chrome flex h-[calc(var(--topbar-h)+var(--qu-safe-top))] shrink-0 items-center gap-2 border-b ps-[calc(var(--topbar-gutter-x)+var(--qu-safe-left))] pe-[calc(var(--topbar-gutter-x)+var(--qu-safe-right))] pt-(--qu-safe-top) tablet-up:gap-3">
      <SidebarTrigger className="-ml-1 hidden desktop:inline-flex" />
      <div className="min-w-0">
        <Breadcrumb items={crumbs} isMobile={device === "compact"} />
        <p className="hidden text-xs text-muted-foreground/85 desktop:block">
          {subtitle}
        </p>
      </div>

      <div className="flex-1" />

      <Button
        variant="outline"
        onClick={onOpenPalette}
        aria-label={t("shell.topbar.searchAria")}
        className="hidden h-9 w-[280px] justify-start gap-2.5 px-3 font-normal text-muted-foreground desktop:inline-flex"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left text-sm">
          {t("shell.topbar.searchPlaceholder")}
        </span>
        <kbd className="pointer-events-none rounded border bg-muted px-1.5 font-mono text-xs">
          ⌘K
        </kbd>
      </Button>

      <div
        className="hidden items-center gap-1.5 rounded-full border border-sidebar-border bg-card px-2.5 py-1.5 desktop:flex"
        title={t("shell.topbar.bestStreak")}
      >
        <Flame className="size-4 text-[var(--duel-score)]" />
        <span className="font-heading text-sm font-bold text-[var(--duel-score)]">
          {meProfile.data?.stats.bestWinStreak ?? 0}
        </span>
      </div>

      <ThemeToggle />

      <NotificationBell />

      <Button
        variant="outline"
        size="icon"
        onClick={onOpenPalette}
        aria-label={t("shell.topbar.searchShortAria")}
        className="text-muted-foreground desktop:hidden"
      >
        <Search className="size-4" />
      </Button>

      <div className="desktop:hidden">
        <ProfileMenu
          player={player}
          compact
          align="end"
          side="bottom"
          onProfile={() => void navigate("/profile")}
          onSettings={() => void navigate("/settings")}
          onLogout={() => void logout()}
        />
      </div>
    </header>
  )
}

interface CrumbData {
  topicName?: string
  topicCategoryLabel?: string | null
  topicFollowers?: number
  playerName?: string | null
}

function buildCrumbs(
  pathname: string,
  navigate: (path: string) => void,
  t: TFunction,
  data: CrumbData,
  topicAuthoring: boolean
): { crumbs: Crumb[]; subtitle: string } {
  if (pathname === "/topics/new" && !topicAuthoring) {
    // Atelier coupé (MVP) : page « Bientôt disponible », fil d'Ariane réduit à « Sujets ».
    return {
      crumbs: [
        { label: t("shell.nav.topics"), onClick: () => navigate("/topics") },
      ],
      subtitle: t("shell.comingSoon.title"),
    }
  }
  if (pathname === "/topics/new") {
    return {
      crumbs: [
        { label: t("shell.nav.topics"), onClick: () => navigate("/topics") },
        { label: t("shell.topbar.crumbs.newTopic") },
      ],
      subtitle: t("shell.topbar.subtitles.newTopic"),
    }
  }
  if (topicAuthoring && /^\/topics\/[^/]+\/manage$/.test(pathname)) {
    return {
      crumbs: [
        { label: t("shell.nav.topics"), onClick: () => navigate("/topics") },
        { label: data.topicName ?? t("shell.topbar.crumbs.topicFallback") },
        { label: t("shell.topbar.crumbs.manage") },
      ],
      subtitle: t("shell.topbar.subtitles.manage"),
    }
  }
  if (pathname.startsWith("/topics/")) {
    return {
      crumbs: [
        { label: t("shell.nav.topics"), onClick: () => navigate("/topics") },
        { label: data.topicName ?? t("shell.topbar.crumbs.topicFallback") },
      ],
      subtitle:
        data.topicName != null
          ? `${data.topicCategoryLabel ?? ""} · ${t(
              "shell.topbar.playersCount",
              {
                count: compactNumber(data.topicFollowers ?? 0),
              }
            )}`
          : "",
    }
  }
  if (pathname.startsWith("/players/")) {
    return {
      crumbs: [
        { label: t("shell.nav.social"), onClick: () => navigate("/social") },
        { label: data.playerName ?? t("shell.topbar.crumbs.playerFallback") },
      ],
      subtitle: t(ROUTE_SUBTITLES.player),
    }
  }
  if (pathname.startsWith("/rooms/")) {
    return {
      crumbs: [{ label: t("shell.topbar.crumbs.privateRoom") }],
      subtitle: t("shell.topbar.subtitles.privateRoom"),
    }
  }
  switch (pathname) {
    case "/topics":
      return {
        crumbs: [{ label: t("shell.nav.topics") }],
        subtitle: t(ROUTE_SUBTITLES.topics),
      }
    case "/social":
      return {
        crumbs: [{ label: t("shell.nav.social") }],
        subtitle: t(ROUTE_SUBTITLES.social),
      }
    case "/challenges":
      return {
        crumbs: [{ label: t("shell.nav.challenges") }],
        subtitle: t(ROUTE_SUBTITLES.challenges),
      }
    case "/notifications":
      return {
        crumbs: [{ label: t("shell.nav.notifications") }],
        subtitle: t(ROUTE_SUBTITLES.notifications),
      }
    case "/settings":
      return {
        crumbs: [
          {
            label: t("shell.nav.profile"),
            onClick: () => navigate("/profile"),
          },
          { label: t("shell.topbar.crumbs.settings") },
        ],
        subtitle: t(ROUTE_SUBTITLES.settings),
      }
    case "/settings/avatar":
      return {
        crumbs: [
          {
            label: t("shell.topbar.crumbs.settings"),
            onClick: () => navigate("/settings"),
          },
          { label: t("shell.topbar.crumbs.avatar") },
        ],
        subtitle: t(ROUTE_SUBTITLES.avatar),
      }
    case "/profile":
      return {
        crumbs: [{ label: t("shell.nav.profile") }],
        subtitle: t(ROUTE_SUBTITLES.profile),
      }
    default:
      return {
        crumbs: [{ label: t("shell.nav.home") }],
        subtitle: t(ROUTE_SUBTITLES.home),
      }
  }
}
