// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import {
  BASE_AVATAR_STYLE,
  BASE_BACKGROUND_GROUP_ID,
  DEFAULT_BASE_AVATAR_BACKGROUND,
} from "@/shared/avatar/config"
import {
  defaultOptionsFor,
  getAvatarStyle,
  loadAllAvatarStyles,
  STYLE_GROUP_ID,
} from "@/shared/avatar/styles"
import { AvatarEditor } from "./avatar-editor"

beforeAll(async () => {
  await i18n.changeLanguage("fr")
  await loadAllAvatarStyles()
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList
})

const baseDraft = {
  style: BASE_AVATAR_STYLE,
  backgroundColor: DEFAULT_BASE_AVATAR_BACKGROUND,
} as const

function renderEditor(
  premium: boolean,
  micahUnlocked = false,
  onDraftChange = vi.fn(),
  groupId = STYLE_GROUP_ID
) {
  render(
    <AvatarEditor
      draft={baseDraft}
      groupId={groupId}
      groups={[]}
      premium={premium}
      micahUnlocked={micahUnlocked}
      onDraftChange={onDraftChange}
      onStyleChange={vi.fn()}
    />
  )
  return onDraftChange
}

describe("AvatarEditor — styles Premium", () => {
  it("laisse l'avatar de base et le choix du fond à un compte gratuit", () => {
    renderEditor(false)

    expect(
      screen.getByRole("button", { name: /Avatar de base/ })
    ).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: /Micah/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Lorelei/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Notionists/ })).toBeDisabled()
  })

  it("affiche le fond dans son propre onglet avec les variantes de palette", () => {
    const onChange = renderEditor(
      false,
      false,
      vi.fn(),
      BASE_BACKGROUND_GROUP_ID
    )

    expect(screen.getByText("Couleur de fond")).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText("#dbeafe"))
    expect(onChange).toHaveBeenCalledWith({
      style: BASE_AVATAR_STYLE,
      backgroundColor: "#dbeafe",
    })
  })

  it("débloque Micah par la récompense sans débloquer les styles Premium", () => {
    renderEditor(false, true)

    expect(screen.getByRole("button", { name: /Micah/ })).toBeEnabled()
    expect(screen.getByRole("button", { name: /Lorelei/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Notionists/ })).toBeDisabled()
  })

  it("débloque tous les styles DiceBear pour un compte Premium", () => {
    renderEditor(true)

    expect(screen.getByRole("button", { name: /Micah/ })).toBeEnabled()
    expect(screen.getByRole("button", { name: /Lorelei/ })).toBeEnabled()
    expect(screen.getByRole("button", { name: /Notionists/ })).toBeEnabled()
  })
})

describe("AvatarEditor — libellés des variantes", () => {
  it("affiche des libellés descriptifs pour Lorelei au lieu de « Variante N »", () => {
    const style = getAvatarStyle("lorelei")
    render(
      <AvatarEditor
        draft={defaultOptionsFor("lorelei")}
        groupId="visage"
        groups={style.groups}
        premium
        micahUnlocked
        onDraftChange={vi.fn()}
        onStyleChange={vi.fn()}
      />
    )

    expect(
      screen.getByRole("button", { name: "Yeux fermés" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /^Variante/ })
    ).not.toBeInTheDocument()
  })
})
