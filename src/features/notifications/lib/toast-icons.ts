import {
  BellIcon,
  CheckCircleIcon,
  FlagIcon,
  LightningIcon,
  ShieldWarningIcon,
  SwordIcon,
  UserPlusIcon,
  WarningIcon,
  XCircleIcon,
  type Icon as IconType,
} from "@phosphor-icons/react"
import type { NotificationType } from "@/shared/types/notifications"

/**
 * Icône du **gabarit de toast** selon le type de notification : le shell visuel est commun à
 * tous les toasts (présence, abonnement, défi tranché, salon, relance), seule l'icône change.
 */
export const TOAST_ICONS: Record<NotificationType, IconType> = {
  FOLLOW: UserPlusIcon,
  CHALLENGE_RECEIVED: SwordIcon,
  CHALLENGE_DECLINED: XCircleIcon,
  ROOM_ACCEPTED: CheckCircleIcon,
  WIZZ: LightningIcon,
  QUESTION_REPORTED: FlagIcon,
  TOPIC_DRAFTED: WarningIcon,
  ACCOUNT_SUSPENDED: ShieldWarningIcon,
}

/** Repli quand un type n'a pas d'icône dédiée. */
export const DEFAULT_TOAST_ICON = BellIcon
