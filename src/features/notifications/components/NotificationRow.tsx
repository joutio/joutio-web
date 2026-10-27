import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import {
  Bell,
  Check,
  FileWarning,
  Flag,
  Mail,
  MailOpen,
  ShieldAlert,
  Swords,
  Trash2,
  UserPlus,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import {
  SwipeActionsRow,
  type SwipeAction,
} from "@/components/arc/swipe-actions/swipe-actions"
import { playSuccessChime } from "@/shared/audio"
import { SuspendedBadge } from "@/shared/components/suspended-badge"
import { UserAvatar } from "@/shared/components/user-avatar"
import { usePlayerProfile } from "@/features/player"
import { useImmersiveNavigate } from "@/features/shell"
import { useLocale } from "@/lib/i18n/useLocale"
import type {
  NotificationType,
  NotificationView,
} from "@/shared/types/notifications"
import {
  isUnread,
  notificationTargetPath,
  relativeTime,
} from "../domain/notification"
import {
  useDeleteNotification,
  useMarkNotificationRead,
  useMarkNotificationUnread,
} from "../hooks/useNotifications"

/** Pictogramme et teinte par type de notification (badge sur l'avatar de l'auteur). */
const GLYPHS: Record<
  NotificationType,
  { icon: LucideIcon; className: string }
> = {
  FOLLOW: { icon: UserPlus, className: "text-primary" },
  CHALLENGE_RECEIVED: { icon: Swords, className: "text-primary" },
  CHALLENGE_DECLINED: { icon: X, className: "text-destructive" },
  ROOM_ACCEPTED: { icon: Check, className: "text-[var(--duel-correct)]" },
  WIZZ: { icon: Zap, className: "text-primary" },
  QUESTION_REPORTED: { icon: Flag, className: "text-primary" },
  TOPIC_DRAFTED: { icon: FileWarning, className: "text-destructive" },
  ACCOUNT_SUSPENDED: { icon: ShieldAlert, className: "text-destructive" },
}

/**
 * Ligne d'inbox **informative** (cloche + page Notifications) : le texte vaut lecture et navigue
 * vers la cible de la notification (profil, duel/salon, carte Social pour une invitation) ;
 * l'avatar ouvre le profil ; le swipe propose « Marquer comme lue/non lue » (vers la gauche) et
 * « Supprimer » (vers la droite), reflétés dans le menu « … » desktop. Les actions d'une
 * invitation (Accepter/Refuser) vivent sur les cartes **Défis reçus** de la page Défis & Salons.
 */
export function NotificationRow({
  notification,
  onNavigate,
}: {
  notification: NotificationView
  /** Appelé avant toute navigation (fermeture de la popup de la cloche). */
  onNavigate?: () => void
}) {
  const navigate = useImmersiveNavigate()
  const { t } = useTranslation()
  const locale = useLocale()
  const player = usePlayerProfile(notification.actorId ?? "")
  const markRead = useMarkNotificationRead()
  const markUnread = useMarkNotificationUnread()
  const removeNotification = useDeleteNotification()
  const name = player.data?.pseudonym ?? t("notifications.row.playerFallback")
  const unread = isUnread(notification)
  const target = notificationTargetPath(notification)
  // Fallback défensif : une ancienne notification (type retiré) ne doit pas casser la ligne.
  const glyph = GLYPHS[notification.type] ?? {
    icon: Bell,
    className: "text-muted-foreground",
  }
  const Glyph = glyph.icon
  const text = label(notification, name, t)

  // Le libellé décrit le résultat ; `keepRow` fait revenir la ligne (lecture, pas triage).
  const readToggle: SwipeAction = unread
    ? {
        label: t("notifications.actions.markRead"),
        icon: <MailOpen />,
        keepRow: true,
        onSelect: () => {
          playSuccessChime()
          markRead.mutate(notification.notificationId)
        },
      }
    : {
        label: t("notifications.actions.markUnread"),
        icon: <Mail />,
        keepRow: true,
        onSelect: () => {
          playSuccessChime()
          markUnread.mutate(notification.notificationId)
        },
      }

  /**
   * Le texte vaut lecture puis navigation vers la cible : la carte Défis pour une invitation,
   * le profil/duel/salon pour les autres notifications.
   */
  function open() {
    if (unread) markRead.mutate(notification.notificationId)
    if (!target) return
    onNavigate?.()
    navigate(target)
  }

  return (
    <SwipeActionsRow
      label={text}
      leading={[readToggle]}
      trailing={[
        {
          label: t("notifications.actions.delete"),
          icon: <Trash2 />,
          tone: "danger",
          onSelect: () => {
            playSuccessChime()
            removeNotification.mutate(notification.notificationId)
          },
        },
      ]}
      // Fond « non lu » sur **toute la surface** qui coulisse (et qui suit le swipe), au lieu
      // d'un rectangle imbriqué dans la ligne.
      contentStyle={
        unread
          ? {
              background:
                "color-mix(in srgb, var(--primary) 6%, var(--surface))",
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {notification.actorId ? (
            <Link
              to={`/players/${notification.actorId}`}
              aria-label={t("notifications.row.viewProfile", { name })}
              className="block rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <UserAvatar
                name={name}
                userId={notification.actorId}
                avatarOptions={player.data?.avatarOptions ?? undefined}
                size={40}
              />
            </Link>
          ) : (
            <span className="grid size-10 place-items-center rounded-full bg-muted">
              <Glyph className="size-4 text-muted-foreground" />
            </span>
          )}
          {notification.actorId && (
            <span
              className={cn(
                "absolute -right-0.5 -bottom-0.5 grid size-[18px] place-items-center rounded-full border-2 border-card bg-card",
                glyph.className
              )}
            >
              <Glyph className="size-[10px]" />
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={open}
          className={cn("min-w-0 flex-1 text-left", target && "cursor-pointer")}
        >
          <span
            className={cn(
              "block text-sm leading-snug",
              unread ? "font-medium" : "text-muted-foreground"
            )}
          >
            {text}
          </span>
          {notification.actorSuspended || player.data?.suspended ? (
            <SuspendedBadge className="mt-1 scale-90" />
          ) : null}
          <span className="mt-0.5 block text-xs text-muted-foreground/80">
            {relativeTime(notification.createdAt, t, locale)}
          </span>
        </button>

        {unread && (
          <span
            className="mt-2 size-2 shrink-0 rounded-full bg-primary"
            aria-label={t("notifications.row.unread")}
          />
        )}
      </div>
    </SwipeActionsRow>
  )
}

function label(
  notification: NotificationView,
  name: string,
  t: TFunction
): string {
  switch (notification.type) {
    case "FOLLOW":
      return t("notifications.row.follow", { name })
    case "CHALLENGE_RECEIVED":
      return notification.gameId
        ? t("notifications.row.rematchReceived", { name })
        : t("notifications.row.challengeReceived", { name })
    case "CHALLENGE_DECLINED":
      return t("notifications.row.challengeDeclined", { name })
    case "ROOM_ACCEPTED":
      return t("notifications.row.roomAccepted", { name })
    case "WIZZ":
      return t("notifications.row.wizz", { name })
    case "QUESTION_REPORTED":
      return t("notifications.row.questionReported", { name })
    case "TOPIC_DRAFTED":
      return t("notifications.row.topicDrafted")
    case "ACCOUNT_SUSPENDED":
      return t("notifications.row.accountSuspended")
    default:
      return t("notifications.row.fallback")
  }
}
