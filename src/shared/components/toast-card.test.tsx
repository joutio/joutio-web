// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ToastCard } from "./toast-card"

describe("ToastCard", () => {
  it("porte toujours un visuel de tête : la pastille du ton par défaut", () => {
    const { container } = render(
      <ToastCard title="Défi accepté" tone="success" />
    )

    const pastille = container.querySelector("span[aria-hidden]")
    expect(pastille?.className).toContain("bg-toast-success/15")
    expect(pastille?.querySelector("svg")).not.toBeNull()
  })

  it("teinte le titre selon le ton", () => {
    render(<ToastCard title="Défi refusé" tone="danger" />)
    expect(screen.getByText("Défi refusé").className).toContain(
      "text-toast-danger"
    )
  })

  it("remplace la pastille par l'avatar de l'acteur (présence)", () => {
    const { container } = render(
      <ToastCard
        title="Alex est en ligne"
        actor={{ userId: "u1", name: "Alex" }}
      />
    )

    expect(container.querySelector("span[aria-hidden]")).toBeNull()
    expect(screen.getByText("Alex est en ligne")).toBeInTheDocument()
    // Repli initiales (le visuel DiceBear peut rester en résolution en jsdom).
    expect(container.textContent).toContain("A")
  })

  it("sans description : carte réduite au titre, aucune ligne réservée", () => {
    const { container } = render(<ToastCard title="Sans détail" />)

    expect(container.querySelector(".min-h-10")).toBeNull()
    const title = container.querySelector("span[title]")
    expect(title?.textContent).toBe("Sans détail")
    expect(title?.className).toContain("min-h-6")
  })

  it("affiche la description entière : la hauteur suit le contenu", () => {
    const description =
      "Tu as atteint ta limite de défis en attente. Termine ou annule un défi avant d'en lancer un autre."
    render(
      <ToastCard title="Limite de défis atteinte" description={description} />
    )

    const slot = screen.getByText(description)
    expect(slot.className).not.toContain("line-clamp")
    expect(slot.className).not.toContain("min-h-10")
    expect(slot.textContent).toBe(description)
  })

  it("n'ellipse pas un titre long", () => {
    const title =
      "Un titre particulièrement long qui ne doit pas être tronqué dans le toast"
    render(<ToastCard title={title} />)

    const slot = screen.getByText(title)
    expect(slot.className).not.toContain("line-clamp")
    expect(slot.textContent).toBe(title)
  })

  it("cliquable quand `onClick` est fourni, simple bloc sinon", () => {
    const onClick = vi.fn()
    const { unmount } = render(<ToastCard title="Ouvrir" onClick={onClick} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalledTimes(1)
    unmount()

    render(<ToastCard title="Inerte" />)
    expect(screen.queryByRole("button")).toBeNull()
  })
})
