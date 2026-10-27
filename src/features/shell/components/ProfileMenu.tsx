import {
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
  SunMoon,
  UserRound,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/shared/components/user-avatar"
import { useTheme } from "../providers/theme-context"
import type { Theme } from "../stores/useThemeStore"

export interface PlayerSummary {
  name: string
  userId?: string
  avatarOptions?: string
}

interface ProfileMenuProps {
  player: PlayerSummary
  collapsed?: boolean
  compact?: boolean
  onProfile: () => void
  onSettings?: () => void
  onLogout: () => void
  align?: "start" | "end"
  side?: "top" | "bottom"
}

/** Bouton profil + menu shadcn (Profil / Apparence / Réglages / Déconnexion). */
export function ProfileMenu({
  player,
  collapsed,
  compact,
  onProfile,
  onSettings,
  onLogout,
  align = "start",
  side = "top",
}: ProfileMenuProps) {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const themeLabel =
    theme === "light"
      ? t("shell.profileMenu.theme.light")
      : theme === "system"
        ? t("shell.profileMenu.theme.system")
        : t("shell.profileMenu.theme.dark")

  const trigger = compact ? (
    <Button
      variant="outline"
      size="icon"
      aria-label={t("shell.profileMenu.aria")}
      className="overflow-hidden rounded-full p-0"
    >
      <UserAvatar
        name={player.name}
        userId={player.userId}
        avatarOptions={player.avatarOptions}
        size={40}
        fluid
        eloFrame={false}
      />
    </Button>
  ) : (
    <button
      className={
        "flex w-full items-center gap-2.5 rounded-2xl text-left hover:bg-muted/60 " +
        (collapsed ? "justify-center p-1.5" : "p-2.5")
      }
    >
      <UserAvatar
        name={player.name}
        userId={player.userId}
        avatarOptions={player.avatarOptions}
        size={collapsed ? 30 : 34}
        eloFrame={false}
      />
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{player.name}</div>
        </div>
      )}
    </button>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent side={side} align={align} className="w-60">
        <div className="px-3 py-2.5">
          <div className="text-sm font-semibold text-foreground">
            {player.name}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfile}>
          <UserRound /> {t("shell.profileMenu.profile")}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoon />
            <span className="flex min-w-0 flex-col items-start leading-tight">
              <span>{t("shell.profileMenu.appearance")}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {themeLabel}
              </span>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(value) => setTheme(value as Theme)}
            >
              <DropdownMenuRadioItem value="light">
                <Sun /> {t("shell.profileMenu.theme.light")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon /> {t("shell.profileMenu.theme.dark")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor /> {t("shell.profileMenu.theme.system")}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={onSettings}>
          <Settings /> {t("shell.profileMenu.settings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <LogOut /> {t("shell.profileMenu.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
