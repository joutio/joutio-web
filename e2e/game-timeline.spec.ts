import { expect, test } from "@playwright/test"
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  playUntil,
  register,
  uniqueEmail,
} from "./helpers"

/**
 * Synchronisation de l'arène sur le timing serveur : le splash VS s'ouvre, chaque round est
 * annoncé avant la question, et le chrono décompte réellement (il suit la deadline serveur).
 *
 * Ces assertions couvrent la régression « aucune animation + timer figé » : une fenêtre
 * d'animation dont l'instant serveur est actif doit toujours être jouée.
 */
test("duel : VS, annonce du round et chrono synchronisés", async ({
  browser,
}) => {
  const errors: string[] = []
  const context = await browser.newContext()
  const page = await context.newPage()
  attachErrorCapture(page, errors)

  await register(page, uniqueEmail("game-timeline"))

  await page.goto(`${BASE}/topics`, { waitUntil: "domcontentloaded" })
  await page
    .locator(".animate-pulse")
    .first()
    .waitFor({ state: "hidden", timeout: 30_000 })
    .catch(() => {})
  await page.locator('[data-slot="topic-card"]').first().click()
  await page.waitForURL(/\/topics\/[^/]+$/, { timeout: 30_000 })

  await page.getByRole("button", { name: "Lancer un duel" }).click()
  await page.getByRole("button", { name: /Défier un Bot/ }).click()
  await page.getByRole("button", { name: "Suivant" }).click()
  await page.getByRole("button", { name: /Normal/ }).click()
  await page.getByRole("button", { name: "Lancer" }).click()

  await page.waitForURL(/\/game\/[^/]+$/, { timeout: 30_000 })

  // Splash VS : la fenêtre serveur `GAME_STARTED.firstRoundAt` est active, l'écran s'ouvre.
  await expect(page.locator(".qu-vs-panel-top")).toBeVisible({
    timeout: 15_000,
  })

  // Annonce du tour 1 avant la question.
  await expect(page.getByText(/TOUR\s*1/)).toBeVisible({ timeout: 15_000 })

  // Chrono : il démarre à la révélation puis décompte (deadline serveur).
  const timer = page.getByRole("timer")
  await expect(timer).toBeVisible({ timeout: 15_000 })
  await expect
    .poll(async () => Number((await timer.textContent())?.trim() ?? 10), {
      timeout: 15_000,
      intervals: [100, 250, 500],
    })
    .toBeLessThan(10)
  const before = Number((await timer.textContent())?.trim() ?? 0)
  await page.waitForTimeout(1_100)
  const after = Number((await timer.textContent())?.trim() ?? 0)
  expect(after, `chrono ${before} → ${after}`).toBeLessThan(before)

  // Répond au round 1, le round 2 doit être annoncé avant sa question.
  const enabled = page.locator("button.qu-answer:not([disabled])").first()
  await enabled.click({ timeout: 15_000 })
  await expect(page.getByText(/TOUR\s*2/)).toBeVisible({ timeout: 20_000 })

  await playUntil(page, "FIN DU DUEL")
  assertNoConsoleErrors(errors)
  await context.close()
})
