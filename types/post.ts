export type Slide = {
  headline: string
  content: string
  visualHint: string
}

export type HeroSlide = {
  type: "hero"
  title: string
  subtitle: string
}

export type FlowSlide = {
  type: "flow"
  steps: string[]
}

export type ExplanationSlide = {
  type: "explanation"
  title: string
  points: string[]
  highlight: string[]
}

export type CtaSlide = {
  type: "cta"
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
