import { expect, test } from "@playwright/test"
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  register,
  uniqueEmail,
} from "./helpers"

/**
 * Reprise : une partie en cours (duel bot démarré puis quitté sans abandon) est proposée sur
 * l'Accueil via la bannière « Partie en cours — Rejoindre », qui ramène dans la même arène.
 */
test("reprise : bannière « Partie en cours » et retour dans l'arène", async ({
  browser,
}) => {
  const errors: string[] = []
  const context = await browser.newContext()
  const page = await context.newPage()
  attachErrorCapture(page, errors)

  await register(page, uniqueEmail("resume"))

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
  const gameId = page.url().split("/").pop()
  // La partie a démarré : la première question est répondable.
  await page
    .locator("button.qu-answer")
    .first()
    .waitFor({ state: "visible", timeout: 45_000 })

  // Retour à l'Accueil sans abandonner : la bannière de reprise doit apparaître.
  await page.goto(BASE, { waitUntil: "domcontentloaded" })
  await expect(page.getByText("Partie en cours").first()).toBeVisible({
    timeout: 30_000,
  })

  await page.getByRole("button", { name: "Rejoindre" }).click()
  await page.waitForURL(new RegExp(`/game/${gameId}$`), { timeout: 30_000 })

  assertNoConsoleErrors(errors)
  await context.close()
})
