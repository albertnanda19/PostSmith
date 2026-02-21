import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StructuredSlide } from "@/types/post"

type DownloadActionsProps = {
  slides: StructuredSlide[]
  className?: string
}

type RenderBatchRequestBody = {
  slides: StructuredSlide[]
}

function buildRenderBatchRequest(slides: StructuredSlide[]): RenderBatchRequestBody {
  return { slides }
}

async function downloadZipFromResponse(res: Response, filename: string): Promise<void> {
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)

  try {
    const anchor = document.createElement("a")
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function DownloadActions({ slides, className }: DownloadActionsProps) {
  const [isRendering, setIsRendering] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onDownload = async () => {
    if (isRendering) return
    setError(null)
    setIsRendering(true)

    try {
      const body = buildRenderBatchRequest(slides)

      const res = await fetch("/api/render/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error("Failed to render slides")
      }

      await downloadZipFromResponse(res, "slides.zip")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to render slides"
      setError(message)
    } finally {
      setIsRendering(false)
    }
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" className="w-full" onClick={onDownload} disabled={isRendering}>
            {isRendering ? "Rendering..." : "Download Slides"}
          </Button>
          <Button type="button" className="w-full" variant="outline" disabled>
            Preview Carousel
          </Button>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
      </CardContent>
    </Card>
  )
}

export { DownloadActions }
