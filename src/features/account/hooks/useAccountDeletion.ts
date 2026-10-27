import { useMutation } from "@tanstack/react-query"
import { accountDeletionService } from "../lib/account-deletion"

/** Demande le code de confirmation de suppression de compte. */
export function useRequestAccountDeletionCode() {
  return useMutation<void, Error, void>({
    mutationFn: () => accountDeletionService.requestCode(),
  })
}

/** Supprime définitivement le compte après validation du code OTP. */
export function useDeleteAccount() {
  return useMutation<void, Error, { code: string }>({
    mutationFn: ({ code }) => accountDeletionService.delete(code),
  })
}
