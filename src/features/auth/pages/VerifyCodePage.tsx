import { useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router-dom"
import AuthOTPVerify from "@/components/ui/auth-otp-verify"
import { AuthShell } from "../components/AuthShell"
import { useLoginWithCode, useRequestLoginCode } from "../hooks/useAuth"

/**
 * Vérification du code de connexion (OTP email). Le composant `AuthOTPVerify`
 * (registre shadcn `@hextaui`) gère la saisie, le renvoi et le cooldown ; la page
 * câble les mutations (vérification puis pipeline OIDC, renvoi du code).
 */
export function VerifyCodePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const email = (location.state as { email?: string } | null)?.email

  const loginWithCode = useLoginWithCode()
  const requestLoginCode = useRequestLoginCode()

  useEffect(() => {
    if (!email) {
      void navigate("/login", { replace: true })
    }
  }, [email, navigate])

  const handleSubmit = useCallback(
    (code: string) => {
      if (!email) return
      loginWithCode.mutate({ email, code })
    },
    [email, loginWithCode]
  )

  const handleResend = useCallback(() => {
    if (!email) return
    requestLoginCode.mutate({ email })
  }, [email, requestLoginCode])

  const generalError = loginWithCode.error
    ? (loginWithCode.error.detail ??
      loginWithCode.error.title ??
      t("auth.code.invalid"))
    : requestLoginCode.isError
      ? (requestLoginCode.error?.detail ?? t("auth.code.resendError"))
      : undefined

  return (
    <AuthShell>
      <AuthOTPVerify
        deliveryAddress={email}
        availableMethods={["email"]}
        autoSubmit={false}
        isLoading={loginWithCode.isPending || requestLoginCode.isPending}
        onSubmit={handleSubmit}
        onResend={handleResend}
        errors={{ general: generalError }}
        className="border-0 bg-transparent shadow-none ring-0"
      />

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link to="/login" className="underline underline-offset-2">
          {t("auth.code.changeEmail")}
        </Link>
      </p>
    </AuthShell>
  )
}
