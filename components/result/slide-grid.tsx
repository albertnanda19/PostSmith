import * as React from "react"

import type { StructuredSlide } from "@/types/post"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SlideGridProps = {
  slides: StructuredSlide[]
  className?: string
}

function getSlideTitle(slide: StructuredSlide): string {
  switch (slide.type) {
    case "hero":
      return slide.title
    case "flow":
      return "Architecture Flow"
    case "explanation":
      return slide.title
    case "cta":
      return "CTA"
    default: {
      const unreachable: never = slide
      return String(unreachable)
    }
  }
}

function getSlideBody(slide: StructuredSlide): string {
  switch (slide.type) {
    case "hero":
      return slide.subtitle
    case "flow":
      return slide.steps.join("\n")
    case "explanation":
      return slide.points.join("\n")
    case "cta":
      return slide.text
    default: {
      const unreachable: never = slide
      return String(unreachable)
    }
  }
}

function SlideGrid({ slides, className }: SlideGridProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {slides.map((slide, idx) => (
        <Card key={idx}>
          <CardHeader className="space-y-1">
            <div className="text-sm text-neutral-600">Slide {idx + 1}</div>
            <CardTitle className="text-base">{getSlideTitle(slide)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm leading-6 text-neutral-900">
              {getSlideBody(slide)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export { SlideGrid }
