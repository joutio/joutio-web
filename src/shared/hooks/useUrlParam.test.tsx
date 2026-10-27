// @vitest-environment jsdom
import type { ReactNode } from "react"
import { act, renderHook } from "@testing-library/react"
import { MemoryRouter, useLocation } from "react-router-dom"
import { describe, expect, it } from "vitest"
import {
  useUrlParam,
  useUrlParamBool,
  useUrlParamNumber,
  useUrlParams,
} from "./useUrlParam"

function createWrapper(initialEntry = "/") {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    )
  }
}

describe("useUrlParam", () => {
  it("retourne la valeur par défaut quand le paramètre est absent", () => {
    const { result } = renderHook(() => useUrlParam("tab", "classement"), {
      wrapper: createWrapper(),
    })
    expect(result.current[0]).toBe("classement")
  })

  it("lit la valeur de l'URL et retire le paramètre quand on revient au défaut", () => {
    const { result } = renderHook(
      () => ({
        param: useUrlParam<string>("tab", "classement"),
        location: useLocation(),
      }),
      { wrapper: createWrapper("/?tab=progression") }
    )
    expect(result.current.param[0]).toBe("progression")

    act(() => {
      result.current.param[1]("historique")
    })
    expect(result.current.location.search).toBe("?tab=historique")

    act(() => {
      result.current.param[1]("classement")
    })
    expect(result.current.location.search).toBe("")
  })

  it("useUrlParamBool : absente = défaut, `true` explicite dans l'URL", () => {
    const { result } = renderHook(
      () => ({
        bool: useUrlParamBool("followed"),
        location: useLocation(),
      }),
      { wrapper: createWrapper() }
    )
    expect(result.current.bool[0]).toBe(false)

    act(() => {
      result.current.bool[1](true)
    })
    expect(result.current.location.search).toBe("?followed=true")
    expect(result.current.bool[0]).toBe(true)
  })

  it("useUrlParamNumber : valeur invalide = défaut", () => {
    const { result } = renderHook(() => useUrlParamNumber("page", 0), {
      wrapper: createWrapper("/?page=abc"),
    })
    expect(result.current[0]).toBe(0)
  })

  it("useUrlParams : une seule navigation pour plusieurs clés", () => {
    const { result } = renderHook(
      () => ({
        update: useUrlParams(),
        location: useLocation(),
      }),
      { wrapper: createWrapper("/?tab=notifications&page=2") }
    )

    act(() => {
      result.current.update((params) => {
        params.delete("page")
        params.set("filter", "all")
      })
    })

    expect(result.current.location.search).toBe("?tab=notifications&filter=all")
  })
})
