import { NextResponse } from "next/server"

import type { ApiResponse } from "@/types/api"
import type { StructuredPostOutput } from "@/types/post"
import { generateCarousel } from "@/lib/llm/generate-carousel"
import { validateGenerationText, ValidationError } from "@/lib/utils/validation"

export const runtime = "nodejs"

type GenerateRequestBody = {
  text: string
}

function isGenerateRequestBody(value: unknown): value is GenerateRequestBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "text" in value &&
    typeof (value as { text: unknown }).text === "string"
  )
}

export async function POST(req: Request) {
  try {
    const bodyUnknown: unknown = await req.json()

    if (!isGenerateRequestBody(bodyUnknown)) {
      throw new ValidationError("Invalid request body")
    }

    validateGenerationText(bodyUnknown.text)

    const options = {
      maxSlides: 10,
      tone: "conversational but professional",
      brandingFooter: undefined,
    }

    const output = await generateCarousel(bodyUnknown.text, options)

    const response: ApiResponse<StructuredPostOutput> = { success: true, data: output }
    return NextResponse.json(response, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error"

    if (err instanceof ValidationError) {
      const response: ApiResponse<StructuredPostOutput> = {
        success: false,
        error: message,
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (process.env.NODE_ENV !== "production") {
      const response: ApiResponse<StructuredPostOutput> = {
        success: false,
        error: message,
      }

      return NextResponse.json(response, { status: 500 })
    }

    const response: ApiResponse<StructuredPostOutput> = {
      success: false,
      error: "Failed to generate carousel",
    }

    return NextResponse.json(response, { status: 500 })
  }
}
