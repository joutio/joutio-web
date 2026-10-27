import { expect, test, type Page } from "@playwright/test"
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  register,
  uniqueEmail,
} from "./helpers"

/**
 * Garde-fou responsive du contrat device (cf. best-practices/.frontend/responsive-sizing.md) :
 * - aucun débordement horizontal sur les écrans non-duel ;
 * - cibles tactiles >= 44 px et champs >= 16 px sous 1024 px ;
 * - chrome cohérent : nav basse en compact, rail en tablette, sidebar étendue en desktop ;
 * - bandes collantes calées sur la topbar.
 */
const COMPACT = { width: 320, height: 568 }
const PHONE = { width: 393, height: 852 }
const TABLET = { width: 768, height: 1024 }
const DESKTOP = { width: 1280, height: 800 }

const TOUCH_VIEWPORTS = [COMPACT, PHONE, TABLET]
const PAGES = [
  "/",
  "/topics",
  "/social",
  "/challenges",
  "/notifications",
  "/settings",
] as const

interface OverflowReport {
  doc: number
  scroller: number
  scrollerFound: boolean
}

async function measureOverflow(page: Page): Promise<OverflowReport> {
  return page.evaluate(() => {
    const root = document.documentElement
    const scroller = document.querySelector("[data-scroll-root]")
    return {
      doc: root.scrollWidth - root.clientWidth,
      scroller: scroller ? scroller.scrollWidth - scroller.clientWidth : 0,
      scrollerFound: Boolean(scroller),
    }
  })
}

interface SmallTarget {
  selector: string
  width: number
  height: number
}

/**
 * Cibles trop petites pour le tactile. On ignore :
 * - les liens textuels (navigation inline) ;
 * - les interrupteurs/toggles à zone de frappe étendue et le rail de redimensionnement ;
 * - les contrôles embarqués dans un contrôle plus grand (clear d'input-group, switch) ;
 * - les contrôles masqués (largeur/hauteur nulles).
 */
async function findSmallTargets(page: Page): Promise<SmallTarget[]> {
  return page.evaluate(() => {
    const ALLOWED = [
      'a[href]:not([data-slot="button"])',
      '[data-slot="animated-switch"]',
      '[data-slot="sidebar-rail"]',
      '[data-slot="breadcrumb"]',
      '[data-slot="input-group"]',
      "[data-sonner-toast]",
    ]
    const nodes = document.querySelectorAll<HTMLElement>(
      'button, [data-slot="button"], input, select, textarea, [role="button"], [role="tab"]'
    )
    const bad: SmallTarget[] = []
    nodes.forEach((el) => {
      if (
        ALLOWED.some((selector) => el.matches(selector) || el.closest(selector))
      )
        return
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      if (rect.width < 44 || rect.height < 44) {
        bad.push({
          selector:
            `${el.tagName.toLowerCase()}${el.getAttribute("data-slot") ? `[data-slot=${el.getAttribute("data-slot")}]` : ""}`.slice(
              0,
              60
            ) + ` "${(el.textContent ?? "").trim().slice(0, 24)}"`,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        })
      }
    })
    return bad
  })
}

interface RailReport {
  width: number
  containerWidth: number
  left: number
  containerLeft: number
  mask: string
  scrollbarWidth: string
  tracks: number
}

/**
 * Géométrie des rails horizontaux en tactile : ils doivent couvrir **toute** la largeur du
 * `PageContainer` (full-bleed), sans masque de fondu ni barre Arc résiduelle.
 */
async function measureRails(page: Page): Promise<RailReport[]> {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        '[data-slot="horizontal-rail"]'
      ),
    ].map((rail) => {
      const container = rail.closest<HTMLElement>(
        '[data-slot="page-container"]'
      )
      const rect = rail.getBoundingClientRect()
      const containerRect = container?.getBoundingClientRect()
      return {
        width: rect.width,
        containerWidth: containerRect?.width ?? 0,
        left: rect.left,
        containerLeft: containerRect?.left ?? 0,
        mask: getComputedStyle(rail).maskImage,
        scrollbarWidth:
          getComputedStyle(rail).getPropertyValue("scrollbar-width").trim() ||
          "auto",
        tracks: rail.querySelectorAll("[data-axis]").length,
      }
    })
  )
}

async function findSmallInputs(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const bad: string[] = []
    document.querySelectorAll<HTMLElement>("input, textarea").forEach((el) => {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const size = Number.parseFloat(getComputedStyle(el).fontSize)
      if (size < 16) bad.push(`${el.tagName.toLowerCase()} ${size}px`)
    })
    return bad
  })
}

test("contrat responsive : viewports, chrome, cibles et débordements", async ({
  browser,
}) => {
  const errors: string[] = []
  const context = await browser.newContext()
  const page = await context.newPage()
  attachErrorCapture(page, errors)

  await page.setViewportSize(PHONE)
  await register(page, uniqueEmail("responsive"))

  for (const viewport of [...TOUCH_VIEWPORTS, DESKTOP]) {
    await page.setViewportSize(viewport)
    const touch = viewport.width < 1024

    for (const path of PAGES) {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" })
      await page
        .locator(".animate-pulse")
        .first()
        .waitFor({ state: "hidden", timeout: 30_000 })
        .catch(() => {})

      const overflow = await measureOverflow(page)
      expect(
        overflow.scrollerFound,
        `${path} @${viewport.width}: scroller introuvable`
      ).toBe(true)
      expect(
        overflow.doc,
        `${path} @${viewport.width}: débordement horizontal document (${overflow.doc}px)`
      ).toBeLessThanOrEqual(1)
      expect(
        overflow.scroller,
        `${path} @${viewport.width}: débordement horizontal contenu (${overflow.scroller}px)`
      ).toBeLessThanOrEqual(1)

      if (!touch) continue

      // Rails full-bleed : même largeur et même bord gauche que le conteneur de page, sans
      // chrome Arc en tactile (aucun masque, aucune piste de barre).
      const rails = await measureRails(page)
      for (const rail of rails) {
        expect(
          Math.abs(rail.width - rail.containerWidth),
          `${path} @${viewport.width}: rail pas full-bleed (${Math.round(rail.width)} px pour un conteneur de ${Math.round(rail.containerWidth)} px)`
        ).toBeLessThanOrEqual(1)
        expect(
          Math.abs(rail.left - rail.containerLeft),
          `${path} @${viewport.width}: rail désaligné du conteneur (${Math.round(rail.left)} px vs ${Math.round(rail.containerLeft)} px)`
        ).toBeLessThanOrEqual(1)
        expect(
          rail.mask,
          `${path} @${viewport.width}: masque de fondu résiduel en tactile`
        ).toBe("none")
        expect(
          rail.scrollbarWidth,
          `${path} @${viewport.width}: barre de défilement horizontale visible en tactile`
        ).toBe("none")
        expect(
          rail.tracks,
          `${path} @${viewport.width}: barre Arc résiduelle en tactile`
        ).toBe(0)
      }

      const small = await findSmallTargets(page)
      expect(
        small,
        `${path} @${viewport.width}: cibles < 44px\n${small
          .map((t) => `  ${t.selector} (${t.width}x${t.height})`)
          .join("\n")}`
      ).toEqual([])

      const tinyInputs = await findSmallInputs(page)
      expect(
        tinyInputs,
        `${path} @${viewport.width}: champs < 16px (zoom iOS)\n${tinyInputs.join("\n")}`
      ).toEqual([])
    }

    // Chrome par classe de device.
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" })
    const bottomNav = page.getByRole("navigation", {
      name: "Navigation principale",
    })
    const sidebar = page.locator('[data-slot="sidebar-container"]')
    if (viewport.width < 640) {
      await expect(
        bottomNav,
        `nav basse visible @${viewport.width}`
      ).toBeVisible()
      await expect(sidebar, `sidebar masquée @${viewport.width}`).toBeHidden()
    } else if (viewport.width < 1024) {
      await expect(
        bottomNav,
        `nav basse masquée @${viewport.width}`
      ).toBeHidden()
      await expect(sidebar, `rail visible @${viewport.width}`).toBeVisible()
      const box = await sidebar.boundingBox()
      expect(box!.width, `rail replié @${viewport.width}`).toBeLessThan(120)

      // Géométrie du rail : aucun bouton de menu ne déborde (largeur dérivée de --control-h-md).
      const overflow = await page.evaluate(() => {
        const rail = document
          .querySelector('[data-slot="sidebar-container"]')!
          .getBoundingClientRect()
        return [
          ...document.querySelectorAll('[data-slot="sidebar-menu-button"]'),
        ].map((button) => {
          const rect = button.getBoundingClientRect()
          return Math.round(
            Math.max(0, rect.right - rail.right, rail.left - rect.left)
          )
        })
      })
      expect(
        overflow,
        `boutons du rail qui débordent @${viewport.width} (${overflow.join(",")})`
      ).toEqual(overflow.map(() => 0))
    } else {
      await expect(
        bottomNav,
        `nav basse masquée @${viewport.width}`
      ).toBeHidden()
      await expect(sidebar, `sidebar visible @${viewport.width}`).toBeVisible()
      const box = await sidebar.boundingBox()
      expect(box!.width, `sidebar étendue @${viewport.width}`).toBeGreaterThan(
        200
      )
    }
  }

  // Bande de filtres collante : ancrée sous la topbar après scroll (compact + tablette).
  for (const viewport of [PHONE, TABLET]) {
    await page.setViewportSize(viewport)
    await page.goto(`${BASE}/topics`, { waitUntil: "domcontentloaded" })
    await page
      .locator(".animate-pulse")
      .first()
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => {})
    const search = page.getByPlaceholder("Chercher parmi tous les sujets…")
    await expect(search).toBeVisible()
    await page.evaluate(() => {
      const scroll = document.querySelector("[data-scroll-root]")
      if (scroll) scroll.scrollTop = 800
    })
    await page.waitForTimeout(150)
    const box = await search.boundingBox()
    expect(box!.y, `bande collante @${viewport.width}`).toBeGreaterThan(40)
    expect(box!.y, `bande collante @${viewport.width}`).toBeLessThan(120)
  }

  // Gouttière de la topbar : les contrôles tactiles (44 px) ne touchent jamais les bords.
  for (const viewport of [COMPACT, PHONE, TABLET, DESKTOP]) {
    await page.setViewportSize(viewport)
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" })
    const padding = await page
      .locator("header")
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          left: Number.parseFloat(style.paddingLeft),
          right: Number.parseFloat(style.paddingRight),
        }
      })
    expect(
      padding.left,
      `gouttière gauche topbar @${viewport.width}`
    ).toBeGreaterThanOrEqual(18)
    expect(
      padding.right,
      `gouttière droite topbar @${viewport.width}`
    ).toBeGreaterThanOrEqual(18)
  }

  assertNoConsoleErrors(errors)
  await context.close()
})
