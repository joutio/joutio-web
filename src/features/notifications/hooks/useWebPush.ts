import { useCallback, useEffect, useState } from "react"
import { useSession } from "@/features/auth"
import { isPushSupported } from "../domain/push"
import { pushService } from "../lib/push"
import {
  enableBrowserPush,
  getBrowserSubscription,
  writeBoundUserId,
} from "../lib/push-client"

export type PushPermission = NotificationPermission | "unsupported"

export interface WebPushState {
  supported: boolean
  permission: PushPermission
  subscribed: boolean
  busy: boolean
  enable: () => Promise<void>
  disable: () => Promise<void>
}

/**
 * État du Web Push pour les Réglages : permission navigateur, abonnement courant, activation
 * (dans le geste utilisateur — requis par iOS) et désactivation.
 */
export function useWebPush(): WebPushState {
  const { userId } = useSession()
  const supported = isPushSupported()
  const [permission, setPermission] = useState<PushPermission>(() =>
    supported ? Notification.permission : "unsupported"
  )
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supported) return
    let active = true
    void getBrowserSubscription()
      .then((subscription) => {
        if (active) setSubscribed(subscription !== null)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [supported])

  const enable = useCallback(async () => {
    if (!supported) return
    setBusy(true)
    try {
      const nextPermission = await enableBrowserPush(userId)
      setPermission(nextPermission)
      if (nextPermission === "granted") setSubscribed(true)
    } finally {
      setBusy(false)
    }
  }, [supported, userId])

  const disable = useCallback(async () => {
    setBusy(true)
    try {
      const subscription = await getBrowserSubscription()
      if (subscription) {
        await pushService
          .unsubscribe(subscription.endpoint)
          .catch(() => undefined)
        await subscription.unsubscribe().catch(() => undefined)
      }
      writeBoundUserId(null)
      setSubscribed(false)
    } finally {
      setBusy(false)
    }
  }, [])

  return { supported, permission, subscribed, busy, enable, disable }
}
