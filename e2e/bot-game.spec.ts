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
 * Duel contre un bot : valide le cycle de round à deux phases (le chrono ne démarre qu'à la
 * révélation serveur → cartes désactivées jusqu'à `QUESTION_REVEALED`), les 7 tours et le résultat.
 */
test("duel bot : 7 tours puis résultat", async ({ browser }) => {
  const errors: string[] = []
  const context = await browser.newContext()
  const page = await context.newPage()
  attachErrorCapture(page, errors)

  await register(page, uniqueEmail("bot"))

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

  // La salle est l'unique point d'entrée : le bot y est joint automatiquement, le joueur y
  // apparaît puis la partie démarre.
  await page.waitForURL(/\/rooms\/[^/]+$/, { timeout: 30_000 })
  await page.waitForURL(/\/game\/[^/]+$/, { timeout: 30_000 })
  await playUntil(page, "FIN DU DUEL")

  await expect(page.getByText(/Victoire|Défaite|Égalité/).first()).toBeVisible()
  assertNoConsoleErrors(errors)

  await context.close()
})
