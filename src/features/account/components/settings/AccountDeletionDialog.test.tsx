// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { AccountDeletionDialog } from "./AccountDeletionDialog"

const requestCode = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
  error: null,
}))
const deleteAccount = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
  error: null,
}))

vi.mock("../../hooks/useAccountDeletion", () => ({
  useRequestAccountDeletionCode: () => requestCode,
  useDeleteAccount: () => deleteAccount,
}))

vi.mock("@/features/auth", () => ({ clearSession: vi.fn() }))

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  requestCode.mutate.mockReset()
  requestCode.isPending = false
  deleteAccount.mutate.mockReset()
  deleteAccount.isPending = false
  requestCode.mutate.mockImplementation((_value, options) => {
    options?.onSuccess?.()
  })
})

function renderDialog() {
  return render(
    <MemoryRouter>
      <AccountDeletionDialog open onClose={vi.fn()} email="user@joutio.dev" />
    </MemoryRouter>
  )
}

describe("AccountDeletionDialog", () => {
  it("place la suppression définitive dans les actions, à côté d'Annuler", () => {
    renderDialog()
    fireEvent.click(screen.getByRole("button", { name: "Recevoir le code" }))

    expect(screen.getByRole("button", { name: "Annuler" })).toBeInTheDocument()
    const deleteButton = screen.getByRole("button", {
      name: "Supprimer définitivement",
    })
    expect(deleteButton).toBeInTheDocument()
    expect(deleteButton).toBeDisabled()
  })
})
