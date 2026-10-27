import { expect, test, type Page } from "@playwright/test"
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  currentUserId,
  playUntil,
  register,
  uniqueEmail,
} from "./helpers"

/** Ouvre le premier sujet et renvoie son URL (partagée par les deux joueurs). */
async function openFirstTopic(page: Page): Promise<string> {
  await page.goto(`${BASE}/topics`, { waitUntil: "domcontentloaded" })
  await page
    .locator(".animate-pulse")
    .first()
    .waitFor({ state: "hidden", timeout: 30_000 })
    .catch(() => {})
  await page.locator('[data-slot="topic-card"]').first().click()
  await page.waitForURL(/\/topics\/[^/]+$/, { timeout: 30_000 })
  return page.url()
}

/** Lance une recherche d'adversaire en direct (« Défier le monde ») depuis une fiche sujet. */
async function enqueueLive(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Lancer un duel" }).click()
  await page.getByRole("button", { name: /Défier le monde/ }).click()
  await page.getByRole("button", { name: "Lancer" }).click()
  await page.waitForURL(/\/matchmaking\/[^/]+$/, { timeout: 30_000 })
}

/**
 * Matchmaking humain : deux joueurs en file sur le même sujet sont appariés, puis jouent.
 * L'arène et la bascule vers la partie sont pilotées par le read model de notifications
 * (aucun polling).
 */
test("matchmaking : appariement en direct puis arène", async ({ browser }) => {
  const errorsA: string[] = []
  const errorsB: string[] = []

  const ctxB = await browser.newContext()
  const pageB = await ctxB.newPage()
  attachErrorCapture(pageB, errorsB)
  await register(pageB, uniqueEmail("mm-b"))
  const idB = await currentUserId(pageB)
  expect(idB).not.toBe("")

  const ctxA = await browser.newContext()
  const pageA = await ctxA.newPage()
  attachErrorCapture(pageA, errorsA)
  await register(pageA, uniqueEmail("mm-a"))

  // Un seul sujet de référence pour les deux joueurs.
  const topicUrl = await openFirstTopic(pageA)

  await pageA.goto(topicUrl, { waitUntil: "domcontentloaded" })
  await enqueueLive(pageA)

  await pageB.goto(topicUrl, { waitUntil: "domcontentloaded" })
  await enqueueLive(pageB)

  // Les deux basculent dans la même salle via la notification MATCHED (roomId partagé), y
  // apparaissent, puis la partie démarre (la salle prépare la game).
  await pageA.waitForURL(/\/rooms\/[^/]+$/, { timeout: 45_000 })
  await pageB.waitForURL(/\/rooms\/[^/]+$/, { timeout: 45_000 })

  const roomIdA = pageA.url().split("/").pop()
  const roomIdB = pageB.url().split("/").pop()
  expect(roomIdA).toBeTruthy()
  expect(roomIdA).toBe(roomIdB)

  await pageA.waitForURL(/\/game\/[^/]+$/, { timeout: 45_000 })
  await pageB.waitForURL(/\/game\/[^/]+$/, { timeout: 45_000 })

  const gameIdA = pageA.url().split("/").pop()
  const gameIdB = pageB.url().split("/").pop()
  expect(gameIdA).toBeTruthy()
  expect(gameIdA).toBe(gameIdB)

  await playUntil(pageA, "FIN DU DUEL")
  await expect(
    pageA.getByText(/Victoire|Défaite|Égalité/).first()
  ).toBeVisible()

  assertNoConsoleErrors([...errorsA, ...errorsB])

  await ctxA.close()
  await ctxB.close()
})
