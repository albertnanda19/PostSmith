import * as React from "react"

import type { Slide } from "@/types/post"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SlideGridProps = {
  slides: Slide[]
  className?: string
}

function SlideGrid({ slides, className }: SlideGridProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {slides.map((slide, idx) => (
        <Card key={idx}>
          <CardHeader className="space-y-1">
            <div className="text-sm text-neutral-600">Slide {idx + 1}</div>
            <CardTitle className="text-base">{slide.headline}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm leading-6 text-neutral-900">
              {slide.content}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export { SlideGrid }
