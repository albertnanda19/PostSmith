export type Slide = {
  headline: string
  content: string
  visualHint: string
}

export const RENDER_PRESETS = ["square", "linkedin"] as const

export type RenderPreset = (typeof RENDER_PRESETS)[number]

export const RENDER_PRESET_SIZES: Record<RenderPreset, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  linkedin: { width: 1200, height: 1500 },
}

export const POST_BACKGROUND_COLORS = [
  "#0f172a",
  "#111827",
  "#0b1324",
  "#0a1b2a",
  "#111b2e",
  "#0b1f1a",
  "#1a1026",
] as const

export type PostBackgroundColor = (typeof POST_BACKGROUND_COLORS)[number]

export type PostTheme = {
  backgroundColor: PostBackgroundColor
}

export type HeroVariant = "default" | "center"
export type FlowVariant = "default" | "grid"
export type ExplanationVariant = "default" | "cards"
export type CtaVariant = "default" | "minimal"
export type ParagraphVariant = "default" | "wide"
export type DiagramVariant = "default" | "grid"

export type HeroSlide = {
  type: "hero"
  variant?: HeroVariant
  title: string
  subtitle: string
}

export type FlowSlide = {
  type: "flow"
  variant?: FlowVariant
  steps: string[]
}

export type ExplanationSlide = {
  type: "explanation"
  variant?: ExplanationVariant
  title: string
  points: string[]
  highlight: string[]
}

export type CtaSlide = {
  type: "cta"
  variant?: CtaVariant
  text: string
}

export type ParagraphSlide = {
  type: "paragraph"
  variant?: ParagraphVariant
  title: string
  text: string
}

export type DiagramSlide = {
  type: "diagram"
  variant?: DiagramVariant
  title: string
  nodes: string[]
}

export type StructuredSlide =
  | HeroSlide
  | FlowSlide
  | ExplanationSlide
  | CtaSlide
  | ParagraphSlide
  | DiagramSlide

export type StructuredPostOutput = {
  slides: StructuredSlide[]
  theme: PostTheme
  caption: string
  hashtags: string[]
}

export type PostOutput = {
  slides: Slide[]
  caption: string
  hashtags: string[]
}

export type GenerationOptions = {
  maxSlides: number
  tone: string
  brandingFooter?: string
}
