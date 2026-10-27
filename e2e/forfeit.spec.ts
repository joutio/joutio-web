import { expect, test } from "@playwright/test"
import {
  assertNoConsoleErrors,
  attachErrorCapture,
  createPrivateRoom,
  register,
  uniqueEmail,
} from "./helpers"

/**
 * Forfait (lot F) : dans un duel synchrone humain, la fermeture de la session temps réel d'un
 * joueur (connexion STOMP coupée au-delà du délai de grâce de présence) clôt la partie à son
 * détriment — l'adversaire gagne.
 */
test("forfait : un joueur déconnecté perd son duel synchrone", async ({
  browser,
}) => {
  const errorsA: string[] = []
  const errorsB: string[] = []

  const ctxB = await browser.newContext()
  const pageB = await ctxB.newPage()
  attachErrorCapture(pageB, errorsB)
  await register(pageB, uniqueEmail("forfeit-b"))

  const ctxA = await browser.newContext()
  const pageA = await ctxA.newPage()
  attachErrorCapture(pageA, errorsA)
  await register(pageA, uniqueEmail("forfeit-a"))

  // A crée un salon privé partagé et ouvre sa salle d'attente (présence signalée).
  const { joinUrl } = await createPrivateRoom(pageA)
  expect(joinUrl).toContain("/join/")

  // B ouvre le lien de partage → rejoint le salon → les deux basculent dans l'arène.
  await pageB.goto(joinUrl, { waitUntil: "domcontentloaded" })
  await pageB.waitForURL(/\/game\/[^/]+$/, { timeout: 45_000 })
  await pageA.waitForURL(/\/game\/[^/]+$/, { timeout: 45_000 })

  await pageA
    .locator("button.qu-answer")
    .first()
    .waitFor({ state: "visible", timeout: 45_000 })

  // L'abandon explicite n'est plus exposé dans l'arène : la sortie passe par la déconnexion.
  await expect(pageA.getByRole("button", { name: "Abandonner" })).toHaveCount(0)

  // B se déconnecte : sa session STOMP se ferme → forfait après le délai de grâce de présence.
  await ctxB.close()

  await pageA.getByText("FIN DU DUEL").first().waitFor({ timeout: 120_000 })
  await expect(pageA.getByText("Victoire").first()).toBeVisible()
  // L'écran de résultat explicite le forfait subi (« Ton adversaire a abandonné »).
  await expect(
    pageA.getByText("Ton adversaire a abandonné").first()
  ).toBeVisible()

  assertNoConsoleErrors(errorsA)

  await ctxA.close()
})
