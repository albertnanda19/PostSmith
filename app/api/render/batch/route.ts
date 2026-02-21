import { NextResponse } from "next/server"
import type { Readable } from "stream"

import { renderSlidesToZipStream } from "@/lib/render/render-batch"
import { validateRenderSlideInput, ValidationError } from "@/lib/utils/validation"

export const runtime = "nodejs"

type SlideInput = {
  headline: string
  content: string
  slideIndex: number
}

type RenderBatchRequestBody = {
  slides: SlideInput[]
}

function isSlideInput(value: unknown): value is SlideInput {
  if (typeof value !== "object" || value === null) return false

  const record = value as Record<string, unknown>
  return (
    typeof record.headline === "string" &&
    typeof record.content === "string" &&
    typeof record.slideIndex === "number"
  )
}

function isRenderBatchRequestBody(value: unknown): value is RenderBatchRequestBody {
  if (typeof value !== "object" || value === null) return false

  const record = value as Record<string, unknown>
  if (!Array.isArray(record.slides)) return false

  return record.slides.every(isSlideInput)
}

function nodeReadableToWebStream(nodeStream: Readable): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const onData = (chunk: unknown) => {
        if (chunk instanceof Uint8Array) {
          controller.enqueue(chunk)
          return
        }

        if (typeof chunk === "string") {
          controller.enqueue(new TextEncoder().encode(chunk))
          return
        }

        controller.error(new Error("Invalid stream chunk"))
      }

      const onEnd = () => controller.close()
      const onError = (err: unknown) => {
        controller.error(err instanceof Error ? err : new Error("Stream error"))
      }

      nodeStream.on("data", onData)
      nodeStream.on("end", onEnd)
      nodeStream.on("error", onError)

      nodeStream.once("close", () => {
        nodeStream.off("data", onData)
        nodeStream.off("end", onEnd)
        nodeStream.off("error", onError)
      })

      nodeStream.resume()
    },
    cancel() {
      nodeStream.destroy()
    },
  })
}

export async function POST(req: Request) {
  try {
    const bodyUnknown: unknown = await req.json()

    if (!isRenderBatchRequestBody(bodyUnknown)) {
      throw new ValidationError("Invalid request body")
    }

    if (bodyUnknown.slides.length === 0) {
      throw new ValidationError("Slides are required")
    }

    for (const slide of bodyUnknown.slides) {
      validateRenderSlideInput(slide.headline, slide.content, slide.slideIndex)
    }

    const nodeStream = renderSlidesToZipStream(bodyUnknown.slides, 2)
    const webStream = nodeReadableToWebStream(nodeStream)

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=\"slides.zip\"",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 })
    }

    return NextResponse.json(
      { success: false, error: "Failed to render slides" },
      { status: 500 }
    )
  }
}
