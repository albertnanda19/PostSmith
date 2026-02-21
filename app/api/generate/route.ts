import { NextResponse } from "next/server"

import type { ApiResponse } from "@/types/api"
import type { PostOutput } from "@/types/post"
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

    const response: ApiResponse<PostOutput> = { success: true, data: output }
    return NextResponse.json(response, { status: 200 })
  } catch (err) {
    if (err instanceof ValidationError) {
      const response: ApiResponse<PostOutput> = {
        success: false,
        error: err.message,
      }
      return NextResponse.json(response, { status: 400 })
    }

    const response: ApiResponse<PostOutput> = {
      success: false,
      error: "Failed to generate carousel",
    }

    return NextResponse.json(response, { status: 500 })
  }
}
