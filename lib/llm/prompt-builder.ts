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
    '{"slides":[{"type":"hero","variant":"default|center","title":"...","subtitle":"..."},{"type":"flow","variant":"default|grid","steps":["..."]},{"type":"explanation","variant":"default|cards","title":"...","points":["..."],"highlight":["..."]},{"type":"paragraph","variant":"default|wide","title":"...","text":"..."},{"type":"diagram","variant":"default|grid","title":"...","nodes":["..."]},{"type":"quote","variant":"default|highlight","quote":"...","attribution":"..."},{"type":"stat","variant":"default|minimal","value":"...","label":"..."},{"type":"cta","variant":"default|minimal","text":"..."}],"theme":{"backgroundColor":"#0f172a|#111827|#0b1324|#0a1b2a|#111b2e|#0b1f1a|#1a1026"},"caption":"...","hashtags":["#tag"]}',
    "Schema rules:",
    "- Every slide must have a 'type' field.",
    "- Allowed slide.type values are ONLY: hero, flow, explanation, paragraph, diagram, quote, stat, cta.",
    "- Do not output any other type values.",
    "- Output a 'theme' object with a 'backgroundColor' value chosen ONLY from the allowed palette.",
    "- The same theme must apply to all slides in this post.",
    "- Choose theme.backgroundColor deterministically from the input text so different inputs produce different colors.",
    "- Deterministic rule: compute an index by counting the number of characters in the input text modulo 7, then pick the palette item in that position (0-based).",
    "- Every slide may include an optional 'variant' field.",
    "- hero slide must have only: type, variant, title, subtitle.",
    "- flow slide must have only: type, variant, steps.",
    "- flow.steps must contain 6 items or fewer.",
    "- explanation slide must have only: type, variant, title, points, highlight. highlight must be an array of words or short phrases that appear verbatim in the points (they will be visually highlighted); include 2–6 terms so key parts of each point are highlighted.",
    "- paragraph slide must have only: type, variant, title, text.",
    "- diagram slide must have only: type, variant, title, nodes.",
    "- quote slide must have: type, variant (optional), quote; attribution is optional.",
    "- stat slide must have only: type, variant, value, label.",
    "- cta slide must have only: type, variant, text.",
    "Variant rules:",
    "- hero.variant allowed values: default, center.",
    "- flow.variant allowed values: default, grid.",
    "- explanation.variant allowed values: default, cards.",
    "- paragraph.variant allowed values: default, wide.",
    "- diagram.variant allowed values: default, grid.",
    "- quote.variant allowed values: default, highlight.",
    "- stat.variant allowed values: default, minimal.",
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
    "- Use 'explanation' for ideas that need clarifying: title sets the topic, points are short explanatory sentences (not just keywords) so the reader understands why and how. Always populate highlight with 2–6 words or short phrases that appear exactly in the points (e.g. if a point says 'quality drops', include 'quality' or 'quality drops' in highlight) so they render as visible highlights.",
    "- Use 'paragraph' when one idea is best told in a mini-story or short explanation: 2–4 sentences that explain like you're talking to someone, with context and a clear takeaway.",
    "- Use 'quote' for a memorable quote or pull-quote from the content (quote string; optional attribution). Use when a direct quote adds impact.",
    "- Use 'stat' for one standout number or metric (value e.g. 3x or 90%, label e.g. faster growth). Use when the content has a clear headline number.",
    "- Vary types across the carousel so the flow is not monotonous; match each slide type to what the content needs.",
    "Flow and pacing:",
    "- Each slide must logically connect to the previous one.",
    "- Order and type choice should make the carousel clear and easy to read from start to finish.",
    "- Do not repeat the same slide type in a row unless the content truly requires it.",
    "Explain, don't just list:",
    "- The goal is for the reader to understand, not only to see key points. Write as if one person is explaining to another: why it matters, how it works, or what it means in practice.",
    "- Prefer short explanatory sentences over bare bullet-style phrases. For explanation slides: each point should read like a complete thought that helps the reader get it (e.g. 'Most teams skip this step, so quality drops' not 'Skip step').",
    "- For paragraph slides: 2–4 sentences that tell a tiny story or explain one idea with a bit of context—so the reader feels guided and learns, not just informed.",
    "- Keep each slide concise: one idea per slide, no long blocks of text. Explanation comes from clear, human phrasing and a logical flow, not from length.",
    "Content quality (every slide):",
    "- Human telling a story to another human: warm, clear, natural; like explaining to a colleague or friend so they really get it. Avoid corporate jargon and dry lists.",
    "- Explanatory and easy to follow: each slide should help the reader understand; use cause-effect, examples, or 'so what' where it fits; the carousel should feel like a clear explanation from start to finish.",
    "- Stay professional: authoritative and credible; no slang or filler; active voice and concrete language; tone that matches the requested tone option.",
    "- Concise but complete: one clear idea per slide; short sentences; hero title and subtitle brief; flow steps can be short sentences that explain the step; explanation points = short explanatory lines; paragraph 2–4 sentences; quote one or two sentences; stat value and label short.",
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
