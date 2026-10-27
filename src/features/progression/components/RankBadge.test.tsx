// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import { TIER_COLORS } from "../domain/progression"
import { RankBadge } from "./RankBadge"

beforeAll(async () => i18n.changeLanguage("fr"))

describe("RankBadge", () => {
  it("affiche le libellé traduit et la teinte du rang", () => {
    render(<RankBadge rank="OR" />)

    const badge = screen.getByText("Or")
    expect(badge).toHaveAttribute("data-rank", "OR")
    expect(badge.style.color).toBe(TIER_COLORS.OR.text)
    expect(badge.style.background).toBe(TIER_COLORS.OR.soft)
  })

  it("traduit le rang Fer", () => {
    render(<RankBadge rank="FER" />)
    expect(screen.getByText("Fer")).toBeInTheDocument()
  })
})
