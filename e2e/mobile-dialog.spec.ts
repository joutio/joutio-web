import { expect, test } from "@playwright/test"
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  register,
  uniqueEmail,
} from "./helpers"

const VIEWPORT = { width: 393, height: 852 }

/**
 * Modales mobiles : plein écran plafonné au visualViewport, en-tête/footer visibles et
 * contenus (cartes, recherche, résultats) accessibles — pas de zone morte sous le clavier.
 */
test("modales mobiles : plein écran et contenus accessibles", async ({
  browser,
}) => {
  const errors: string[] = []
  const context = await browser.newContext()
  const page = await context.newPage()
  attachErrorCapture(page, errors)
  await page.setViewportSize(VIEWPORT)
  await register(page, uniqueEmail("mobile-dialog"))

  // --- Popup « Lancer un duel » (AppDialog) ---
  await page.goto(`${BASE}/topics`, { waitUntil: "domcontentloaded" })
  await page
    .locator(".animate-pulse")
    .first()
    .waitFor({ state: "hidden", timeout: 30_000 })
    .catch(() => {})
  // --- Bande de filtre collante (Sujets / Social) ---
  const topicSearch = page.getByPlaceholder("Chercher parmi tous les sujets…")
  await expect(topicSearch).toBeVisible()
  await page.evaluate(() => {
    const scroll = document.querySelector(".overflow-y-auto")
    if (scroll) scroll.scrollTop = 800
  })
  await page.waitForTimeout(150)
  const searchBox = await topicSearch.boundingBox()
  expect(searchBox!.y).toBeGreaterThan(50) // sous la topbar (h-16)
  expect(searchBox!.y).toBeLessThan(140) // toujours ancrée en haut

  await page.locator('[data-slot="topic-card"]').first().click()
  await page.waitForURL(/\/topics\/[^/]+$/, { timeout: 30_000 })
  await page.getByRole("button", { name: "Lancer un duel" }).click()

  const dialog = page.locator('[data-slot="dialog-content"]')
  await expect(dialog).toBeVisible()
  await page.waitForTimeout(350) // fin de l'animation d'ouverture (zoom)
  const box = await dialog.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeLessThanOrEqual(1)
  expect(box!.y).toBeLessThanOrEqual(1)
  expect(box!.width).toBeGreaterThanOrEqual(VIEWPORT.width - 1)
  expect(box!.height).toBeGreaterThanOrEqual(VIEWPORT.height - 1)

  // Étape « Défier un joueur » : la recherche sticky reste visible, le dialogue tient à l'écran.
  await dialog.getByRole("button", { name: /Défier un joueur/ }).click()
  await dialog.getByRole("button", { name: "Suivant" }).click()
  const search = dialog.getByPlaceholder("Chercher un joueur (2 lettres min)…")
  await expect(search).toBeVisible()
  await search.fill("ad")
  await expect(
    page.getByText("Recherche…").or(page.getByText("Aucun joueur trouvé."))
  ).toBeVisible({
    timeout: 15_000,
  })
  const box2 = await dialog.boundingBox()
  expect(box2!.y + box2!.height).toBeLessThanOrEqual(VIEWPORT.height + 1)
  await dialog.getByRole("button", { name: "Annuler" }).click()
  await expect(dialog).toBeHidden()

  // --- Palette ⌘K (CommandDialog) : plein écran, croix de fermeture, Entrée sans résultat ---
  await page.getByRole("button", { name: "Rechercher" }).click()
  const palette = page.locator('[data-slot="dialog-content"]')
  await expect(palette).toBeVisible()
  await page.waitForTimeout(350)
  const paletteBox = await palette.boundingBox()
  expect(paletteBox!.x).toBeLessThanOrEqual(1)
  expect(paletteBox!.width).toBeGreaterThanOrEqual(VIEWPORT.width - 1)

  const commandInput = palette.locator('[data-slot="command-input"]')
  await commandInput.fill("zzzzzz")
  await expect(
    palette.getByText("Aucun sujet ni utilisateur ne correspond.")
  ).toBeVisible()
  await commandInput.press("Enter")
  await expect
    .poll(() => commandInput.evaluate((el) => document.activeElement !== el))
    .toBe(true)

  await palette.getByRole("button", { name: "Close" }).click()
  await expect(palette).toBeHidden()

  assertNoConsoleErrors(errors)
  await context.close()
})
