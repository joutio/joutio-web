import type { TFunction } from "i18next"
import type { NotificationView } from "@/shared/types/notifications"

export type { NotificationView } from "@/shared/types/notifications"
export type { NotificationCategory } from "@/shared/types/notifications"
export type { NotificationPreferenceView } from "@/shared/types/notifications"

/**
 * La source de la notification est expirée (date d'expiration serveur dépassée) : les actions
 * d'invitation sont masquées pour éviter une acceptance tardive.
 */
export function isExpired(notification: NotificationView): boolean {
  if (!notification.expiresAt) return false
  const expiresAt = Date.parse(notification.expiresAt)
  return Number.isFinite(expiresAt) && expiresAt <= Date.now()
}

export function isUnread(notification: NotificationView): boolean {
  return notification.readAt === null
}

/**
 * Demande de revanche : défi nominatif portant le `gameId` de la partie d'origine. Elle est
 * gérée par une **popup dédiée** (TTL très court), jamais par un toast. L'expiration est laissée
 * à la popup, qui seule dispose de l'horloge serveur.
 */
export function isRematchRequest(notification: NotificationView): boolean {
  return (
    notification.type === "CHALLENGE_RECEIVED" &&
    typeof notification.gameId === "string" &&
    typeof notification.sourceId === "string" &&
    notification.readAt === null
  )
}

/**
 * Route de reprise d'un défi accepté : l'arène dès que la partie est créée (`gameId`), sinon la
 * salle encore ouverte (`sourceId` = roomId). `null` pour les autres types.
 */
export function roomTargetPath(notification: NotificationView): string | null {
  if (notification.type !== "ROOM_ACCEPTED") return null
  if (notification.gameId) return `/game/${notification.gameId}`
  if (notification.sourceId) return `/rooms/${notification.sourceId}`
  return null
}

/**
 * Route de la carte d'un défi reçu sur la page Défis & Salons, filtrée sur les défis reçus ;
 * `challenge` cible une carte précise. Une invitation expirée n'a plus de carte actionnable :
 * on ouvre seulement la page filtrée.
 */
export function challengeTargetPath(
  notification: NotificationView
): string | null {
  if (notification.type !== "CHALLENGE_RECEIVED" || !notification.sourceId) {
    return null
  }
  const base = "/challenges?type=received"
  return isExpired(notification)
    ? base
    : `${base}&challenge=${encodeURIComponent(notification.sourceId)}`
}

/**
 * Destination au clic d'une notification : profil pour un abonné, duel/salle pour un défi
 * accepté, salle d'attente pour une relance (« wizz » — non actionnable une fois expirée),
 * carte Défis & Salons pour une invitation ; `null` pour les événements purement informatiques.
 */
export function notificationTargetPath(
  notification: NotificationView
): string | null {
  switch (notification.type) {
    case "FOLLOW":
      return notification.actorId ? `/players/${notification.actorId}` : null
    case "CHALLENGE_RECEIVED":
      return challengeTargetPath(notification)
    case "ROOM_ACCEPTED":
      return roomTargetPath(notification)
    case "WIZZ":
      // La relance est honorée/expirée (joueur arrivé, salle close) : plus de destination.
      return notification.sourceId && !isExpired(notification)
        ? `/rooms/${notification.sourceId}`
        : null
    case "QUESTION_REPORTED":
    case "TOPIC_DRAFTED":
      return notification.topicId ? `/topics/${notification.topicId}` : null
    default:
      return null
  }
}

export interface NotificationToastContent {
  title: string
  description: string
  /** Destination au clic (toujours définie pour les toasts affichés). */
  path: string | null
  /** Variante colorée du toast (titres/icônes alignés sur les variants sonner du `Toaster`). */
  tone?: "success" | "danger"
}

/**
 * Contenu du toast d'une notification temps réel, ou `null` si aucun toast n'est pertinent
 * (invitation expirée, relance honorée…). Une invitation de défi pointe vers sa carte Défis.
 */
export function notificationToast(
  notification: NotificationView,
  t: TFunction
): NotificationToastContent | null {
  switch (notification.type) {
    case "FOLLOW":
      return {
        title: t("notifications.toast.followTitle"),
        description: t("notifications.toast.followDescription"),
        path: notification.actorId
          ? `/players/${notification.actorId}`
          : "/notifications",
      }
    case "CHALLENGE_RECEIVED": {
      // Une revanche passe par la popup dédiée (TTL court), jamais par un toast.
      if (notification.gameId) return null
      const path = challengeTargetPath(notification)
      return path && !isExpired(notification)
        ? {
            title: t("notifications.toast.challengeTitle"),
            description: t("notifications.toast.challengeDescription"),
            path,
          }
        : null
    }
    case "CHALLENGE_DECLINED":
      return {
        title: t("notifications.toast.declinedTitle"),
        description: t("notifications.toast.declinedDescription"),
        path: "/notifications",
        tone: "danger",
      }
    case "ROOM_ACCEPTED": {
      const path = roomTargetPath(notification)
      return path
        ? {
            title: t("notifications.toast.acceptedTitle"),
            description: t("notifications.toast.acceptedDescription"),
            path,
            tone: "success",
          }
        : null
    }
    case "WIZZ": {
      const path = notificationTargetPath(notification)
      return path
        ? {
            title: t("notifications.toast.wizzTitle"),
            description: t("notifications.toast.wizzDescription"),
            path,
          }
        : null
    }
    case "QUESTION_REPORTED": {
      const path = notificationTargetPath(notification)
      return path
        ? {
            title: t("notifications.toast.questionReportTitle"),
            description: t("notifications.toast.questionReportDescription"),
            path,
          }
        : null
    }
    case "TOPIC_DRAFTED": {
      const path = notificationTargetPath(notification)
      return path
        ? {
            title: t("notifications.toast.topicDraftedTitle"),
            description: t("notifications.toast.topicDraftedDescription"),
            path,
            tone: "danger",
          }
        : null
    }
    default:
      return null
  }
}

/** Horodatage relatif court (« à l'instant », « il y a 5 min », « il y a 3 j »). */
export function relativeTime(
  iso: string,
  t: TFunction,
  locale: string
): string {
  const elapsedMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(elapsedMs / 60_000)
  if (minutes < 1) return t("notifications.time.justNow")
  if (minutes < 60) return t("notifications.time.minutes", { count: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t("notifications.time.hours", { count: hours })
  const days = Math.floor(hours / 24)
  if (days < 7) return t("notifications.time.days", { count: days })
  return new Date(iso).toLocaleDateString(locale)
}
