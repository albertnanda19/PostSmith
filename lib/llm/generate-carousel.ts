import type { GenerationOptions, StructuredPostOutput, StructuredSlide } from "@/types/post"
import { generateGeminiText } from "@/lib/llm/gemini-client"
import { buildCarouselPrompt } from "@/lib/llm/prompt-builder"

class GenerationError extends Error {
  override name = "GenerationError"
}

function countWords(text: string): number {
  const parts = text
    .trim()
    .split(/\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  return parts.length
}

function countNonEmptyLines(text: string): number {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0).length
}

function countCaptionParagraphs(caption: string): number {
  return caption
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length
}

function clampMaxSlides(maxSlides: number): number {
  const safe = Number.isFinite(maxSlides) ? Math.trunc(maxSlides) : 10
  if (safe <= 0) return 1
  if (safe > 10) return 10
  return safe
}

function extractJsonObject(text: string): string {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")

  if (start === -1 || end === -1 || end <= start) {
    throw new GenerationError("Model returned invalid JSON")
  }

  return text.slice(start, end + 1)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string")
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isHeroSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return value.type === "hero" && isNonEmptyString(value.title) && isNonEmptyString(value.subtitle)
}

function isFlowSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return value.type === "flow" && Array.isArray(value.steps) && value.steps.every(isNonEmptyString)
}

function isExplanationSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return (
    value.type === "explanation" &&
    isNonEmptyString(value.title) &&
    Array.isArray(value.points) &&
    value.points.every(isNonEmptyString) &&
    Array.isArray(value.highlight) &&
    value.highlight.every(isNonEmptyString)
  )
}

function isCtaSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return value.type === "cta" && isNonEmptyString(value.text)
}

function isStructuredSlide(value: unknown): value is StructuredSlide {
  return isHeroSlide(value) || isFlowSlide(value) || isExplanationSlide(value) || isCtaSlide(value)
}

function normalizeExplanationHighlights(
  slide: Extract<StructuredSlide, { type: "explanation" }>
): Extract<StructuredSlide, { type: "explanation" }> {
  const pointsLower = slide.points.map((p) => p.toLowerCase())

  const highlight = slide.highlight.filter((term) => {
    const needle = term.toLowerCase()
    return pointsLower.some((p) => p.includes(needle))
  })

  return { ...slide, highlight }
}

function validateStructuredSlides(slides: StructuredSlide[], maxSlides: number): void {
  if (slides.length < 3) {
    throw new GenerationError("Generated output must have at least 3 slides")
  }

  if (slides.length > maxSlides) {
    throw new GenerationError("Generated too many slides")
  }

  if (slides[0]?.type !== "hero") {
    throw new GenerationError("First slide must be hero")
  }

  if (slides[slides.length - 1]?.type !== "cta") {
    throw new GenerationError("Last slide must be cta")
  }

  for (const slide of slides) {
    if (slide.type === "hero") {
      if (countWords(slide.title) > 8) {
        throw new GenerationError("Hero title must be 8 words or fewer")
      }
      if (countWords(slide.subtitle) > 12) {
        throw new GenerationError("Hero subtitle must be 12 words or fewer")
      }
    }

    if (slide.type === "flow") {
      if (slide.steps.length < 3 || slide.steps.length > 4) {
        throw new GenerationError("Flow slides must have 3 to 4 steps")
      }

      for (const step of slide.steps) {
        if (countWords(step) > 6) {
          throw new GenerationError("Flow steps must be 6 words or fewer")
        }

        if (/[.!?]/.test(step)) {
          throw new GenerationError("Flow steps must not be full sentences")
        }
      }
    }

    if (slide.type === "explanation") {
      if (slide.points.length < 2 || slide.points.length > 3) {
        throw new GenerationError("Explanation slides must have 2 to 3 points")
      }

      for (const point of slide.points) {
        if (countWords(point) > 14) {
          throw new GenerationError("Explanation points must be 14 words or fewer")
        }
      }
    }

    if (slide.type === "cta") {
      if (countNonEmptyLines(slide.text) > 2) {
        throw new GenerationError("CTA must be 2 lines or fewer")
      }
    }
  }
}

function normalizeHashtag(tag: string): string {
  return tag.trim()
}

function dedupeHashtags(hashtags: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  for (const raw of hashtags) {
    const tag = normalizeHashtag(raw)
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(tag)
  }

  return out
}

function validateHashtags(hashtags: string[]): void {
  for (const tag of hashtags) {
    if (!tag.startsWith("#")) {
      throw new GenerationError("Hashtags must start with #")
    }
  }
}

function parseStructuredPostOutput(jsonText: string, maxSlides: number): StructuredPostOutput {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText) as unknown
  } catch {
    throw new GenerationError("Model returned invalid JSON")
  }

  if (!isRecord(parsed)) {
    throw new GenerationError("Model returned invalid JSON")
  }

  const slidesValue = parsed.slides
  const captionValue = parsed.caption
  const hashtagsValue = parsed.hashtags

  if (!Array.isArray(slidesValue)) {
    throw new GenerationError("Generated output is missing slides")
  }

  const slides = slidesValue.filter(isStructuredSlide).map((slide) => {
    if (slide.type === "explanation") {
      return normalizeExplanationHighlights(slide)
    }

    return slide
  })
  if (slides.length !== slidesValue.length) {
    throw new GenerationError("Generated output has invalid slide types")
  }

  if (typeof captionValue !== "string") {
    throw new GenerationError("Generated output is missing caption")
  }

  if (!isStringArray(hashtagsValue)) {
    throw new GenerationError("Generated output is missing hashtags")
  }

  const caption = captionValue.trim()
  if (!caption) {
    throw new GenerationError("Generated output is missing caption")
  }

  if (countCaptionParagraphs(caption) > 6) {
    throw new GenerationError("Caption must be 6 paragraphs or fewer")
  }

  const dedupedHashtags = dedupeHashtags(hashtagsValue).slice(0, 8)
  if (dedupedHashtags.length < 5 || dedupedHashtags.length > 8) {
    throw new GenerationError("Hashtags must be 5 to 8 items")
  }
  validateHashtags(dedupedHashtags)
  validateStructuredSlides(slides, maxSlides)

  return {
    slides,
    caption,
    hashtags: dedupedHashtags,
  }
}

export async function generateCarousel(
  inputText: string,
  options: GenerationOptions
): Promise<StructuredPostOutput> {
  const maxSlides = clampMaxSlides(options.maxSlides)
  const prompt = buildCarouselPrompt(inputText, { ...options, maxSlides })

  let raw: string
  try {
    raw = await generateGeminiText(prompt)
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      const message = err instanceof Error ? err.message : "Gemini generation failed"
      throw new GenerationError(message)
    }

    throw new GenerationError("Gemini generation failed")
  }

  const jsonText = extractJsonObject(raw)
  return parseStructuredPostOutput(jsonText, maxSlides)
}
