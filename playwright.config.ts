import { defineConfig, devices } from "@playwright/test"

/**
 * Configuration Playwright pour les parcours E2E de Joutio.
 *
 * Les tests nécessitent la **stack complète** (Postgres/Kafka + les microservices + l'app web).
 * Par défaut, le serveur Vite est démarré automatiquement ; pour cibler un environnement
 * déjà lancé (staging, runner), définir `E2E_BASE_URL`.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173"

export default defineConfig({
  testDir: "./e2e",
  timeout: 8 * 60 * 1000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    // Les parcours existants asservissent des libellés français : le navigateur de test
    // doit résoudre la langue d'interface par défaut en fr (profils de test fr).
    locale: "fr-FR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
})
