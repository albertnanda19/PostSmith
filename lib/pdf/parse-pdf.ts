import pdfParse = require("pdf-parse")

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer)
  const text = result.text.trim()

  if (!text) {
    throw new Error("No text could be extracted from the PDF")
  }

  return result.text
}
