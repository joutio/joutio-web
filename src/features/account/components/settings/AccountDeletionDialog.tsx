import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import AuthOTPVerify from "@/components/ui/auth-otp-verify"
import { AppDialog } from "@/shared/components/app-dialog"
import { SHEET_DETENTS } from "@/shared/theme/sheets"
import { clearSession } from "@/features/auth"
import type { ApiError } from "@/shared/types/api"
import {
  useDeleteAccount,
  useRequestAccountDeletionCode,
} from "../../hooks/useAccountDeletion"

interface AccountDeletionDialogProps {
  open: boolean
  onClose: () => void
  email?: string | null
}

/**
 * Suppression définitive : avertissement puis confirmation par le même composant OTP que
 * la connexion. Aucune phrase à recopier : le code email suffit. La session locale est purgée
 * après succès et l'utilisateur revient au login avec un message dédié.
 */
export function AccountDeletionDialog({
  open,
  onClose,
  email,
}: AccountDeletionDialogProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const requestCode = useRequestAccountDeletionCode()
  const deleteAccount = useDeleteAccount()
  const [step, setStep] = useState<"warning" | "code">("warning")
  const [code, setCode] = useState("")

  const requestError = requestCode.error as ApiError | null
  const deleteError = deleteAccount.error as ApiError | null
  const errorMessage =
    deleteError?.detail ??
    requestError?.detail ??
    (deleteError || requestError
      ? t("shell.settings.danger.dialog.error")
      : undefined)

  const sendCode = () => {
    requestCode.mutate(undefined, {
      onSuccess: () => {
        setCode("")
        setStep("code")
      },
    })
  }

  const submit = (code: string) => {
    deleteAccount.mutate(
      { code },
      {
        onSuccess: () => {
          void clearSession().then(() =>
            navigate("/login?deleted=1", { replace: true })
          )
        },
      }
    )
  }

  return (
    <AppDialog
      open={open}
      onClose={
        requestCode.isPending || deleteAccount.isPending
          ? () => undefined
          : onClose
      }
      title={t("shell.settings.danger.dialog.title")}
      sub={t("shell.settings.danger.dialog.subtitle")}
      sheetOnTouch
      sheetDetents={SHEET_DETENTS.accountDeletion}
      dismissible={!requestCode.isPending && !deleteAccount.isPending}
      footer={
        step === "warning" ? (
          <>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={requestCode.isPending}
            >
              {t("shell.settings.danger.dialog.cancel")}
            </Button>
            <Button onClick={sendCode} disabled={requestCode.isPending}>
              {requestCode.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t("shell.settings.danger.dialog.sendCode")}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={requestCode.isPending || deleteAccount.isPending}
            >
              {t("shell.settings.danger.dialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => submit(code)}
              disabled={code.length !== 6 || deleteAccount.isPending}
            >
              {deleteAccount.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t("shell.settings.danger.dialog.delete")}
            </Button>
          </>
        )
      }
    >
      {step === "warning" ? (
        <div className="flex flex-col gap-5">
          <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{t("shell.settings.danger.dialog.warning")}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("shell.settings.danger.dialog.codeHint", {
              email: email ?? "",
            })}
          </p>
          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AuthOTPVerify
            availableMethods={["email"]}
            autoSubmit={false}
            className="border-0 bg-transparent shadow-none ring-0"
            deliveryAddress={email ?? ""}
            errors={{ general: errorMessage }}
            isLoading={deleteAccount.isPending}
            onResend={sendCode}
            onCodeChange={setCode}
            onSubmit={submit}
            resendCooldown={30}
            hideSubmit
          />
        </div>
      )}
    </AppDialog>
  )
}
