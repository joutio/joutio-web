import i18n from "@/lib/i18n"
import type { ApiErrorEvent } from "@/lib/error-bus"

const ROOM_NOT_FOUND = "urn:joutio:room:notFound"
const CHALLENGE_NOT_PENDING = "urn:joutio:challenge:notPending"
const ROOM_WIZZ_COOLDOWN = "urn:joutio:room:wizzCooldown"
const ROOM_WIZZ_UNAVAILABLE = "urn:joutio:room:wizzUnavailable"

/** Problèmes de création de duel (garde anti-spam et quotas). */
export const CHALLENGE_ALREADY_PENDING =
  "urn:joutio:bff:challenge:alreadyPending"
export const CHALLENGE_QUOTA_EXCEEDED =
  "urn:joutio:bff:challenge:quotaExceeded"
export const ROOM_ALREADY_OPEN_ON_TOPIC =
  "urn:joutio:bff:room:alreadyOpenOnTopic"
export const ROOM_QUOTA_EXCEEDED = "urn:joutio:bff:room:quotaExceeded"

/**
 * Traduit une erreur API en message de toast. Quelques problèmes métier ont un message dédié
 * (salle expirée/purgée, défi plus actionnable) ; les autres gardent le message/détail du backend.
 */
export function apiErrorToast(error: ApiErrorEvent): {
  title: string
  description?: string
} {
  if (error.type === ROOM_NOT_FOUND) {
    return {
      title: i18n.t("shared.apiErrors.challengeUnavailable"),
      description: i18n.t("shared.apiErrors.roomGone"),
    }
  }

  if (error.type === CHALLENGE_NOT_PENDING) {
    return {
      title: i18n.t("shared.apiErrors.challengeUnavailable"),
      description: i18n.t("shared.apiErrors.challengeResolved"),
    }
  }

  if (error.type === ROOM_WIZZ_COOLDOWN) {
    return {
      title: i18n.t("shared.apiErrors.wizzCooldownTitle"),
      description: i18n.t("shared.apiErrors.wizzCooldown"),
    }
  }

  if (error.type === ROOM_WIZZ_UNAVAILABLE) {
    return {
      title: i18n.t("shared.apiErrors.wizzUnavailableTitle"),
      description: i18n.t("shared.apiErrors.wizzUnavailable"),
    }
  }

  if (error.type === CHALLENGE_ALREADY_PENDING) {
    return {
      title: i18n.t("shared.apiErrors.challengeAlreadyPendingTitle"),
      description: i18n.t("shared.apiErrors.challengeAlreadyPending"),
    }
  }

  if (error.type === CHALLENGE_QUOTA_EXCEEDED) {
    return {
      title: i18n.t("shared.apiErrors.challengeQuotaTitle"),
      description: i18n.t("shared.apiErrors.challengeQuota"),
    }
  }

  if (error.type === ROOM_ALREADY_OPEN_ON_TOPIC) {
    return {
      title: i18n.t("shared.apiErrors.roomAlreadyOpenTitle"),
      description: i18n.t("shared.apiErrors.roomAlreadyOpen"),
    }
  }

  if (error.type === ROOM_QUOTA_EXCEEDED) {
    return {
      title: i18n.t("shared.apiErrors.roomQuotaTitle"),
      description: i18n.t("shared.apiErrors.roomQuota"),
    }
  }

  return { title: error.message, description: error.detail }
}
