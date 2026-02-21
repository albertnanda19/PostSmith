import { NextResponse } from "next/server"

import type { ApiResponse } from "@/types/api"
import { cleanExtractedText } from "@/lib/pdf/clean-text"
import { parsePdfBuffer } from "@/lib/pdf/parse-pdf"
import { validatePdfFile, ValidationError } from "@/lib/utils/validation"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const fileValue = formData.get("file")

    if (!(fileValue instanceof File)) {
      throw new ValidationError("File is required")
    }

    validatePdfFile(fileValue)

    const buffer = Buffer.from(await fileValue.arrayBuffer())
    const rawText = await parsePdfBuffer(buffer)
    const cleanedText = cleanExtractedText(rawText)

    const response: ApiResponse<string> = { success: true, data: cleanedText }
    return NextResponse.json(response, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error"

    if (err instanceof ValidationError) {
      const response: ApiResponse<string> = { success: false, error: message }
      return NextResponse.json(response, { status: 400 })
    }

    if (process.env.NODE_ENV !== "production") {
      const response: ApiResponse<string> = { success: false, error: message }
      return NextResponse.json(response, { status: 500 })
    }

    const response: ApiResponse<string> = {
      success: false,
      error: "Failed to parse PDF",
    }

    return NextResponse.json(response, { status: 500 })
  }
}
