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
    '{"slides":[{"type":"hero","variant":"default|center","title":"...","subtitle":"..."},{"type":"flow","variant":"default|grid","steps":["..."]},{"type":"explanation","variant":"default|cards","title":"...","points":["..."],"highlight":["..."]},{"type":"cta","variant":"default|minimal","text":"..."}],"theme":{"backgroundColor":"#0f172a|#111827|#0b1324|#0a1b2a|#111b2e|#0b1f1a|#1a1026"},"caption":"...","hashtags":["#tag"]}',
    "Schema rules:",
    "- Every slide must have a 'type' field.",
    "- Allowed slide.type values are ONLY: hero, flow, explanation, cta.",
    "- Do not output any other type values.",
    "- Output a 'theme' object with a 'backgroundColor' value chosen ONLY from the allowed palette.",
    "- The same theme must apply to all slides in this post.",
    "- Choose theme.backgroundColor deterministically from the input text so different inputs produce different colors.",
    "- Deterministic rule: compute an index by counting the number of characters in the input text modulo 7, then pick the palette item in that position (0-based).",
    "- Every slide may include an optional 'variant' field.",
    "- hero slide must have only: type, variant, title, subtitle.",
    "- flow slide must have only: type, variant, steps.",
    "- flow.steps must contain 6 items or fewer.",
    "- explanation slide must have only: type, variant, title, points, highlight.",
    "- cta slide must have only: type, variant, text.",
    "Variant rules:",
    "- hero.variant allowed values: default, center.",
    "- flow.variant allowed values: default, grid.",
    "- explanation.variant allowed values: default, cards.",
    "- cta.variant allowed values: default, minimal.",
    "- Choose variants based on the content so the visuals feel less repetitive.",
    "- If unsure, omit variant (server will default it).",
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
