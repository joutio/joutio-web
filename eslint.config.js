import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

/**
 * Interdictions d'imports partagées : l'API publique des features, les primitives bannies
 * (switch shadcn, tabs shadcn) et **le gabarit unique des toasts** — `sonner` n'est importé que
 * par le `Toaster` et l'utilitaire partagé (exception déclarée plus bas).
 */
const RESTRICTED_IMPORTS = {
  // `paths` = noms de modules **exacts** (ne pas piéger les alias `@/components/ui/sonner`).
  paths: [
    {
      // Toasts : rendu unique via `ToastCard` (`showToast`) — structure et taille identiques.
      name: "sonner",
      message:
        "Passe par le gabarit unique des toasts : '@/shared/utils/toast' (showToast / showSuccessToast).",
    },
  ],
  patterns: [
    {
      // API publique autorisée : le barrel `@/features/<nom>`, le point d'entrée de route
      // `@/features/<nom>/pages`, et le **contrat partagé** `@/features/<nom>/domain/*`.
      // Tout le reste (implémentation interne) est interdit.
      group: [
        "@/features/*/components/*",
        "@/features/*/hooks/*",
        "@/features/*/lib/*",
        "@/features/*/stores/*",
        "@/features/*/application/*",
        "@/features/*/providers/*",
        "@/features/*/schemas/*",
      ],
      message:
        "Importe l'API publique d'une feature : barrel '@/features/<nom>', route '@/features/<nom>/pages', ou contrat partagé '@/features/<nom>/domain/*'.",
    },
    {
      // Interrupteurs on/off : uniquement le composant SpectrumUI (design system unifié).
      group: ["@/components/ui/switch"],
      message:
        "Utilise l'interrupteur SpectrumUI '@/components/spectrumui/animated-switch' (le switch shadcn est banni).",
    },
    {
      // Onglets : uniquement le composant beui (indicateur animé partagé).
      group: ["@/components/ui/tabs"],
      message:
        "Utilise les onglets beui '@/components/motion/tabs' (les tabs shadcn sont bannis).",
    },
  ],
}

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Paramètres volontairement ignorés préfixés par `_` (ex. signatures historiques conservées).
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Tests E2E Playwright (Node, pas de React).
    files: ["e2e/**/*.ts", "playwright.config.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Règles **type-aware** ciblées (analyse via le service TypeScript) : attrapent les
    // promesses non attendues dans le code applicatif. Le code vendored (design system) est
    // exclu : il suit ses propres conventions.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/**"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
    },
  },
  {
    // API publique des features : on n'importe jamais un fichier interne, seulement le
    // barrel `@/features/<nom>` (cf. best-practices/.frontend/folder-structure.md).
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", RESTRICTED_IMPORTS],
    },
  },
  {
    // Exception au gabarit unique des toasts : seuls le `Toaster` (coque, bouton de fermeture)
    // et l'utilitaire `showToast` importent `sonner` directement.
    files: ["src/components/ui/sonner.tsx", "src/shared/utils/toast.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: RESTRICTED_IMPORTS.patterns },
      ],
    },
  },
  {
    // Les barrels réexportent composants et hooks : la règle fast-refresh ne s'applique pas.
    files: ["src/features/*/index.ts", "src/shared/**/index.ts"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // Design system shadcn, primitifs animate-ui et composants Arc UI (code vendored) : les
    // règles de fast-refresh / immutabilité du scaffold ne s'appliquent pas. Les composites
    // applicatifs (shared/features) restent, eux, soumis aux règles de hooks.
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/components/animate-ui/**/*.{ts,tsx}",
      "src/components/spectrumui/**/*.{ts,tsx}",
      "src/components/motion/**/*.{ts,tsx}",
      "src/components/arc/**/*.{ts,tsx}",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
])
