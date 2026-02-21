import { NextResponse } from "next/server"

import { ValidationError } from "@/lib/utils/validation"
import { renderSlidesToPdfBuffer } from "@/lib/render/render-pdf"
import type { PostBackgroundColor, RenderPreset, StructuredSlide } from "@/types/post"
import { POST_BACKGROUND_COLORS, RENDER_PRESETS } from "@/types/post"

export const runtime = "nodejs"

type RenderPdfRequestBody = {
  slides: StructuredSlide[]
  theme: {
    backgroundColor: PostBackgroundColor
  }
  preset: RenderPreset
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

function isParagraphSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return value.type === "paragraph" && isNonEmptyString(value.title) && isNonEmptyString(value.text)
}

function isDiagramSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return (
    value.type === "diagram" &&
    isNonEmptyString(value.title) &&
    Array.isArray(value.nodes) &&
    value.nodes.every(isNonEmptyString)
  )
}

function isCtaSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return value.type === "cta" && isNonEmptyString(value.text)
}

function isStructuredSlide(value: unknown): value is StructuredSlide {
  return (
    isHeroSlide(value) ||
    isFlowSlide(value) ||
    isExplanationSlide(value) ||
    isParagraphSlide(value) ||
    isDiagramSlide(value) ||
    isCtaSlide(value)
  )
}

function isPostBackgroundColor(value: unknown): value is PostBackgroundColor {
  return typeof value === "string" && POST_BACKGROUND_COLORS.includes(value as PostBackgroundColor)
}

function isRenderPreset(value: unknown): value is RenderPreset {
  return typeof value === "string" && RENDER_PRESETS.includes(value as RenderPreset)
}

function isRenderPdfRequestBody(value: unknown): value is RenderPdfRequestBody {
  if (!isRecord(value)) return false

  const record = value
  if (!Array.isArray(record.slides)) return false

  if (!isRecord(record.theme)) return false
  if (!isPostBackgroundColor(record.theme.backgroundColor)) return false

  if (!isRenderPreset(record.preset)) return false

  return record.slides.every(isStructuredSlide)
}

export async function POST(req: Request) {
  try {
    const bodyUnknown: unknown = await req.json()

    if (!isRenderPdfRequestBody(bodyUnknown)) {
      throw new ValidationError("Invalid request body")
    }

    if (bodyUnknown.preset !== "linkedin") {
      throw new ValidationError("PDF export is only supported for linkedin preset")
    }

    if (bodyUnknown.slides.length === 0) {
      throw new ValidationError("Slides are required")
    }

    const pdfBuffer = await renderSlidesToPdfBuffer(
      bodyUnknown.slides,
      bodyUnknown.theme.backgroundColor,
      "linkedin",
      2
    )

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"slides-1200x1500.pdf\"",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 })
    }

    if (process.env.NODE_ENV !== "production") {
      const message = err instanceof Error ? err.message : "Failed to render PDF"
      return NextResponse.json({ success: false, error: message }, { status: 500 })
    }

    return NextResponse.json({ success: false, error: "Failed to render PDF" }, { status: 500 })
  }
}
