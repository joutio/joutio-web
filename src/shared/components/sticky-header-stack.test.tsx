// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
  StickyHeaderFilters,
  StickyHeaderProvider,
  StickyHeaderSlot,
} from "./sticky-header-stack"
import { PageHeaderBar } from "./page-header-bar"

describe("StickyHeaderStack", () => {
  it("porte la barre active dans le slot du header", () => {
    render(
      <StickyHeaderProvider>
        <div data-testid="header">
          <StickyHeaderSlot />
        </div>
        <StickyHeaderFilters active>
          {(stacked) => <p>filtres {stacked ? "empilés" : "inline"}</p>}
        </StickyHeaderFilters>
      </StickyHeaderProvider>
    )

    const filters = screen.getByText("filtres empilés")
    expect(filters.closest('[data-slot="sticky-header-slot"]')).not.toBeNull()
  })

  it("ne rend pas la barre d'un onglet inactif", () => {
    render(
      <StickyHeaderProvider>
        <StickyHeaderSlot />
        <StickyHeaderFilters active={false}>
          <p>filtres inactifs</p>
        </StickyHeaderFilters>
      </StickyHeaderProvider>
    )

    expect(screen.queryByText("filtres inactifs")).not.toBeInTheDocument()
  })

  it("rend la barre sur place sans header partagé (fiche joueur, tests)", () => {
    render(
      <StickyHeaderFilters>
        {(stacked) => <p>filtres {stacked ? "empilés" : "inline"}</p>}
      </StickyHeaderFilters>
    )

    const filters = screen.getByText("filtres inline")
    expect(filters.closest('[data-slot="sticky-header-slot"]')).toBeNull()
  })

  it("place le slot sous les onglets du PageHeaderBar sticky", () => {
    render(
      <StickyHeaderProvider>
        <PageHeaderBar sticky below={<StickyHeaderSlot />}>
          <span>onglets</span>
        </PageHeaderBar>
        <StickyHeaderFilters>
          <p>filtres</p>
        </StickyHeaderFilters>
      </StickyHeaderProvider>
    )

    const header = screen
      .getByText("onglets")
      .closest('[data-slot="page-header-bar"]')
    const filters = screen.getByText("filtres")
    expect(header).not.toBeNull()
    expect(filters.closest('[data-slot="page-header-bar"]')).toBe(header)
  })
})
