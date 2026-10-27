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
 * Page résultat dédiée (`/game/{id}/result`) : l'arène redirige à la fin de la partie ; en
 * **desktop**, la revue des questions est un **carousel shadcn** dans le mockup tablette
 * (`[data-slot=game-frame]`) — colonne gauche = bilan mobile, colonne droite = questions ; en
 * **tactile**, la pile plein écran + chevron DETAILS ouvrent la bottom sheet, qui accueille le
 * même carousel. Navigation par boutons libellés « Précédent » / « Suivant ».
 */
test("duel bot : page résultat dédiée et revue des questions", async ({
  browser,
}) => {
  const errors: string[] = []
  const context = await browser.newContext()
  const page = await context.newPage()
  attachErrorCapture(page, errors)

  await register(page, uniqueEmail("review"))

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
  await playUntil(page, "FIN DU DUEL")

  // Fin de partie : l'arène redirige vers la page résultat dédiée.
  await page.waitForURL(/\/game\/[^/]+\/result$/, { timeout: 30_000 })

  const frame = page.locator('[data-slot="game-frame"]')
  await expect(frame).toBeVisible()
  const viewport = (await page.viewportSize())!
  const frameBox = (await frame.boundingBox())!
  expect(frameBox.width, "cadre plus étroit que le viewport").toBeLessThan(
    viewport.width
  )
  expect(
    Math.abs(frameBox.width / frameBox.height - 4 / 3),
    "cadre au ratio 4:3"
  ).toBeLessThan(0.02)

  // Desktop : carousel shadcn dans la colonne droite, pas de chevron DETAILS.
  await expect(
    page.getByRole("button", { name: "Ouvrir la revue des questions" })
  ).toHaveCount(0)
  await expect(page.getByText("QUESTION 1 : 7")).toBeVisible({
    timeout: 15_000,
  })

  await page.getByRole("button", { name: "Suivant" }).click()
  await expect(page.getByText("QUESTION 2 : 7")).toBeVisible()
  await page.getByRole("button", { name: "Précédent" }).click()
  await expect(page.getByText("QUESTION 1 : 7")).toBeVisible()

  // Tactile : plein écran (pas de cadre) + pile bornée + DETAILS → bottom sheet.
  await page.setViewportSize({ width: 393, height: 852 })
  const phoneFrameBox = (await frame.boundingBox())!
  expect(
    phoneFrameBox.width,
    "tactile : pas de cadre, le duel remplit l'écran"
  ).toBeGreaterThanOrEqual(392)

  const openReview = page.getByRole("button", {
    name: "Ouvrir la revue des questions",
  })
  await expect(openReview).toBeVisible()
  await openReview.click()
  await expect(page.getByText("QUESTION 1 : 7")).toBeVisible({
    timeout: 15_000,
  })
  await page.getByRole("button", { name: "Suivant" }).click()
  await expect(page.getByText("QUESTION 2 : 7")).toBeVisible()
  await page.getByRole("button", { name: "Fermer la revue" }).click()
  await expect(page.getByText("QUESTION 1 : 7")).toBeHidden()

  await expect(page.getByText("FIN DU DUEL")).toBeVisible()

  assertNoConsoleErrors(errors)

  await context.close()
})
