import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/** Dépendances exclues par le kit web (`design/specs/web-kit.md` § 3) : les composants viennent du lab. */
const EXCLUDED = [
  '@radix-ui/*',
  '@base-ui/*',
  'framer-motion',
  'motion',
  'motion/*',
  'cmdk',
  'sonner',
  'embla-carousel*',
  'oidc-client-ts',
  'i18next',
  'react-i18next',
  'lucide-react',
]

const RESTRICTED = {
  patterns: [
    { group: EXCLUDED, message: 'Dépendance exclue par le kit web : porter le composant du lab dans src/ui/.' },
    { group: ['**/design/**', '**/design-system/**'], message: "Aucun import du lab : le composant se porte dans src/ui/." },
    {
      // API publique d'une feature : son barrel `@/features/<nom>` (best-practices/.frontend/folder-structure.md).
      group: ['@/features/*/*'],
      message: "Importe l'API publique d'une feature : '@/features/<nom>'.",
    },
  ],
}

export default defineConfig([
  globalIgnores(['dist', 'public']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-restricted-imports': ['error', RESTRICTED],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    // Composants portés du lab : ils exportent aussi leurs styles et contextes, comme dans le lab.
    files: ['src/ui/**/*.{ts,tsx}', 'src/**/index.ts'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['scripts/**/*.mjs', 'vite.config.ts'],
    languageOptions: { globals: globals.node },
  },
])
