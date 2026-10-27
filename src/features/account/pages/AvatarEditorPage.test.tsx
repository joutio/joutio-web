// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { defaultOptionsFor, loadAllAvatarStyles } from "@/shared/avatar/styles"
import { AvatarEditorPage } from "./AvatarEditorPage"

const state = vi.hoisted(() => ({
  me: null as Record<string, unknown> | null,
}))

vi.mock("@/features/shell", () => ({
  useMe: () => ({ data: state.me, isLoading: false, userId: "user-1" }),
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

vi.mock("../hooks/useUpdateProfile", () => ({
  useUpdateProfile: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock("@/shared/hooks/useGoBack", () => ({
  useGoBack: () => () => undefined,
}))

beforeAll(async () => {
  await i18n.changeLanguage("fr")
  await loadAllAvatarStyles()
})

describe("AvatarEditorPage — changement de style", () => {
  it("conserve l'onglet Style au lieu de revenir sur le premier onglet", async () => {
    state.me = {
      userId: "user-1",
      pseudonym: "Nadjim",
      avatarOptions: JSON.stringify(defaultOptionsFor("lorelei")),
      premium: true,
      rewards: [],
    }

    render(<AvatarEditorPage />)

    const styleTab = await screen.findByRole("tab", { name: /Style/ })
    fireEvent.click(styleTab)
    expect(styleTab).toHaveAttribute("aria-selected", "true")

    fireEvent.click(screen.getByRole("button", { name: /Notionists/ }))

    expect(screen.getByRole("tab", { name: /Style/ })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(screen.getByRole("tab", { name: /Visage/ })).toHaveAttribute(
      "aria-selected",
      "false"
    )
    expect(screen.getByRole("button", { name: /Notionists/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })
})
