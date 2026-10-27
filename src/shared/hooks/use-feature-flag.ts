import { useSessionStore, selectIsAdmin } from "@/features/auth"
import { FEATURE_FLAGS, type FeatureFlags } from "@/shared/feature-flags"

/**
 * Flags produit avec accès anticipé par rôle. `topicAuthoring` reste coupé pour les joueurs mais
 * est ouvert aux administrateurs pour préparer la modération de contenu.
 */
const ADMIN_EARLY_ACCESS: ReadonlySet<keyof FeatureFlags> = new Set([
  "topicAuthoring",
])

export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const isAdmin = useSessionStore(selectIsAdmin)
  return FEATURE_FLAGS[flag] || (isAdmin && ADMIN_EARLY_ACCESS.has(flag))
}
