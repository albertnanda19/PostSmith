import type { GenerationOptions } from "@/types/post"
import { MIN_CAROUSEL_SLIDES } from "@/types/post"

function clampMaxSlides(maxSlides: number): number {
  const safe = Number.isFinite(maxSlides) ? Math.trunc(maxSlides) : 10
  if (safe <= 0) return MIN_CAROUSEL_SLIDES
  if (safe > 10) return 10
  return Math.max(safe, MIN_CAROUSEL_SLIDES)
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
    '{"slides":[{"type":"hero","variant":"default|center","title":"...","subtitle":"..."},{"type":"flow","variant":"default|grid","steps":["..."]},{"type":"explanation","variant":"default|cards","title":"...","points":["..."],"highlight":["..."]},{"type":"paragraph","variant":"default|wide","title":"...","text":"..."},{"type":"diagram","variant":"default|grid","title":"...","nodes":["..."]},{"type":"cta","variant":"default|minimal","text":"..."}],"theme":{"backgroundColor":"#0f172a|#111827|#0b1324|#0a1b2a|#111b2e|#0b1f1a|#1a1026"},"caption":"...","hashtags":["#tag"]}',
    "Schema rules:",
    "- Every slide must have a 'type' field.",
    "- Allowed slide.type values are ONLY: hero, flow, explanation, paragraph, diagram, cta.",
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
    "- paragraph slide must have only: type, variant, title, text.",
    "- diagram slide must have only: type, variant, title, nodes.",
    "- cta slide must have only: type, variant, text.",
    "Variant rules:",
    "- hero.variant allowed values: default, center.",
    "- flow.variant allowed values: default, grid.",
    "- explanation.variant allowed values: default, cards.",
    "- paragraph.variant allowed values: default, wide.",
    "- diagram.variant allowed values: default, grid.",
    "- cta.variant allowed values: default, minimal.",
    "- Choose variants based on the content so the visuals feel less repetitive.",
    "- If unsure, omit variant (server will default it).",
    "Rules:",
    `- Maximum ${maxSlides} slides (never exceed). You may generate fewer; choose the slide count that best fits the content (between ${MIN_CAROUSEL_SLIDES} and ${maxSlides}).`,
    "- First slide must be type hero (strong hook; clear problem or bold insight; short and punchy).",
    "- Last slide must be type cta (strong call-to-action; encourage reflection or action).",
    "- All slides between first and last must NOT be type hero or type cta.",
    "Content-driven slide types (you choose based on the input):",
    "- Use 'flow' for steps, processes, ordered lists, or how-to sequences (steps array; 3 to 6 items).",
    "- Use 'diagram' for relationships, systems, conceptual maps, or node-based ideas (nodes array; 3 to 8 items).",
    "- Use 'explanation' for key points with highlights (title, points array, highlight array).",
    "- Use 'paragraph' for narrative, single-idea prose, or when one block of text reads better than bullets.",
    "- Vary types across the carousel so the flow is not monotonous; match each slide type to what the content needs.",
    "Flow and pacing:",
    "- Each slide must logically connect to the previous one.",
    "- Order and type choice should make the carousel clear and easy to read from start to finish.",
    "- Do not repeat the same slide type in a row unless the content truly requires it.",
    "Content quality (every slide):",
    "- Sound human and natural: write as a knowledgeable professional would speak, not like a template or bot; use varied sentence structure and authentic phrasing.",
    "- Stay professional: authoritative and credible; no slang, filler words, or hype; prefer active voice and concrete language.",
    "- Keep each slide concise: one clear idea or takeaway per slide; short sentences; no walls of text; hero title and subtitle brief; flow steps and explanation points one line each; paragraph slides 2–4 sentences max.",
    "- Best practice: one thought per slide; scannable; no redundant intros or conclusions on individual slides; every line should earn its place.",
    "Tone:",
    "- Conversational.",
    "- Clear.",
    "- No emojis.",
    `- Tone: ${JSON.stringify(tone)}.`,
    "Formatting:",
    "- No newline characters inside JSON string values.",
    "- Avoid abrupt line breaks, uneven formatting, and leading or trailing whitespace.",
    "- Keep text short so it looks good when center-aligned; avoid overly long paragraphs.",
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
