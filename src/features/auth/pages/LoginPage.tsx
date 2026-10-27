import { useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthShell } from "../components/AuthShell"
import {
  AuthField,
  AuthSeparator,
  FacebookIcon,
  GoogleIcon,
} from "../components/AuthField"
import { buildRequestCodeSchema, type RequestCodeValues } from "../schemas"
import { useRequestLoginCode } from "../hooks/useAuth"
import { loginRedirect } from "../lib/oidc"
import {
  clearContinue,
  rememberContinue,
  resumeContinue,
} from "../lib/continue-url"
import { readReturnTo } from "../lib/return-to"
import { selectEndReason, useSessionStore } from "../stores/useSessionStore"
import { ENDPOINTS } from "@/lib/endpoints"

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const socialErrorCode = searchParams.get("error")
  const socialErrorMessage =
    socialErrorCode === "account_suspended"
      ? t("auth.login.sessionSuspended")
      : socialErrorCode === "facebook_email_missing"
        ? t("auth.login.facebookEmailMissing")
        : socialErrorCode === "facebookUnavailable"
          ? t("auth.login.facebookUnavailable")
          : t("auth.login.socialError")
  const endReason = useSessionStore(selectEndReason)
  const accountDeleted = searchParams.get("deleted") === "1"
  const requestCodeSchema = useMemo(() => buildRequestCodeSchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestCodeValues>({
    resolver: zodResolver(requestCodeSchema),
    defaultValues: { email: "" },
  })
  const requestLoginCode = useRequestLoginCode()

  // Retour du login social (Google, Facebook) : la session est établie, on enchaîne le PKCE
  // (en conservant la cible mémorisée avant login, ex. lien de salon ou client tiers).
  useEffect(() => {
    if (searchParams.get("social") === "success") {
      if (resumeContinue()) return
      void loginRedirect(readReturnTo() ?? "/")
    }
  }, [searchParams])

  // Client tiers (Grafana, ArgoCD, mobile…) : identity transmet la demande
  // d'autorisation d'origine (`?continue=`) ; elle est reprise après authentification.
  useEffect(() => {
    const target = searchParams.get("continue")
    if (target) {
      rememberContinue(target)
    } else {
      clearContinue()
    }
  }, [searchParams])

  const onSubmit = async (values: RequestCodeValues) => {
    await requestLoginCode.mutateAsync(values)
    void navigate("/login/code", { state: { email: values.email } })
  }

  return (
    <AuthShell>
      <form
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        className="flex flex-col gap-5"
      >
        {accountDeleted ? (
          <p className="rounded-xl border border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
            {t("auth.login.accountDeleted")}
          </p>
        ) : (
          endReason && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center text-xs text-destructive">
              {endReason === "unknownUser"
                ? t("auth.login.sessionUnknownUser")
                : endReason === "suspended"
                  ? t("auth.login.sessionSuspended")
                  : t("auth.login.sessionExpired")}
            </p>
          )
        )}
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em]">
            {t("auth.login.title")}
          </h1>
          <p className="text-sm leading-normal text-muted-foreground">
            {t("auth.login.subtitle")}
          </p>
        </div>

        <AuthField label={t("auth.login.emailLabel")} htmlFor="email">
          <Input
            id="email"
            type="email"
            placeholder={t("auth.login.emailPlaceholder")}
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </AuthField>

        {(requestLoginCode.isError || socialErrorCode !== null) && (
          <p className="text-center text-xs text-destructive">
            {requestLoginCode.error?.detail ?? socialErrorMessage}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || requestLoginCode.isPending}
        >
          {requestLoginCode.isPending
            ? t("auth.login.submitPending")
            : t("auth.login.submit")}
        </Button>

        <AuthSeparator>{t("auth.login.separator")}</AuthSeparator>

        <Button
          type="button"
          size="lg"
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = ENDPOINTS.auth.startGoogleLogin
          }}
        >
          <GoogleIcon /> {t("auth.login.google")}
        </Button>

        <Button
          type="button"
          size="lg"
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = ENDPOINTS.auth.startFacebookLogin
          }}
        >
          <FacebookIcon /> {t("auth.login.facebook")}
        </Button>
      </form>
    </AuthShell>
  )
}
