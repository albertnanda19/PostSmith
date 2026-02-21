import type { GenerationOptions, StructuredPostOutput, StructuredSlide } from "@/types/post"
import { generateGeminiText } from "@/lib/llm/gemini-client"
import { buildCarouselPrompt } from "@/lib/llm/prompt-builder"

class GenerationError extends Error {
  override name = "GenerationError"
}

function isRetryableGenerationError(err: unknown): boolean {
  if (!(err instanceof GenerationError)) return false
  const retryable = new Set<string>([
    "Model returned invalid JSON",
    "Generated output has invalid slide types",
    "Generated output is missing slides",
    "Generated output is missing caption",
    "Generated output is missing hashtags",
  ])
  return retryable.has(err.message)
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

function ensureNoNewlines(value: string, label: string): void {
  if (value.includes("\n")) {
    throw new GenerationError(`${label} must not contain newline characters`)
  }
}

function normalizeText(value: string, label: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new GenerationError(`${label} is required`)
  }
  ensureNoNewlines(trimmed, label)
  return trimmed
}

function clampMaxSlides(maxSlides: number): number {
  const safe = Number.isFinite(maxSlides) ? Math.trunc(maxSlides) : 10
  if (safe <= 0) return 1
  if (safe > 10) return 10
  return safe
}

function extractJsonObject(text: string): string {
  const start = text.indexOf("{")
  if (start === -1) {
    throw new GenerationError("Model returned invalid JSON")
  }

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i]
    if (!ch) continue

    if (inString) {
      if (escape) {
        escape = false
        continue
      }

      if (ch === "\\") {
        escape = true
        continue
      }

      if (ch === '"') {
        inString = false
      }

      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === "{") {
      depth += 1
      continue
    }

    if (ch === "}") {
      depth -= 1
      if (depth === 0) {
        return text.slice(start, i + 1)
      }

      if (depth < 0) {
        break
      }
    }
  }

  throw new GenerationError("Model returned invalid JSON")
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
  if (maxSlides < 10) {
    throw new GenerationError("Max slides must be at least 10")
  }

  if (slides.length !== 10) {
    throw new GenerationError("Generated output must have exactly 10 slides")
  }

  if (slides[0]?.type !== "hero") {
    throw new GenerationError("Slide 1 must be hero")
  }

  if (slides[9]?.type !== "cta") {
    throw new GenerationError("Slide 10 must be cta")
  }

  for (let i = 1; i < 9; i += 1) {
    const t = slides[i]?.type
    if (t === "hero" || t === "cta") {
      throw new GenerationError("Only slide 1 can be hero and only slide 10 can be cta")
    }
  }

  const coreSection = slides.slice(3, 6)
  const hasFlowInCore = coreSection.some((s) => s.type === "flow")
  if (!hasFlowInCore) {
    throw new GenerationError("Slides 4 to 6 must include a flow slide")
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

    ensureNoNewlines(tag, "Hashtag")
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

  const slides = slidesValue
    .filter(isStructuredSlide)
    .map<StructuredSlide>((slide) => {
      if (slide.type === "hero") {
        return {
          type: "hero" as const,
          title: normalizeText(slide.title, "Hero title"),
          subtitle: normalizeText(slide.subtitle, "Hero subtitle"),
        }
      }

      if (slide.type === "flow") {
        const steps = slide.steps.map((s) => normalizeText(s, "Flow step"))
        return { type: "flow" as const, steps }
      }

      if (slide.type === "explanation") {
        const title = normalizeText(slide.title, "Explanation title")
        const points = slide.points.map((p) => normalizeText(p, "Explanation point"))
        const highlight = slide.highlight.map((h) => normalizeText(h, "Explanation highlight"))

        return normalizeExplanationHighlights({
          type: "explanation" as const,
          title,
          points,
          highlight,
        })
      }

      return { type: "cta" as const, text: normalizeText(slide.text, "CTA text") }
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

  const caption = normalizeText(captionValue, "Caption")

  if (countCaptionParagraphs(caption) > 6) {
    throw new GenerationError("Caption must be 6 paragraphs or fewer")
  }

  const dedupedHashtags = dedupeHashtags(hashtagsValue).slice(0, 15)
  if (dedupedHashtags.length < 8 || dedupedHashtags.length > 15) {
    throw new GenerationError("Hashtags must be 8 to 15 items")
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

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const attemptPrompt =
      attempt === 0
        ? prompt
        : `${prompt}\n\nYour previous response was invalid. Return ONLY the JSON object matching the schema. Do not add any extra keys. Do not add any extra text.`

    let raw: string
    try {
      raw = await generateGeminiText(attemptPrompt)
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        const message = err instanceof Error ? err.message : "Gemini generation failed"
        throw new GenerationError(message)
      }

      throw new GenerationError("Gemini generation failed")
    }

    try {
      const jsonText = extractJsonObject(raw)
      return parseStructuredPostOutput(jsonText, maxSlides)
    } catch (err) {
      if (attempt === 0 && isRetryableGenerationError(err)) {
        continue
      }
      throw err
    }
  }

  throw new GenerationError("Gemini generation failed")
}
