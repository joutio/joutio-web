// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { Button } from "@/components/ui/button"

vi.mock("@/shared/hooks/use-device", () => ({
  useIsTouchLayout: () => true,
}))

import { AppDialog } from "./app-dialog"

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("AppDialog (bottom sheet compact)", () => {
  it("place la confirmation au-dessus de l'annulation", () => {
    render(
      <AppDialog
        open
        onClose={vi.fn()}
        title="Confirmation"
        sheetOnTouch
        footer={
          <>
            <Button variant="outline">Annuler</Button>
            <Button>Confirmer</Button>
          </>
        }
      >
        <p>Contenu</p>
      </AppDialog>
    )

    const confirm = screen.getByRole("button", { name: "Confirmer" })
    // Le footer est une colonne inversée : le dernier enfant (confirmation) est en haut.
    expect(confirm.parentElement).toHaveClass("flex-col-reverse")
  })
})
