import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PostTheme, RenderPreset, StructuredSlide } from "@/types/post"

type DownloadActionsProps = {
  slides: StructuredSlide[]
  theme: PostTheme
  className?: string
}

type RenderBatchRequestBody = {
  slides: StructuredSlide[]
  theme: PostTheme
  preset: RenderPreset
}

function buildRenderBatchRequest(
  slides: StructuredSlide[],
  theme: PostTheme,
  preset: RenderPreset
): RenderBatchRequestBody {
  return { slides, theme, preset }
}

async function downloadFileFromResponse(res: Response, filename: string): Promise<void> {
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

function DownloadActions({ slides, theme, className }: DownloadActionsProps) {
  const [isRendering, setIsRendering] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onDownload = async (preset: RenderPreset) => {
    if (isRendering) return
    setError(null)
    setIsRendering(true)

    try {
      const body = buildRenderBatchRequest(slides, theme, preset)

      const res = await fetch("/api/render/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error("Failed to render slides")
      }

      const filename = preset === "linkedin" ? "slides-1200x1500.zip" : "slides-1080x1080.zip"
      await downloadFileFromResponse(res, filename)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to render slides"
      setError(message)
    } finally {
      setIsRendering(false)
    }
  }

  const onDownloadPdfLinkedIn = async () => {
    if (isRendering) return
    setError(null)
    setIsRendering(true)

    try {
      const body = buildRenderBatchRequest(slides, theme, "linkedin")

      const res = await fetch("/api/render/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error("Failed to render PDF")
      }

      await downloadFileFromResponse(res, "slides-1200x1500.pdf")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to render PDF"
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
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            className="w-full"
            onClick={() => onDownload("square")}
            disabled={isRendering}
          >
            {isRendering ? "Rendering..." : "Download 1080x1080"}
          </Button>
          <Button
            type="button"
            className="w-full"
            variant="outline"
            onClick={() => onDownload("linkedin")}
            disabled={isRendering}
          >
            {isRendering ? "Rendering..." : "Download 1200x1500"}
          </Button>
          <Button
            type="button"
            className="w-full"
            variant="secondary"
            onClick={onDownloadPdfLinkedIn}
            disabled={isRendering}
          >
            {isRendering ? "Rendering..." : "Download PDF 1200x1500"}
          </Button>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
      </CardContent>
    </Card>
  )
}

export { DownloadActions }
