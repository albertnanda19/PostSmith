import { NextResponse } from "next/server"
import type { Readable } from "stream"

import { renderSlidesToZipStream } from "@/lib/render/render-batch"
import type { PostBackgroundColor, StructuredSlide } from "@/types/post"
import { POST_BACKGROUND_COLORS } from "@/types/post"
import { ValidationError } from "@/lib/utils/validation"

export const runtime = "nodejs"

type RenderBatchRequestBody = {
  slides: StructuredSlide[]
  theme: {
    backgroundColor: PostBackgroundColor
  }
}

async function nodeStreamToBuffer(nodeStream: Readable): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []

    const onData = (chunk: unknown) => {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk)
        return
      }

      if (chunk instanceof Uint8Array) {
        chunks.push(Buffer.from(chunk))
        return
      }

      if (typeof chunk === "string") {
        chunks.push(Buffer.from(chunk))
        return
      }

      reject(new Error("Invalid stream chunk"))
    }

    const onEnd = () => resolve(Buffer.concat(chunks))
    const onError = (err: unknown) => reject(err instanceof Error ? err : new Error("Stream error"))

    nodeStream.on("data", onData)
    nodeStream.once("end", onEnd)
    nodeStream.once("error", onError)
  })
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

function isPostBackgroundColor(value: unknown): value is PostBackgroundColor {
  return typeof value === "string" && POST_BACKGROUND_COLORS.includes(value as PostBackgroundColor)
}

function isRenderBatchRequestBody(value: unknown): value is RenderBatchRequestBody {
  if (!isRecord(value)) return false

  const record = value
  if (!Array.isArray(record.slides)) return false

  if (!isRecord(record.theme)) return false
  if (!isPostBackgroundColor(record.theme.backgroundColor)) return false

  return record.slides.every(isStructuredSlide)
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

    const nodeStream = renderSlidesToZipStream(
      bodyUnknown.slides,
      bodyUnknown.theme.backgroundColor,
      2
    )
    const zipBuffer = await nodeStreamToBuffer(nodeStream)

    return new NextResponse(new Uint8Array(zipBuffer), {
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

    if (process.env.NODE_ENV !== "production") {
      const message = err instanceof Error ? err.message : "Failed to render slides"
      return NextResponse.json({ success: false, error: message }, { status: 500 })
    }

    return NextResponse.json(
      { success: false, error: "Failed to render slides" },
      { status: 500 }
    )
  }
}
