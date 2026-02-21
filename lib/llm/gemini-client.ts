import {
  type GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai"

export function createGeminiClient(): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required")
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
}
