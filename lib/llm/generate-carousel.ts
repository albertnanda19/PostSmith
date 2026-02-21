import type { GenerationOptions, PostOutput } from "@/types/post"

import { createGeminiClient } from "@/lib/llm/gemini-client"
import { buildCarouselPrompt } from "@/lib/llm/prompt-builder"

class GenerationError extends Error {
  override name = "GenerationError"
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

function parsePostOutput(jsonText: string, maxSlides: number): PostOutput {
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
    .filter(isRecord)
    .map((s) => ({
      headline: typeof s.headline === "string" ? s.headline.trim() : "",
      content: typeof s.content === "string" ? s.content.trim() : "",
      visualHint: typeof s.visualHint === "string" ? s.visualHint.trim() : "",
    }))
    .filter((s) => s.headline && s.content && s.visualHint)

  if (slides.length === 0) {
    throw new GenerationError("Generated output has no valid slides")
  }

  if (typeof captionValue !== "string") {
    throw new GenerationError("Generated output is missing caption")
  }

  if (!isStringArray(hashtagsValue)) {
    throw new GenerationError("Generated output is missing hashtags")
  }

  const cappedSlides = slides.slice(0, maxSlides)
  const dedupedHashtags = dedupeHashtags(hashtagsValue).slice(0, 15)

  return {
    slides: cappedSlides,
    caption: captionValue.trim(),
    hashtags: dedupedHashtags,
  }
}

export async function generateCarousel(
  inputText: string,
  options: GenerationOptions
): Promise<PostOutput> {
  const maxSlides = clampMaxSlides(options.maxSlides)
  const model = createGeminiClient()
  const prompt = buildCarouselPrompt(inputText, { ...options, maxSlides })

  let raw: string
  try {
    const result = await model.generateContent(prompt)
    raw = result.response.text()
  } catch {
    throw new GenerationError("Gemini generation failed")
  }

  const jsonText = extractJsonObject(raw)
  const output = parsePostOutput(jsonText, maxSlides)

  if (output.slides.length > maxSlides) {
    throw new GenerationError("Generated too many slides")
  }

  return output
}
