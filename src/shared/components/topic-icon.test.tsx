// @vitest-environment jsdom
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { TopicIcon } from "./topic-icon"

describe("TopicIcon", () => {
  it("laisse la surface visible derrière une image de sujet", () => {
    const { container } = render(
      <TopicIcon
        topic={{
          emoji: null,
          color: "#ff0000",
          imageUrl: "https://example.com/topic.png",
        }}
      />
    )

    expect(
      (container.firstElementChild as HTMLElement).style.backgroundColor
    ).toBe("transparent")
  })

  it("garde la couleur éditoriale quand le sujet n'a pas d'image", () => {
    const { container } = render(
      <TopicIcon topic={{ emoji: "🧠", color: "#ff0000", imageUrl: null }} />
    )

    expect(container.firstElementChild).toHaveStyle({
      backgroundColor: "#ff0000",
    })
  })
})
