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
    '{"slides":[{"type":"hero","title":"...","subtitle":"..."},{"type":"flow","steps":["..."]},{"type":"explanation","title":"...","points":["..."],"highlight":["..."]},{"type":"cta","text":"..."}],"caption":"...","hashtags":["#tag"]}',
    "Rules:",
    `- Maximum slides: ${maxSlides} (never exceed 10).`,
    "- At least 3 slides.",
    "- Slide 1 must be type hero.",
    "- Last slide must be type cta.",
    "- For explanation slides: each highlight item must appear inside points text.",
    "- No emojis.",
    "- Conversational but professional tone.",
    `- Tone: ${JSON.stringify(tone)}.`,
    "- Hashtags: 8 to 15 items.",
    "- Hashtags must be strings starting with #.",
    "- No trailing commas.",
    "- Do not add line breaks inside JSON string values unless they are normal sentences.",
    footerRule,
    "Input text:",
    inputText,
  ].join("\n")
}
