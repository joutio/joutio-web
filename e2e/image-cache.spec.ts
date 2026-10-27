import { expect, test } from "@playwright/test"
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  register,
  uniqueEmail,
} from "./helpers"

/** Nom du cache du Service Worker (`public/sw.js`) — à garder synchronisé. */
const IMAGE_CACHE = "joutio-images-v3"

/**
 * Cache client des images : le Service Worker stocke les visuels Wikimedia dans le Cache Storage
 * (les redirections `Special:FilePath` ne sont pas cacheables par le navigateur) puis les sert
 * sans réseau. On vérifie l'entrée de cache **et** le chargement hors ligne.
 */
test("images : mises en cache client par le Service Worker", async ({
  browser,
}) => {
  const errors: string[] = []
  const context = await browser.newContext()
  const page = await context.newPage()
  attachErrorCapture(page, errors)

  await register(page, uniqueEmail("img-cache"))

  // Le SW doit contrôler la page AVANT le premier chargement des visuels à tester.
  await page.waitForFunction(
    () => navigator.serviceWorker?.controller != null,
    undefined,
    { timeout: 30_000 }
  )

  await page.goto(`${BASE}/topics`, { waitUntil: "domcontentloaded" })
  const firstImage = page.locator('img[src*="Special:FilePath"]').first()
  await firstImage.waitFor({ state: "visible", timeout: 30_000 })
  const imageUrl = await firstImage.getAttribute("src")
  expect(imageUrl).toBeTruthy()
  await expect
    .poll(
      () =>
        firstImage.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0
        ),
      { timeout: 30_000 }
    )
    .toBe(true)

  // L'image est bien stockée dans le Cache Storage client (écriture SW asynchrone).
  await expect
    .poll(
      () =>
        page.evaluate(
          async ({ cacheName, url }) => {
            const cache = await caches.open(cacheName)
            return (await cache.match(url)) != null
          },
          { cacheName: IMAGE_CACHE, url: imageUrl as string }
        ),
      { timeout: 30_000 }
    )
    .toBe(true)

  // Hors ligne : l'image est servie depuis le cache du SW, sans réseau.
  await context.setOffline(true)
  const loadedOffline = await page.evaluate(
    (url) =>
      new Promise<boolean>((resolve) => {
        const image = new Image()
        image.onload = () => resolve(true)
        image.onerror = () => resolve(false)
        image.src = url
      }),
    imageUrl as string
  )
  await context.setOffline(false)

  expect(loadedOffline).toBe(true)
  assertNoConsoleErrors(errors)
  await context.close()
})
