import { NextResponse } from "next/server"

import { renderSlideToPng } from "@/lib/render/render-slide"
import { validateRenderSlideInput, ValidationError } from "@/lib/utils/validation"

export const runtime = "nodejs"

type RenderRequestBody = {
  headline: string
  content: string
  slideIndex: number
}

function isRenderRequestBody(value: unknown): value is RenderRequestBody {
  if (typeof value !== "object" || value === null) return false

  const record = value as Record<string, unknown>
  return (
    typeof record.headline === "string" &&
    typeof record.content === "string" &&
    typeof record.slideIndex === "number"
  )
}

export async function POST(req: Request) {
  try {
    const bodyUnknown: unknown = await req.json()

    if (!isRenderRequestBody(bodyUnknown)) {
      throw new ValidationError("Invalid request body")
    }

    validateRenderSlideInput(
      bodyUnknown.headline,
      bodyUnknown.content,
      bodyUnknown.slideIndex
    )

    const png = await renderSlideToPng(
      bodyUnknown.headline,
      bodyUnknown.content,
      bodyUnknown.slideIndex
    )

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 })
    }

    return NextResponse.json(
      { success: false, error: "Failed to render slide" },
      { status: 500 }
    )
  }
}
