import type { PostOutput, StructuredPostOutput } from "@/types/post"

function joinLines(lines: string[]): string {
  return lines.join("\n")
}

export function adaptStructuredToLegacy(structured: StructuredPostOutput): PostOutput {
  const slides = structured.slides.map((slide) => {
    if (slide.type === "hero") {
      return { headline: slide.title, content: slide.subtitle, visualHint: "generic" }
    }

    if (slide.type === "flow") {
      return {
        headline: "Architecture Flow",
        content: joinLines(slide.steps),
        visualHint: "generic",
      }
    }

    if (slide.type === "explanation") {
      return {
        headline: slide.title,
        content: joinLines(slide.points),
        visualHint: "generic",
      }
    }

    return { headline: "Final Thought", content: slide.text, visualHint: "generic" }
  })

  return {
    slides,
    caption: structured.caption,
    hashtags: structured.hashtags,
  }
}
