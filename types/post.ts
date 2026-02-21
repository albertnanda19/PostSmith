export type Slide = {
  headline: string
  content: string
  visualHint: string
}

export type HeroVariant = "default" | "center"
export type FlowVariant = "default" | "grid"
export type ExplanationVariant = "default" | "cards"
export type CtaVariant = "default" | "minimal"

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

export type StructuredSlide = HeroSlide | FlowSlide | ExplanationSlide | CtaSlide

export type StructuredPostOutput = {
  slides: StructuredSlide[]
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
