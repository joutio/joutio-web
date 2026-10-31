import { useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { JoutioMark } from "@/shared/components/joutio-mark"
import {
  Sidebar as SidebarUI,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { NAV, isNavItemActive } from "./navigation"
import { NavBadge } from "./NavBadge"
import { ProfileMenu } from "./ProfileMenu"
import { useMe } from "../hooks/useMe"
import { useLogout } from "@/features/auth"
import { useUnreadNotificationsCount } from "@/features/notifications"
import { useSocialPending } from "@/features/social"

/** Sidebar shadcn native (Accueil / Sujets / Social / Défis / Notifications). */
export function AppSidebar() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const { data: me, userId } = useMe()
  const logout = useLogout()
  const unread = useUnreadNotificationsCount()
  const unreadCount = unread.data?.count ?? 0
  const pending = useSocialPending()

  const player = {
    name: me?.pseudonym ?? userId ?? t("shell.settings.fallbackPlayer"),
    userId: userId ?? undefined,
    avatarOptions: me?.avatarOptions ?? undefined,
  }

  return (
    <SidebarUI collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => void navigate("/")}
              className="data-[state=open]:bg-sidebar-accent"
            >
              <JoutioMark className="size-8" />
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-heading font-bold">
                  Joutio
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {t("shell.brand.tagline")}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const Icon = item.icon
                const isActive = isNavItemActive(item, pathname)
                const badge =
                  item.id === "notifications"
                    ? unreadCount
                    : item.id === "challenges"
                      ? pending.total
                      : 0
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      aria-current={isActive ? "page" : undefined}
                      tooltip={t(item.labelKey)}
                      onClick={() => void navigate(item.path)}
                    >
                      <span className="relative shrink-0">
                        <Icon weight={isActive ? "fill" : "regular"} />
                        <NavBadge count={badge} />
                      </span>
                      <span className="flex-1">{t(item.labelKey)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ProfileMenu
          player={player}
          collapsed={collapsed}
          onProfile={() => void navigate("/profile")}
          onSettings={() => void navigate("/settings")}
          onLogout={() => void logout()}
          side="top"
          align="start"
        />
      </SidebarFooter>

      <SidebarRail />
    </SidebarUI>
  )
}
