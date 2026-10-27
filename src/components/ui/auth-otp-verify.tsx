"use client"

import { Loader2, Mail, MessageSquare, Phone, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { TranslationKey } from "@/lib/i18n/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeading,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type OTPDeliveryMethod = "email" | "sms" | "whatsapp"

export interface AuthOTPVerifyProps {
  deliveryMethod?: OTPDeliveryMethod
  deliveryAddress?: string
  onDeliveryMethodChange?: (method: OTPDeliveryMethod) => void
  onSubmit?: (code: string) => void
  onResend?: (method: OTPDeliveryMethod) => void
  /** Remonte la saisie pour un bouton de validation rendu hors du composant (footer). */
  onCodeChange?: (code: string) => void
  /** Masque le bouton interne (le parent porte l'action dans le footer). */
  hideSubmit?: boolean
  className?: string
  isLoading?: boolean
  resendCooldown?: number
  errors?: {
    code?: string
    general?: string
  }
  autoSubmit?: boolean
  codeLength?: number
  availableMethods?: OTPDeliveryMethod[]
  /** Libellé du bouton de validation (défaut : « Vérifier »). */
  submitLabel?: string
  /** Variante du bouton de validation (défaut : primaire). */
  submitVariant?: "default" | "destructive"
}

const DELIVERY_METHOD_CONFIG: Record<
  OTPDeliveryMethod,
  {
    label: string
    titleKey: TranslationKey
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  email: {
    label: "Email",
    titleKey: "shared.otp.emailTitle",
    icon: Mail,
  },
  sms: {
    label: "SMS",
    titleKey: "shared.otp.smsTitle",
    icon: MessageSquare,
  },
  whatsapp: {
    label: "WhatsApp",
    titleKey: "shared.otp.whatsappTitle",
    icon: Phone,
  },
}

function formatDeliveryAddress(
  address: string | undefined,
  method: OTPDeliveryMethod
): string {
  if (!address) return ""
  if (method === "email") return address
  if (address.length > 4) {
    const visible = address.slice(-4)
    const masked = "*".repeat(address.length - 4)
    return `${masked}${visible}`
  }
  return address
}

interface ErrorAlertProps {
  message: string
}

function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div
      aria-live="polite"
      className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
      role="alert"
    >
      {message}
    </div>
  )
}

interface DeliveryMethodSelectProps {
  availableMethods: OTPDeliveryMethod[]
  deliveryMethod: OTPDeliveryMethod
  onDeliveryMethodChange: (method: OTPDeliveryMethod) => void
}

function DeliveryMethodSelect({
  availableMethods,
  deliveryMethod,
  onDeliveryMethodChange,
}: DeliveryMethodSelectProps) {
  const { t } = useTranslation()
  return (
    <Field>
      <FieldLabel>{t("shared.otp.methodLabel")}</FieldLabel>
      <FieldContent>
        <Select
          onValueChange={(value) =>
            onDeliveryMethodChange(value as OTPDeliveryMethod)
          }
          value={deliveryMethod}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMethods.map((method) => {
              const config = DELIVERY_METHOD_CONFIG[method]
              const Icon = config.icon
              return (
                <SelectItem key={method} value={method}>
                  <div className="flex items-center gap-2">
                    <Icon aria-hidden="true" className="size-4" />
                    {config.label}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <FieldDescription>{t("shared.otp.methodDescription")}</FieldDescription>
      </FieldContent>
    </Field>
  )
}

interface ResendButtonProps {
  cooldown: number
  isLoading: boolean
  onClick: () => void
}

function ResendButton({ cooldown, isLoading, onClick }: ResendButtonProps) {
  const { t } = useTranslation()
  return (
    <button
      className="min-h-[32px] touch-manipulation self-start rounded-sm hover:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
      disabled={cooldown > 0 || isLoading}
      onClick={onClick}
      type="button"
    >
      {cooldown > 0 ? (
        t("shared.otp.resendIn", { count: cooldown })
      ) : (
        <span className="flex items-center gap-1">
          <RefreshCw aria-hidden="true" className="size-3" />
          {t("shared.otp.resend")}
        </span>
      )}
    </button>
  )
}

interface OTPFieldProps {
  code: string
  codeError?: string
  codeLength: number
  isLoading: boolean
  onCodeChange: (code: string) => void
  onResend?: () => void
  resendCooldown: number
}

function OTPField({
  code,
  codeError,
  codeLength,
  isLoading,
  onCodeChange,
  onResend,
  resendCooldown,
}: OTPFieldProps) {
  const { t } = useTranslation()
  return (
    <Field data-invalid={!!codeError}>
      <FieldLabel htmlFor="otp-code">
        {t("shared.otp.codeLabel")}
        <span
          aria-label={t("shared.otp.required")}
          className="text-destructive"
        >
          *
        </span>
      </FieldLabel>
      <FieldContent>
        <InputOTP
          aria-describedby={codeError ? "otp-code-error" : undefined}
          aria-invalid={!!codeError}
          disabled={isLoading}
          id="otp-code"
          maxLength={codeLength}
          onChange={onCodeChange}
          value={code}
        >
          <InputOTPGroup>
            {Array.from({ length: codeLength }).map((_, index) => (
              <InputOTPSlot index={index} key={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {codeError && <FieldError id="otp-code-error">{codeError}</FieldError>}
        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{t("shared.otp.codeHint", { count: codeLength })}</span>
          {onResend && (
            <ResendButton
              cooldown={resendCooldown}
              isLoading={isLoading}
              onClick={onResend}
            />
          )}
        </div>
      </FieldContent>
    </Field>
  )
}

interface VerifyButtonProps {
  code: string
  codeLength: number
  isLoading: boolean
  onSubmit: (code: string) => void
  label?: string
  variant?: "default" | "destructive"
}

function VerifyButton({
  code,
  codeLength,
  isLoading,
  onSubmit,
  label,
  variant = "default",
}: VerifyButtonProps) {
  const { t } = useTranslation()
  return (
    <Button
      aria-busy={isLoading}
      className="min-h-[44px] w-full touch-manipulation"
      data-loading={isLoading}
      disabled={isLoading || code.length !== codeLength}
      onClick={() => onSubmit(code)}
      type="button"
      variant={variant}
    >
      {isLoading ? (
        <>
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          {t("shared.otp.verifying")}
        </>
      ) : (
        (label ?? t("shared.otp.submit"))
      )}
    </Button>
  )
}

export default function AuthOTPVerify({
  deliveryMethod = "email",
  deliveryAddress,
  onDeliveryMethodChange,
  onSubmit,
  onResend,
  onCodeChange,
  hideSubmit = false,
  className,
  isLoading = false,
  resendCooldown = 60,
  errors,
  autoSubmit = true,
  codeLength = 6,
  availableMethods = ["email", "sms"],
  submitLabel,
  submitVariant = "default",
}: AuthOTPVerifyProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState("")
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  useEffect(() => {
    if (autoSubmit && code.length === codeLength && !isLoading) {
      onSubmit?.(code)
    }
  }, [code, autoSubmit, isLoading, codeLength, onSubmit])

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return
    await onResend?.(deliveryMethod)
    setCooldown(resendCooldown)
  }, [cooldown, onResend, deliveryMethod, resendCooldown])

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode)
      onCodeChange?.(newCode)
    },
    [onCodeChange]
  )

  const codeError = errors?.code
  const generalError = errors?.general
  const methodConfig = DELIVERY_METHOD_CONFIG[deliveryMethod]
  const formattedAddress = formatDeliveryAddress(
    deliveryAddress,
    deliveryMethod
  )

  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <CardHeader>
        <CardHeading>
          <CardTitle className="flex items-center gap-2">
            {t(methodConfig.titleKey)}
          </CardTitle>
          <CardDescription>
            {t("shared.otp.sentTo", { count: codeLength })}{" "}
            {deliveryAddress ? (
              <span className="font-medium">{formattedAddress}</span>
            ) : (
              t("shared.otp.sentToFallback", {
                method: methodConfig.label.toLowerCase(),
              })
            )}
            .
          </CardDescription>
        </CardHeading>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {generalError && <ErrorAlert message={generalError} />}

          {availableMethods.length > 1 && onDeliveryMethodChange && (
            <DeliveryMethodSelect
              availableMethods={availableMethods}
              deliveryMethod={deliveryMethod}
              onDeliveryMethodChange={onDeliveryMethodChange}
            />
          )}

          <OTPField
            code={code}
            codeError={codeError}
            codeLength={codeLength}
            isLoading={isLoading}
            onCodeChange={handleCodeChange}
            onResend={onResend ? handleResend : undefined}
            resendCooldown={cooldown}
          />

          {!autoSubmit && !hideSubmit && (
            <VerifyButton
              code={code}
              codeLength={codeLength}
              isLoading={isLoading}
              onSubmit={onSubmit || (() => {})}
              label={submitLabel}
              variant={submitVariant}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
