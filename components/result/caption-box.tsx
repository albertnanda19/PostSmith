import * as React from "react"

type CaptionBoxProps = {
  className?: string
}

function CaptionBox({ className }: CaptionBoxProps) {
  return <div className={className} />
}

export { CaptionBox }
