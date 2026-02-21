import * as React from "react"

type CarouselPreviewProps = {
  className?: string
}

function CarouselPreview({ className }: CarouselPreviewProps) {
  return <div className={className} />
}

export { CarouselPreview }
