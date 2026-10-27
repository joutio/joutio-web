// @vitest-environment jsdom
import type { ReactElement } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const sonner = vi.hoisted(() => ({
  custom: vi.fn(),
  dismiss: vi.fn(),
}))

vi.mock("sonner", () => ({ toast: sonner }))

import { showToast } from "./toast"

/** Rend le JSX du dernier toast demandé à sonner (comme le ferait le `Toaster`). */
function renderLatest(toastId: string) {
  const call = sonner.custom.mock.calls.at(-1)
  const renderJsx = call?.[0] as (id: string) => ReactElement
  render(renderJsx(toastId))
}

describe("showToast", () => {
  beforeEach(() => {
    sonner.custom.mockClear()
    sonner.dismiss.mockClear()
  })

  it("rend le gabarit unique via sonner, avec id et durée", () => {
    showToast({
      title: "Titre",
      description: "Détail",
      tone: "info",
      id: "x",
      duration: 1_234,
    })

    expect(sonner.custom).toHaveBeenCalledTimes(1)
    const [, data] = sonner.custom.mock.calls[0]
    expect(data).toEqual({ id: "x", duration: 1_234 })

    renderLatest("t1")
    expect(screen.getByText("Titre")).toBeInTheDocument()
    expect(screen.getByText("Détail")).toBeInTheDocument()
  })

  it("clic = fermeture du toast puis action", () => {
    const onClick = vi.fn()
    showToast({ title: "Défi accepté", onClick })

    renderLatest("t2")
    fireEvent.click(screen.getByRole("button"))

    expect(sonner.dismiss).toHaveBeenCalledWith("t2")
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("`dismissOnClick` : cliquable pour fermer, sans action", () => {
    showToast({ title: "Alex est en ligne", dismissOnClick: true })

    renderLatest("t3")
    fireEvent.click(screen.getByRole("button"))

    expect(sonner.dismiss).toHaveBeenCalledWith("t3")
  })

  it("sans clic ni `dismissOnClick`, le toast n'est pas un bouton", () => {
    showToast({ title: "Simple" })

    renderLatest("t4")
    expect(screen.queryByRole("button")).toBeNull()
    expect(sonner.dismiss).not.toHaveBeenCalled()
  })
})
