import { describe, expect, it } from "vitest"
import {
  PENDING_TYPES,
  isAllPendingTypes,
  isPendingActive,
  parsePendingTypes,
  togglePendingType,
} from "./pending-duel"

describe("parsePendingTypes", () => {
  it("retombe sur tous les types quand le paramètre est absent ou invalide", () => {
    expect(parsePendingTypes("")).toEqual([...PENDING_TYPES])
    expect(parsePendingTypes("ALL")).toEqual([...PENDING_TYPES])
    expect(parsePendingTypes("foo")).toEqual([...PENDING_TYPES])
  })

  it("lit une sélection multiple et ignore les valeurs inconnues", () => {
    expect(parsePendingTypes("received,sent")).toEqual(["received", "sent"])
    expect(parsePendingTypes("room,foo")).toEqual(["room"])
  })
})

describe("isPendingActive", () => {
  const now = Date.parse("2026-10-21T10:00:00Z")

  it("garde une échéance future et retire une échéance passée", () => {
    expect(
      isPendingActive({ expiresAt: "2026-10-21T10:00:10Z" }, now)
    ).toBe(true)
    expect(
      isPendingActive({ expiresAt: "2026-10-21T09:59:59Z" }, now)
    ).toBe(false)
  })

  it("ne masque pas une échéance illisible", () => {
    expect(isPendingActive({ expiresAt: "pas-une-date" }, now)).toBe(true)
  })
})

describe("togglePendingType", () => {
  it("isole un type depuis Tous", () => {
    expect(togglePendingType([...PENDING_TYPES], "received")).toEqual([
      "received",
    ])
  })

  it("ajoute un type à une sélection partielle", () => {
    expect(togglePendingType(["received"], "room")).toEqual([
      "received",
      "room",
    ])
  })

  it("revient à Tous quand le dernier type est retiré", () => {
    expect(togglePendingType(["sent"], "sent")).toEqual([...PENDING_TYPES])
  })

  it("détecte la sélection complète", () => {
    expect(isAllPendingTypes([...PENDING_TYPES])).toBe(true)
    expect(isAllPendingTypes(["received", "room"])).toBe(false)
  })
})
