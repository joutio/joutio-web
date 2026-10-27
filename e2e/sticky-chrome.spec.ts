import { expect, test, type Page } from "@playwright/test"
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  register,
  uniqueEmail,
} from "./helpers"

/** Profil sur l'onglet Badges : header sticky (onglets + filtres) et page assez haute. */
async function openStickyProfile(page: Page): Promise<void> {
  await register(page, uniqueEmail("sticky-chrome"))
  await page.goto(`${BASE}/profile?tab=badges`, {
    waitUntil: "domcontentloaded",
  })
  await page
    .locator(".animate-pulse")
    .first()
    .waitFor({ state: "hidden", timeout: 30_000 })
    .catch(() => {})
  await expect(page.locator('[data-slot="page-header-bar"]')).toBeVisible()

  // Garantit un scroll profond même sans historique chargé.
  await page.evaluate(() => {
    const root = document.querySelector("[data-scroll-root]")
    if (!root) return
    const spacer = document.createElement("div")
    spacer.style.height = "2000px"
    root.appendChild(spacer)
  })

  // La barre de filtres de l'onglet actif est portée par le header sticky unique.
  await expect(page.getByPlaceholder("Rechercher un badge…")).toBeVisible({
    timeout: 30_000,
  })
  await expect(
    page.locator('[data-slot="page-header-bar"] [data-slot="search-toolbar"]')
  ).toHaveCount(1)
}

/**
 * Chrome collant compact : onglets et filtres dans **une seule** surface, et retour de la topbar
 * aligné frame par frame avec cette surface.
 */
test("chrome collant : pile unique et retour de topbar sans liseré", async ({
  browser,
}) => {
  const errors: string[] = []
  const context = await browser.newContext({
    reducedMotion: "no-preference",
    viewport: { width: 393, height: 852 },
  })
  const page = await context.newPage()
  attachErrorCapture(page, errors)

  await openStickyProfile(page)

  const topbarBorderColor = () =>
    page.evaluate(() => {
      const topbar = document.querySelector('[data-slot="topbar"]')
      return topbar ? getComputedStyle(topbar).borderBottomColor : ""
    })

  // Scroll edge : aucun séparateur au repos.
  expect(await topbarBorderColor()).toBe("rgba(0, 0, 0, 0)")

  await page.evaluate(() => {
    const root = document.querySelector("[data-scroll-root]")
    if (root) root.scrollTop = 800
  })
  await page.waitForTimeout(450)

  // Le contenu est passé dessous : la hairline apparaît.
  expect(await topbarBorderColor()).not.toBe("rgba(0, 0, 0, 0)")

  // Masquée : les contrôles sortent du focus/AT (visibility différée).
  await expect(page.locator('[data-slot="topbar"]')).toBeHidden()

  const hiddenGap = await page.evaluate(() => {
    const topbar = document.querySelector('[data-slot="topbar"]')
    const header = document.querySelector('[data-slot="page-header-bar"]')
    if (!topbar || !header) return Number.POSITIVE_INFINITY
    return (
      header.getBoundingClientRect().top - topbar.getBoundingClientRect().bottom
    )
  })
  expect(Math.abs(hiddenGap)).toBeLessThanOrEqual(1)

  // Retour : on échantillonne chaque frame ; le bas de la topbar et le haut de la pile restent
  // collés pendant toute la transition.
  const gaps = await page.evaluate(async () => {
    const root = document.querySelector("[data-scroll-root]")
    const topbar = document.querySelector('[data-slot="topbar"]')
    const header = document.querySelector('[data-slot="page-header-bar"]')
    if (!root || !topbar || !header) return []
    root.scrollTop = Math.max(0, root.scrollTop - 300)
    return new Promise<number[]>((resolve) => {
      const samples: number[] = []
      const start = performance.now()
      const tick = () => {
        samples.push(
          header.getBoundingClientRect().top -
            topbar.getBoundingClientRect().bottom
        )
        if (performance.now() - start < 450) requestAnimationFrame(tick)
        else resolve(samples)
      }
      requestAnimationFrame(tick)
    })
  })

  expect(gaps.length).toBeGreaterThan(2)
  expect(Math.max(...gaps.map((gap) => Math.abs(gap)))).toBeLessThanOrEqual(1.5)
  await expect(page.locator('[data-slot="topbar"]')).toBeVisible()

  // Retour en haut : le séparateur s'efface avec la surface pleine.
  await page.evaluate(() => {
    const root = document.querySelector("[data-scroll-root]")
    if (root) root.scrollTop = 0
  })
  await page.waitForTimeout(300)
  expect(await topbarBorderColor()).toBe("rgba(0, 0, 0, 0)")

  assertNoConsoleErrors(errors)
  await context.close()
})

/**
 * Le retour de la topbar ne doit pas être annulé par un rebond descendant juste après la
 * révélation : avec un header sticky déjà collé, cela produirait un aller-retour de 64 px.
 */
test("retour de topbar : la révélation résiste à un rebond descendant", async ({
  browser,
}) => {
  const errors: string[] = []
  const context = await browser.newContext({
    reducedMotion: "no-preference",
    viewport: { width: 393, height: 852 },
  })
  const page = await context.newPage()
  attachErrorCapture(page, errors)

  await openStickyProfile(page)

  const isChromeHidden = () =>
    page.evaluate(
      () =>
        document
          .querySelector("[data-scroll-root]")
          ?.hasAttribute("data-chrome-hidden") ?? false
    )

  await page.evaluate(() => {
    const root = document.querySelector("[data-scroll-root]")
    if (root) root.scrollTop = 800
  })
  await page.waitForFunction(() =>
    document
      .querySelector("[data-scroll-root]")
      ?.hasAttribute("data-chrome-hidden")
  )

  // Remontée franche : le chrome revient.
  await page.evaluate(() => {
    const root = document.querySelector("[data-scroll-root]")
    if (root) root.scrollTop = 500
  })
  await page.waitForFunction(
    () =>
      !document
        .querySelector("[data-scroll-root]")
        ?.hasAttribute("data-chrome-hidden")
  )

  // Rebond descendant immédiat, dans la fenêtre de grâce : le chrome reste visible.
  await page.evaluate(() => {
    const root = document.querySelector("[data-scroll-root]")
    if (root) root.scrollTop = 540
  })
  await page.waitForTimeout(120)
  expect(await isChromeHidden()).toBe(false)

  // Après la grâce, un geste descendant soutenu referme le chrome.
  await page.waitForTimeout(320)
  await page.evaluate(() => {
    const root = document.querySelector("[data-scroll-root]")
    if (root) root.scrollTop = 740
  })
  await page.waitForFunction(() =>
    document
      .querySelector("[data-scroll-root]")
      ?.hasAttribute("data-chrome-hidden")
  )

  assertNoConsoleErrors(errors)
  await context.close()
})
