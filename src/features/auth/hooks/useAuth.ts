import { useMutation } from "@tanstack/react-query"
import { authService, type AuthResponse } from "../lib/auth"
import { loginRedirect } from "../lib/oidc"
import { resumeContinue } from "../lib/continue-url"
import { readReturnTo } from "../lib/return-to"
import type { RequestCodeValues, VerifyCodeValues } from "../schemas"
import type { ApiError } from "@/shared/types/api"

/**
 * Demande l'envoi d'un code de connexion par email.
 */
export function useRequestLoginCode() {
  return useMutation<void, ApiError, RequestCodeValues>({
    mutationFn: (values: RequestCodeValues) =>
      authService.requestLoginCode(values.email),
  })
}

/**
 * Se connecte avec le code (établit la session temporaire) puis enchaîne Authorization
 * Code + PKCE. Le retour se fait sur `/callback`, qui restaure la cible mémorisée avant
 * login (lien de salon). Si identity a transmis une demande d'autorisation d'un client
 * tiers (`?continue=`, ex. Grafana/ArgoCD), on reprend cette cible au lieu du flux SPA.
 */
export function useLoginWithCode() {
  return useMutation<AuthResponse, ApiError, VerifyCodeValues>({
    mutationFn: async (values: VerifyCodeValues) => {
      const response = await authService.loginWithCode(
        values.email,
        values.code
      )
      if (resumeContinue()) return response
      await loginRedirect(readReturnTo() ?? "/")
      return response
    },
  })
}
