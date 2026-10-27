import { expect, test } from "@playwright/test"
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  register,
  uniqueEmail,
} from "./helpers"

const API = process.env.E2E_API_URL ?? "http://localhost:8092"

async function accessToken(
  page: import("@playwright/test").Page
): Promise<string> {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) =>
      k.startsWith("oidc.user:")
    )
    if (!key) return ""
    const user = JSON.parse(localStorage.getItem(key) ?? "{}") as {
      access_token?: string
    }
    return user.access_token ?? ""
  })
}

/**
 * Parcours d'auteur : création d'un brouillon, ajout/modération de questions, publication.
 * Nécessite la stack complète avec le BFF exposant la surface d'auteur.
 */
test("atelier sujet : créer, questionner, approuver puis publier", async ({
  page,
  context,
}) => {
  const errors: string[] = []
  attachErrorCapture(page, errors)

  await register(page, uniqueEmail("author"))

  // L'atelier vit dans la page Sujets : filtre « Mes sujets » + bouton de création.
  await page.goto(`${BASE}/topics`, { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Mes sujets" }).click()
  await expect(page).toHaveURL(/\/topics\?mine=true/)
  await page
    .getByRole("link", { name: /Créer un sujet/ })
    .first()
    .click()
  await page.waitForURL(/\/topics\/new$/)

  await page.fill("#name", "Astronomie E2E")
  await page.fill(
    "#description",
    "Un sujet de test créé par le parcours auteur."
  )
  await page.getByRole("combobox").click()
  await page.getByRole("option", { name: "Sciences" }).click()
  await page.getByRole("button", { name: "Créer le brouillon" }).click()

  await page.waitForURL(/\/topics\/[^/]+\/manage$/, { timeout: 30_000 })
  const topicId = page.url().split("/")[4]
  await expect(page.getByText("Brouillon").first()).toBeVisible()
  await expect(
    page.getByText("0/7 questions approuvées pour publier")
  ).toBeVisible()

  // Première question via l'UI, puis approbation.
  await page
    .getByRole("button", { name: "Ajouter une question" })
    .first()
    .click()
  const dialog = page.locator('div[role="dialog"]')
  await dialog
    .locator("#question-text")
    .fill("Quelle planète est la plus proche du Soleil ?")
  await dialog.getByPlaceholder("Réponse A").fill("Mercure")
  await dialog.getByPlaceholder("Réponse B").fill("Vénus")
  await dialog.getByPlaceholder("Réponse C").fill("Mars")
  await dialog.getByPlaceholder("Réponse D").fill("Jupiter")
  await dialog.getByRole("button", { name: "Enregistrer" }).click()
  await expect(dialog).toBeHidden({ timeout: 30_000 })

  await expect(
    page.getByText("Quelle planète est la plus proche du Soleil ?").first()
  ).toBeVisible({ timeout: 30_000 })
  await page.getByRole("button", { name: "Approuver" }).first().click()
  await expect(
    page.getByText("1/7 questions approuvées pour publier")
  ).toBeVisible({
    timeout: 30_000,
  })

  // Complète à 7 questions approuvées via l'API (plus rapide que 6 formulaires).
  const token = await accessToken(page)
  expect(token).not.toBe("")
  for (let index = 2; index <= 7; index += 1) {
    const response = await context.request.post(
      `${API}/api/topics/${topicId}/questions`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          contents: [
            {
              language: "fr",
              text: `Question E2E numéro ${index}`,
              answers: [
                { choice: "A", text: "Réponse A" },
                { choice: "B", text: "Réponse B" },
                { choice: "C", text: "Réponse C" },
                { choice: "D", text: "Réponse D" },
              ],
            },
          ],
          correctAnswer: "A",
        },
      }
    )
    expect(response.ok()).toBeTruthy()
    const { id } = (await response.json()) as { id: string }
    const approve = await context.request.post(
      `${API}/api/questions/${id}/approve`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    expect(approve.ok()).toBeTruthy()
  }

  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(
    page.getByText("7/7 questions approuvées pour publier")
  ).toBeVisible({
    timeout: 30_000,
  })

  // Publication puis visibilité au catalogue filtré « Mes sujets ».
  await page.getByRole("button", { name: "Publier" }).click()
  await expect(page.getByText("Publié").first()).toBeVisible({
    timeout: 30_000,
  })
  await page.goto(`${BASE}/topics?mine=true`, { waitUntil: "domcontentloaded" })
  await expect(page.getByText("Astronomie E2E")).toBeVisible({
    timeout: 30_000,
  })

  // L'édition du thème se fait depuis la fiche du sujet (bouton réservé au créateur).
  await page.getByText("Astronomie E2E").first().click()
  await page.waitForURL(/\/topics\/[^/]+$/, { timeout: 30_000 })
  await page.getByRole("link", { name: /Éditer le thème/ }).click()
  await page.waitForURL(/\/topics\/[^/]+\/manage$/, { timeout: 30_000 })
  await expect(page.getByText("Publié").first()).toBeVisible()

  assertNoConsoleErrors(errors)
  await context.close()
})
