type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
  error?: {
    message?: string
  }
}

function resolveGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is required")
  return apiKey
}

function resolveGeminiModel(): string {
  const model = process.env.GEMINI_MODEL
  const raw = model && typeof model === "string" ? model.trim() : ""
  const normalized = raw.startsWith("models/") ? raw.slice("models/".length) : raw
  if (normalized) return normalized
  return "gemini-1.5-flash"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function extractGeminiText(payload: unknown): string {
  if (!isRecord(payload)) throw new Error("Gemini generation failed")
  const response = payload as GeminiGenerateContentResponse
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text === "string" && text.trim()) return text
  const message = response.error?.message
  if (typeof message === "string" && message.trim()) throw new Error(message)
  throw new Error("Gemini generation failed")
}

export async function generateGeminiText(prompt: string): Promise<string> {
  const apiKey = resolveGeminiApiKey()
  const model = resolveGeminiModel()

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent`
  )
  url.searchParams.set("key", apiKey)

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  }

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  const payload: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const message = isRecord(payload)
      ? (payload as GeminiGenerateContentResponse).error?.message
      : undefined
    throw new Error(
      typeof message === "string" && message.trim()
        ? message
        : "Gemini generation failed"
    )
  }

  return extractGeminiText(payload)
}
