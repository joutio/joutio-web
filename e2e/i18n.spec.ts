import { expect, test } from "@playwright/test"
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  register,
  uniqueEmail,
} from "./helpers"

/**
 * Socle i18n : la langue du profil pilote la langue d'interface (`<html lang>`), le choix
 * est persisté (localStorage) et conservé au rechargement (écrans pré-connexion inclus).
 */
test("langue d'interface : bascule FR→EN et persistance au rechargement", async ({
  page,
}) => {
  const errors: string[] = []
  attachErrorCapture(page, errors)

  await register(page, uniqueEmail("i18n"))
  await expect(page.locator("html")).toHaveAttribute("lang", "fr")

  await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" })
  await page.getByLabel("Langue").click()
  await page.getByRole("option", { name: "English" }).click()

  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("joutio-language")))
    .toBe("en")

  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(page.locator("html")).toHaveAttribute("lang", "en")

  assertNoConsoleErrors(errors)
})
