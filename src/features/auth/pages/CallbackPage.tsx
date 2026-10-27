import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useSession } from "../hooks/useSession"
import { clearReturnTo, readReturnTo } from "../lib/return-to"

/** Retour du parcours OIDC : échange le code d'autorisation puis redirige. */
export function CallbackPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { completeLogin } = useSession()
  const ran = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    completeLogin()
      .then((user) => {
        // `state` porte la cible mémorisée avant login (ex. lien de salon) ; repli sessionStorage.
        const state =
          (user.state as string | undefined) ?? readReturnTo() ?? "/"
        clearReturnTo()
        void navigate(state, { replace: true })
      })
      .catch((e: unknown) => {
        setError(
          e instanceof Error ? e.message : t("auth.callback.fallbackError")
        )
      })
  }, [navigate, completeLogin, t])

  return (
    <div className="grid min-h-svh place-items-center p-6 text-center">
      {error ? (
        <div className="flex flex-col gap-2">
          <p className="font-semibold">{t("auth.callback.title")}</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("auth.callback.loading")}
        </p>
      )}
    </div>
  )
}
