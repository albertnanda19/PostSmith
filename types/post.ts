export type Slide = {
  headline: string
  content: string
  visualHint: string
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
