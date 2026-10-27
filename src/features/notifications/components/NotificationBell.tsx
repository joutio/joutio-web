import { useState } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { Button, buttonVariants } from "@/components/ui/button"
import { SwipeActions } from "@/components/arc/swipe-actions/swipe-actions"
import { playSuccessChime } from "@/shared/audio"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { NotificationRow } from "./NotificationRow"
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useUnreadNotificationsCount,
} from "../hooks/useNotifications"

/** Cloche de la topbar : compteur non lus + panneau d'inbox + lien vers la page complète. */
export function NotificationBell() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { data: unread } = useUnreadNotificationsCount()
  const { data: page } = useNotifications()
  const markAll = useMarkAllNotificationsRead()
  const count = unread?.count ?? 0

  /** Toute navigation depuis le panneau ferme la popup (sinon elle reste ouverte). */
  const close = () => setOpen(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t("notifications.bell.aria")}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "relative text-muted-foreground"
        )}
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-heading text-2xs font-bold text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(380px,calc(100vw-1rem))] gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-heading text-sm font-bold">
            {t("notifications.bell.aria")}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={count === 0 || markAll.isPending}
            onClick={() => {
              playSuccessChime()
              markAll.mutate()
            }}
          >
            <CheckCheck className="size-4" /> {t("notifications.bell.markAll")}
          </Button>
        </div>
        <div className="flex max-h-[420px] flex-col overflow-y-auto overscroll-y-contain">
          {(page?.content.length ?? 0) === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("notifications.bell.empty")}
            </p>
          )}
          {(page?.content.length ?? 0) > 0 && (
            <SwipeActions label={t("notifications.list.aria")} framed={false}>
              {(page?.content ?? []).map((notification) => (
                <NotificationRow
                  key={notification.notificationId}
                  notification={notification}
                  onNavigate={close}
                />
              ))}
            </SwipeActions>
          )}
        </div>
        <div className="border-t px-4 py-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              close()
              void navigate("/notifications")
            }}
          >
            {t("notifications.bell.viewAll")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
