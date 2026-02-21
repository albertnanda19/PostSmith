import { NextResponse } from "next/server"
import type { Readable } from "stream"

import { renderSlidesToZipStream } from "@/lib/render/render-batch"
import type { StructuredSlide } from "@/types/post"
import { ValidationError } from "@/lib/utils/validation"

export const runtime = "nodejs"

type RenderBatchRequestBody = {
  slides: StructuredSlide[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isHeroSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return value.type === "hero" && isNonEmptyString(value.title) && isNonEmptyString(value.subtitle)
}

function isFlowSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return value.type === "flow" && Array.isArray(value.steps) && value.steps.every(isNonEmptyString)
}

function isExplanationSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return (
    value.type === "explanation" &&
    isNonEmptyString(value.title) &&
    Array.isArray(value.points) &&
    value.points.every(isNonEmptyString) &&
    Array.isArray(value.highlight) &&
    value.highlight.every(isNonEmptyString)
  )
}

function isCtaSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return value.type === "cta" && isNonEmptyString(value.text)
}

function isStructuredSlide(value: unknown): value is StructuredSlide {
  return isHeroSlide(value) || isFlowSlide(value) || isExplanationSlide(value) || isCtaSlide(value)
}

function isRenderBatchRequestBody(value: unknown): value is RenderBatchRequestBody {
  if (!isRecord(value)) return false

  const record = value
  if (!Array.isArray(record.slides)) return false

  return record.slides.every(isStructuredSlide)
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
