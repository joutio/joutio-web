// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import { ThemeProvider } from "../providers/ThemeProvider"
import { useThemeStore } from "../stores/useThemeStore"
import { ThemeToggle } from "./ThemeToggle"

function renderToggle() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe("ThemeToggle", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("fr")
    useThemeStore.setState({ theme: "dark" })
  })

  afterEach(() => {
    useThemeStore.setState({ theme: "dark" })
    document.documentElement.classList.remove("dark")
  })

  it("bascule du thème sombre vers le thème clair", () => {
    renderToggle()

    const button = screen.getByRole("button", {
      name: "Passer en thème clair",
    })
    expect(button).toHaveAttribute("title", "Passer en thème clair")

    fireEvent.click(button)

    expect(useThemeStore.getState().theme).toBe("light")
    expect(
      screen.getByRole("button", { name: "Passer en thème sombre" })
    ).toBeInTheDocument()
  })

  it("bascule du thème clair vers le thème sombre", () => {
    useThemeStore.setState({ theme: "light" })
    renderToggle()

    fireEvent.click(
      screen.getByRole("button", { name: "Passer en thème sombre" })
    )

    expect(useThemeStore.getState().theme).toBe("dark")
  })
})
