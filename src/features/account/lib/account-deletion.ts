import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"

/** Demande le code OTP de suppression sur l'email du compte courant. */
export const accountDeletionService = {
  requestCode: (): Promise<void> =>
    api.post<void>(ENDPOINTS.accountDeletion.code, undefined, {
      skipErrorBus: true,
    }),

  delete: (code: string): Promise<void> =>
    api.delete<void>(ENDPOINTS.me, {
      body: { code },
      skipErrorBus: true,
    }),
}
