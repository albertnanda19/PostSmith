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
    "You are generating carousel copy.",
    "Write in conversational but professional English.",
    "Return ONLY valid JSON.",
    "Zero tolerance: if you cannot comply, return valid JSON that complies.",
    "Do not include markdown.",
    "Do not include bullet points.",
    "Do not include numbering.",
    "Do not include code fences.",
    "Do not include explanations.",
    "Do not include backticks.",
    "Do not include any text outside the JSON object.",
    "The JSON must match this exact schema:",
    '{"slides":[{"type":"hero","title":"...","subtitle":"..."},{"type":"flow","steps":["..."]},{"type":"explanation","title":"...","points":["..."],"highlight":["..."]},{"type":"cta","text":"..."}],"caption":"...","hashtags":["#tag"]}',
    "Rules:",
    `- Maximum slides: ${maxSlides} (never exceed 10).`,
    "- Generate EXACTLY 10 slides.",
    "- Never generate fewer than 10 slides.",
    "- Never generate more than 10 slides.",
    "- Slide 1 must be type hero.",
    "- Slide 10 must be type cta.",
    "- Slides 2 to 9 must NOT be type hero or type cta.",
    "Narrative pacing structure by slide number:",
    "- Slide 1: strong hook; clear problem or bold insight; short and punchy.",
    "- Slides 2 to 3: expand the problem; build tension or curiosity.",
    "- Slides 4 to 6: core insights; practical explanation; clear value.",
    "- Slides 4 to 6 MUST include at least one slide with type flow.",
    "- Slides 7 to 8: deepen perspective; shift angle; add clarity.",
    "- Slide 9: synthesis; tie ideas together.",
    "- Slide 10: strong call-to-action; encourage reflection or action.",
    "- Each slide must logically connect to the previous slide.",
    "Tone:",
    "- Conversational.",
    "- Clear.",
    "- No emojis.",
    `- Tone: ${JSON.stringify(tone)}.`,
    "Centered text compatibility:",
    "- Avoid overly long paragraphs.",
    "- Avoid abrupt line breaks.",
    "- Avoid uneven formatting.",
    "- Avoid leading or trailing whitespace.",
    "- Write balanced sentences that look good when center-aligned.",
    "- Do not include newline characters inside JSON string values.",
    "Hashtags:",
    "- 8 to 15 items.",
    "- Hashtags must be strings starting with #.",
    "- No trailing commas.",
    "- Do not add line breaks inside JSON string values unless they are normal sentences.",
    footerRule,
    "Input text:",
    inputText,
  ].join("\n")
}
