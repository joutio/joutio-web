import { expect, test } from "@playwright/test"
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  currentUserId,
  register,
  uniqueEmail,
} from "./helpers"

/**
 * Présence : pilotée par la session STOMP `profile`. B en ligne → A voit « En ligne » sur sa
 * fiche ; B ferme son contexte → après le délai de grâce, A voit « Vu il y a … ».
 */
test("présence : en ligne, puis vu il y a", async ({ browser }) => {
  const errorsA: string[] = []

  const ctxB = await browser.newContext()
  const pageB = await ctxB.newPage()
  await register(pageB, uniqueEmail("presence-b"))
  const idB = await currentUserId(pageB)
  expect(idB).not.toBe("")

  const ctxA = await browser.newContext()
  const pageA = await ctxA.newPage()
  attachErrorCapture(pageA, errorsA)
  await register(pageA, uniqueEmail("presence-a"))

  await pageA.goto(`${BASE}/players/${idB}`, { waitUntil: "domcontentloaded" })

  // B est connecté (session STOMP active) → en ligne.
  await expect(pageA.getByText("En ligne").first()).toBeVisible({
    timeout: 30_000,
  })

  // B se déconnecte : la session se ferme → hors ligne après le délai de grâce.
  await ctxB.close()

  await expect(pageA.getByText(/Vu il y a/).first()).toBeVisible({
    timeout: 60_000,
  })

  assertNoConsoleErrors(errorsA)

  await ctxA.close()
})
