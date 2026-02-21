type PdfParseResult = {
  text: string
}

type PdfParseFn = (buffer: Buffer) => Promise<PdfParseResult>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function resolvePdfParse(mod: unknown): PdfParseFn {
  if (typeof mod === "function") {
    return mod as PdfParseFn
  }

  if (isRecord(mod) && typeof mod.default === "function") {
    return mod.default as PdfParseFn
  }

  throw new Error("PDF parser is unavailable")
}

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const mod: unknown = await import("pdf-parse")
  const pdfParse = resolvePdfParse(mod)

  const result = await pdfParse(buffer)
  const text = result.text.trim()

  if (!text) {
    throw new Error("No text could be extracted from the PDF")
  }

  return result.text
}
