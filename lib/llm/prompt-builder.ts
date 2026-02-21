import type { GenerationOptions } from "@/types/post"

function clampMaxSlides(maxSlides: number): number {
  const safe = Number.isFinite(maxSlides) ? Math.trunc(maxSlides) : 10
  if (safe <= 0) return 1
  if (safe > 10) return 10
  return safe
}

export function buildCarouselPrompt(
  inputText: string,
  options: GenerationOptions
): string {
  const maxSlides = clampMaxSlides(options.maxSlides)
  const tone = options.tone.trim() || "conversational but professional"
  const footer = options.brandingFooter?.trim()
  const footerRule = footer
    ? `Include this exact branding footer sentence at the end of the caption: ${JSON.stringify(footer)}.`
    : "Do not add any branding footer."

  return [
    "You are generating Instagram carousel copy.",
    "Return ONLY valid JSON.",
    "Do not include markdown.",
    "Do not include code fences.",
    "Do not include explanations.",
    "Do not include any text outside the JSON object.",
    "The JSON must match this exact schema:",
    '{"slides":[{"headline":"...","content":"...","visualHint":"..."}],"caption":"...","hashtags":["#tag"]}',
    "Rules:",
    `- Maximum slides: ${maxSlides} (never exceed 10).`,
    "- At least 1 slide.",
    "- Slide 1 must be a strong hook.",
    "- Last slide must include a clear call-to-action.",
    "- Each slide.content must be 20 to 40 words.",
    "- No emojis.",
    "- Conversational but professional tone.",
    `- Tone: ${JSON.stringify(tone)}.`,
    "- Hashtags: 8 to 15 items.",
    "- Hashtags must be strings.",
    "- No trailing commas.",
    "- Do not add line breaks inside JSON string values unless they are normal sentences.",
    footerRule,
    "Input text:",
    inputText,
  ].join("\n")
}
