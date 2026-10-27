import { expect, test } from "@playwright/test"
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  register,
  uniqueEmail,
} from "./helpers"

/**
 * Nav basse mobile : 5 onglets, navigation, état actif (y compris sous-pages), masquage dans
 * l'éditeur d'avatar (barre d'actions dédiée) et aucun débordement console.
 */
test("nav basse : onglets, navigation et état actif", async ({ browser }) => {
  const errors: string[] = []
  const context = await browser.newContext()
  const page = await context.newPage()
  attachErrorCapture(page, errors)
  await page.setViewportSize({ width: 393, height: 852 })

  await register(page, uniqueEmail("bottom-nav"))

  const nav = page.getByRole("navigation", { name: "Navigation principale" })
  await expect(nav).toBeVisible()
  await expect(nav.getByRole("button")).toHaveCount(5)

  await nav.getByRole("button", { name: "Sujets", exact: true }).click()
  await page.waitForURL(/\/topics/)
  await expect(
    nav.getByRole("button", { name: "Sujets", exact: true })
  ).toHaveAttribute("aria-current", "page")

  // Clavier ouvert (champ texte focalisé) : la nav basse se retire ; Entrée la fait revenir.
  const searchInput = page.getByPlaceholder("Chercher parmi tous les sujets…")
  await searchInput.click()
  await expect(nav).toBeHidden()
  await searchInput.press("Enter")
  await expect(nav).toBeVisible()

  // Sous-page : l'onglet parent reste actif.
  await page
    .locator(".animate-pulse")
    .first()
    .waitFor({ state: "hidden", timeout: 30_000 })
    .catch(() => {})
  await page.locator('[data-slot="topic-card"]').first().click()
  await page.waitForURL(/\/topics\/[^/]+$/, { timeout: 30_000 })
  await expect(
    nav.getByRole("button", { name: "Sujets", exact: true })
  ).toHaveAttribute("aria-current", "page")

  // Fiche joueur : onglet Social actif.
  await page.goto(`${BASE}/players/unknown-player`, {
    waitUntil: "domcontentloaded",
  })
  await expect(
    nav.getByRole("button", { name: "Social", exact: true })
  ).toHaveAttribute("aria-current", "page")

  // Profil couvre aussi Réglages.
  await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" })
  await expect(
    nav.getByRole("button", { name: "Profil", exact: true })
  ).toHaveAttribute("aria-current", "page")

  // Éditeur d'avatar : nav flottante masquée et topbar absente (bandeaux dédiés).
  await page.goto(`${BASE}/settings/avatar`, { waitUntil: "domcontentloaded" })
  await expect(nav).toBeHidden()
  await expect(page.locator("header")).toHaveCount(0)

  assertNoConsoleErrors(errors)
  await context.close()
})
