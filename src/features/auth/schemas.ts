import type { TFunction } from "i18next"
import { z } from "zod"

export function buildRequestCodeSchema(t: TFunction) {
  return z.object({
    email: z.string().email(t("auth.login.emailInvalid")),
  })
}

export function buildVerifyCodeSchema(t: TFunction) {
  return z.object({
    email: z.string().email(t("auth.login.emailInvalid")),
    code: z.string().regex(/^\d{6}$/, t("auth.code.invalidFormat")),
  })
}

export type RequestCodeValues = z.infer<
  ReturnType<typeof buildRequestCodeSchema>
>
export type VerifyCodeValues = z.infer<ReturnType<typeof buildVerifyCodeSchema>>
