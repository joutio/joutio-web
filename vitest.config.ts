import { defineConfig, mergeConfig } from "vitest/config"
import viteConfig from "./vite.config"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Par défaut, tests purs (domain/lib) sans DOM ; les tests de composants/hooks UI
      // déclarent `// @vitest-environment jsdom` en tête de fichier.
      environment: "node",
      include: ["src/**/*.test.{ts,tsx}"],
      setupFiles: ["./src/test/setup.ts"],
    },
  })
)
