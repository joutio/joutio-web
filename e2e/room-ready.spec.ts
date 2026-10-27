import { expect, test } from "@playwright/test"
import {
  assertNoConsoleErrors,
  attachErrorCapture,
  createPrivateRoom,
  register,
  uniqueEmail,
} from "./helpers"

/**
 * Salle temps réel : une fois les deux joueurs entrés (créateur dans sa salle, adversaire via le
 * lien de partage), la préparation se termine et la partie est créée immédiatement — les deux
 * basculent dans la même arène (plus de compte à rebours de départ).
 */
test("salon : présence des deux joueurs puis arène", async ({ browser }) => {
  const errorsA: string[] = []
  const errorsB: string[] = []

  const ctxB = await browser.newContext()
  const pageB = await ctxB.newPage()
  attachErrorCapture(pageB, errorsB)
  await register(pageB, uniqueEmail("room-b"))

  const ctxA = await browser.newContext()
  const pageA = await ctxA.newPage()
  attachErrorCapture(pageA, errorsA)
  await register(pageA, uniqueEmail("room-a"))

  const { joinUrl } = await createPrivateRoom(pageA)
  expect(joinUrl).toContain("/join/")

  await pageB.goto(joinUrl, { waitUntil: "domcontentloaded" })

  // Les deux présents → partie créée immédiatement, bascule vers la même arène.
  await pageA.waitForURL(/\/game\/[^/]+$/, { timeout: 45_000 })
  await pageB.waitForURL(/\/game\/[^/]+$/, { timeout: 45_000 })

  expect(pageA.url().split("/").pop()).toBe(pageB.url().split("/").pop())
  assertNoConsoleErrors([...errorsA, ...errorsB])

  await ctxA.close()
  await ctxB.close()
})
