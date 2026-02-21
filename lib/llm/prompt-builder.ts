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
    "You are generating a DARK TECH personal branding LinkedIn-style carousel.",
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
    "- This is NOT a blog.",
    "- This is NOT an academic explanation.",
    "- This is NOT lecture notes.",
    "Tone:",
    "- Conversational.",
    "- Confident.",
    "- Clear.",
    "- Human.",
    "- Strategic.",
    "- Not academic.",
    "- Not textbook-like.",
    "- Not overly formal.",
    "- Write like a senior engineer explaining something to peers.",
    "- No hype words.",
    "- No motivational cliches.",
    "- No emojis.",
    `- Tone: ${JSON.stringify(tone)}.`,
    "Content density:",
    "- Each slide must contain ONLY ONE core idea.",
    "- Keep slides light.",
    "- Avoid information overload.",
    "Hard limits:",
    "- Hero: title max 8 words; subtitle max 12 words.",
    "- Flow: 3 to 4 steps max; each step max 6 words; no full sentences.",
    "- Explanation: 2 to 3 points max; each point max 14 words; short sentences; no paragraphs.",
    "- Explanation: highlight words must be present in points if included.",
    "- CTA: max 2 short lines; invite reflection or discussion; no 'Follow me for more'.",
    "Forbidden:",
    "- Long bullet lists.",
    "- More than 4 items per slide.",
    "- Paragraph blocks.",
    "- Dense definitions.",
    "- Exhaustive explanations.",
    "- Repeating the same concept across multiple bullets.",
    "Caption:",
    "- Conversational.",
    "- Expand slightly beyond slides.",
    "- Not longer than 6 short paragraphs.",
    "Hashtags:",
    "- 5 to 8 items.",
    "- Hashtags must be strings starting with #.",
    "- No trailing commas.",
    "- Do not add line breaks inside JSON string values unless they are normal sentences.",
    footerRule,
    "Input text:",
    inputText,
  ].join("\n")
}
