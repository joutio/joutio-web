import { expect, test, type Page } from "@playwright/test"
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  register,
  uniqueEmail,
} from "./helpers"

/**
 * Connexion faible : le client doit précharger les images de questions **dès la création de la
 * partie** (les URLs arrivent dans `GAME_CREATED`), pas au moment du round. On retarde les images
 * Wikimedia (~2,5 s par hop, redirection `Special:FilePath` → `upload`) : au reveal, elles
 * doivent déjà être chargées. Sans préchargement, l'`<img>` ne dispose que des ~2 s de lecture
 * de la question et le test échoue.
 */
const IMAGE_DELAY_MS = 2_500
const TOPIC_WITH_IMAGES = "topic-animaux-du-monde"

async function delayQuestionImages(page: Page): Promise<void> {
  await page.route(
    /Special:FilePath|upload\.wikimedia\.org/i,
    async (route) => {
      await new Promise((resolve) => setTimeout(resolve, IMAGE_DELAY_MS))
      await route.continue()
    }
  )
}

test("duel : les images sont préchargées avant le reveal (réseau lent)", async ({
  browser,
}) => {
  const errors: string[] = []
  // Service Worker bloqué : le test doit observer le réseau réel (page.route ne voit pas les
  // requêtes initiées par un SW), le cache client est testé séparément.
  const context = await browser.newContext({ serviceWorkers: "block" })
  const page = await context.newPage()
  attachErrorCapture(page, errors)

  await register(page, uniqueEmail("slow-image"))
  await delayQuestionImages(page)

  await page.goto(`${BASE}/topics/${TOPIC_WITH_IMAGES}`, {
    waitUntil: "domcontentloaded",
  })
  await page
    .getByRole("button", { name: "Lancer un duel" })
    .click({ timeout: 30_000 })
  await page.getByRole("button", { name: /Défier un Bot/ }).click()
  await page.getByRole("button", { name: "Suivant" }).click()
  await page.getByRole("button", { name: /Normal/ }).click()
  await page.getByRole("button", { name: "Lancer" }).click()

  await page.waitForURL(/\/game\/[^/]+$/, { timeout: 30_000 })

  // Le chrono démarre au reveal : à l'activation des réponses, l'image doit être en cache.
  const enabled = page.locator("button.qu-answer:not([disabled])").first()
  await enabled.waitFor({ state: "visible", timeout: 30_000 })

  const image = page.locator('img[src*="Special:FilePath"]').first()
  await expect(image).toBeVisible()
  await expect
    .poll(
      () =>
        image.evaluate(
          (el: HTMLImageElement) => el.complete && el.naturalWidth > 0
        ),
      {
        timeout: 2_500,
        message: "l'image de la question doit être chargée dès le reveal",
      }
    )
    .toBe(true)

  assertNoConsoleErrors(errors)
  await context.close()
})
