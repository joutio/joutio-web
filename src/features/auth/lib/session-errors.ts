/**
 * Classification des échecs de renouvellement de session.
 *
 * Un refresh peut échouer de deux façons très différentes :
 * - **définitif** : le refresh token n'est plus utilisable (révoqué, rotation perdue,
 *   client inconnu) — la session est terminée, il faut repasser par le login ;
 * - **transitoire** : réseau coupé, timeout, 5xx, erreur serveur temporaire — le refresh
 *   token reste valide, il ne faut **jamais** purger la session.
 *
 * Toute erreur non reconnue est considérée transitoire : purger une session valide est
 * irréversible côté expérience (re-login imposé), attendre est réversible.
 */
const DEFINITIVE_OAUTH_ERRORS = new Set([
  "invalid_grant",
  "invalid_token",
  "invalid_client",
  "unauthorized_client",
])

export type RefreshFailureKind = "definitive" | "transient"

/** Classe un échec de `signinSilent` (ErrorResponse OAuth, erreur réseau, inconnu). */
export function classifyRefreshFailure(error: unknown): RefreshFailureKind {
  if (typeof error === "object" && error !== null) {
    const code = (error as { error?: unknown }).error
    if (typeof code === "string" && DEFINITIVE_OAUTH_ERRORS.has(code)) {
      return "definitive"
    }
  }
  return "transient"
}
