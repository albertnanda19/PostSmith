"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type CaptionBoxProps = {
  caption: string
  className?: string
}

function CaptionBox({ caption, className }: CaptionBoxProps) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return

    const timeout = window.setTimeout(() => setCopied(false), 1200)
    return () => window.clearTimeout(timeout)
  }, [copied])

  const onCopy = async () => {
    if (!caption) return
    try {
      await navigator.clipboard.writeText(caption)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Caption</CardTitle>
        <Button type="button" variant="outline" onClick={onCopy}>
          {copied ? "Copied" : "Copy Caption"}
        </Button>
      </CardHeader>
      <CardContent>
        <Textarea value={caption} readOnly className="min-h-32" />
      </CardContent>
    </Card>
  )
}

export { CaptionBox }
