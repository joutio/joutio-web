// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { InterestProfileForm } from "./interest-profile-form"

const categories = [
  { category: "HISTORY", label: "Histoire" },
  { category: "SCIENCE", label: "Sciences" },
  { category: "MOVIES", label: "Cinéma" },
  { category: "SPORTS", label: "Sport" },
]

vi.mock("../hooks/useTopics", () => ({
  useTopicCategories: () => ({
    data: categories,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useTopicFacets: () => ({
    data: {
      total: 10,
      categories: categories.map((category) => ({ ...category, count: 2 })),
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("InterestProfileForm", () => {
  it("affiche les univers sans compteur de sujets", () => {
    render(<InterestProfileForm value={[]} onChange={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Histoire" })).toBeInTheDocument()
    expect(screen.queryByText(/2 sujets/)).not.toBeInTheDocument()
  })

  it("ajoute et retire un univers", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <InterestProfileForm value={[]} onChange={onChange} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Histoire" }))
    expect(onChange).toHaveBeenCalledWith(["HISTORY"])

    rerender(<InterestProfileForm value={["HISTORY"]} onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Histoire" }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it("bloque le quatrième univers", () => {
    render(
      <InterestProfileForm
        value={["HISTORY", "SCIENCE", "MOVIES"]}
        onChange={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Sport" })).toBeDisabled()
  })

  it("permet de désigner l'univers principal", () => {
    const onChange = vi.fn()
    render(
      <InterestProfileForm value={["HISTORY", "SCIENCE"]} onChange={onChange} />
    )

    const sciencesButtons = screen.getAllByRole("button", {
      name: /Sciences/,
    })
    fireEvent.click(sciencesButtons[sciencesButtons.length - 1]!)
    expect(onChange).toHaveBeenCalledWith(["SCIENCE", "HISTORY"])
  })
})
