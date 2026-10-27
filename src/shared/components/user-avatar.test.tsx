// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { UserAvatar } from "./user-avatar"

vi.mock("@/shared/avatar/avatar", () => ({
  avatarDataUri: () => "data:image/svg+xml,%3Csvg/%3E",
  parseAvatarOptions: () => null,
}))

vi.mock("@/shared/avatar/styles", () => ({
  getLoadedAvatarStyle: () => ({}),
  loadAvatarStyle: () => Promise.resolve(),
  resolveAvatarStyleId: () => "micah",
}))

function avatarOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="avatar"]') as HTMLElement
}

describe("UserAvatar", () => {
  it("applique une bordure Elo proportionnelle à la taille réelle", () => {
    const { container } = render(
      <UserAvatar name="Alice" rating={200} size={40} />
    )
    const wrapper = container.firstElementChild as HTMLElement

    expect(wrapper).toHaveAttribute("data-elo-tier", "FER")
    expect(wrapper.style.containerType).toBe("inline-size")
    expect(avatarOf(container).style.outlineWidth).toBe("clamp(1px, 5cqw, 4px)")
    expect(avatarOf(container).style.outlineOffset).toBe("0px")
  })

  it("affiche l'icône générique quand aucun avatar n'est configuré", () => {
    const { container } = render(<UserAvatar name="Alice" size={40} />)

    expect(container.querySelector("img")).toBeNull()
    expect(container.querySelector("svg")).not.toBeNull()
  })

  it("affiche la silhouette générique grise pour un compte supprimé", () => {
    const { container } = render(
      <UserAvatar name="Joueur supprimé" initialOnly size={40} />
    )

    expect(container.querySelector("img")).toBeNull()
    expect(container.querySelector("svg")).not.toBeNull()
    expect(screen.queryByText("J")).not.toBeInTheDocument()
  })

  it("ne pose aucune bordure quand la bordure Elo est désactivée", () => {
    const { container } = render(
      <UserAvatar name="Alice" rating={200} size={112} eloFrame={false} />
    )
    const wrapper = container.firstElementChild as HTMLElement

    expect(wrapper).not.toHaveAttribute("data-elo-tier")
    expect(avatarOf(container).style.outlineWidth).toBe("")
  })
})
