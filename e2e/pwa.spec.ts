import { expect, test } from "@playwright/test"
import { BASE, assertNoConsoleErrors, attachErrorCapture } from "./helpers"

/**
 * PWA : manifest servi et lié dans le HTML, icônes accessibles, Service Worker enregistré
 * (cache images + handlers Web Push). Ne nécessite pas de compte.
 */
test("pwa : manifest, icônes et Service Worker", async ({ page }) => {
  const errors: string[] = []
  attachErrorCapture(page, errors)

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" })

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.json"
  )

  const manifestResponse = await page.request.get(`${BASE}/manifest.json`)
  expect(manifestResponse.ok()).toBe(true)
  const manifest = (await manifestResponse.json()) as {
    name: string
    start_url: string
    display: string
    icons: { src: string; sizes: string; purpose?: string }[]
  }
  expect(manifest.name).toBe("Joutio")
  expect(manifest.start_url).toBe("/")
  // Barre d'état système conservée (infos système), fond synchronisé par `theme-color` dynamique.
  expect(manifest.display).toBe("standalone")
  expect(manifest.icons.length).toBeGreaterThanOrEqual(3)

  for (const icon of manifest.icons) {
    const iconResponse = await page.request.get(`${BASE}${icon.src}`)
    expect(iconResponse.ok(), `${icon.src} doit être servi`).toBe(true)
  }

  const appleIcon = await page.request.get(`${BASE}/icons/apple-touch-icon.png`)
  expect(appleIcon.ok()).toBe(true)

  const swResponse = await page.request.get(`${BASE}/sw.js`)
  expect(swResponse.ok()).toBe(true)
  const swSource = await swResponse.text()
  expect(swSource).toContain('addEventListener("push"')
  expect(swSource).toContain('addEventListener("notificationclick"')

  await page.waitForFunction(
    () => navigator.serviceWorker?.controller != null,
    undefined,
    { timeout: 30_000 }
  )

  assertNoConsoleErrors(errors)
})
