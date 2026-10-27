import { describe, expect, it } from "vitest"
import {
  isPushSupported,
  subscriptionToPayload,
  urlBase64ToUint8Array,
} from "./push"

describe("urlBase64ToUint8Array", () => {
  it("décode une clé base64url en octets", () => {
    // "AQID" (base64url sans padding) = [1, 2, 3]
    expect(Array.from(urlBase64ToUint8Array("AQID"))).toEqual([1, 2, 3])
  })

  it("tolère l'absence de padding et l'alphabet url", () => {
    expect(Array.from(urlBase64ToUint8Array("-_8"))).toEqual([251, 255])
  })
})

describe("isPushSupported", () => {
  it("est faux hors navigateur (environnement node des tests)", () => {
    expect(isPushSupported()).toBe(false)
  })
})

describe("subscriptionToPayload", () => {
  it("mappe endpoint + clés du toJSON navigateur", () => {
    const subscription = {
      endpoint: "https://push.example/1",
      toJSON: () => ({
        endpoint: "https://push.example/1",
        keys: { p256dh: "p256dh-value", auth: "auth-value" },
      }),
    } as unknown as PushSubscription

    expect(subscriptionToPayload(subscription)).toEqual({
      endpoint: "https://push.example/1",
      keys: { p256dh: "p256dh-value", auth: "auth-value" },
    })
  })

  it("retombe sur des clés vides si toJSON n'en expose pas", () => {
    const subscription = {
      endpoint: "https://push.example/2",
      toJSON: () => ({ endpoint: "https://push.example/2" }),
    } as unknown as PushSubscription

    expect(subscriptionToPayload(subscription).keys).toEqual({
      p256dh: "",
      auth: "",
    })
  })
})
