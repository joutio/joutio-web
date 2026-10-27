import { test } from "@playwright/test"
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  register,
  uniqueEmail,
} from "./helpers"

/**
 * Rechargement en pleine partie : l'intro VS/swoosh est recalée sur `firstRoundAt` et
 * court-circuitée dès que le round courant existe côté serveur. Le client doit rejoindre
 * l'état serveur en < ~1 s (l'ancien comportement rejouait ~4,2 s d'intro + délai de lecture).
 */
test("duel : rechargement en pleine partie sans rejouer l'intro", async ({
  browser,
}) => {
  const errors: string[] = []
  const context = await browser.newContext()
  const page = await context.newPage()
  attachErrorCapture(page, errors)

  await register(page, uniqueEmail("game-reload"))

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
  await page
    .locator("button.qu-answer")
    .first()
    .waitFor({ state: "visible", timeout: 60_000 })

  await page.reload({ waitUntil: "domcontentloaded" })

  // Pas d'intro rejouée : les réponses du round courant sont là quasi immédiatement.
  await page
    .locator("button.qu-answer")
    .first()
    .waitFor({ state: "visible", timeout: 3_500 })

  assertNoConsoleErrors(errors)
  await context.close()
})
