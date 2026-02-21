type PdfParseResult = {
  text: string
}

type PdfParseFn = (buffer: Buffer) => Promise<PdfParseResult>

type PdfParseInstance = {
  load: (buffer: Buffer) => Promise<void>
  getText: () => Promise<string>
  destroy?: () => void
}

type PdfParseClass = new (options: object) => PdfParseInstance

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isClassConstructor(value: unknown): value is new (...args: never[]) => unknown {
  if (typeof value !== "function") return false
  return /^class\s/.test(Function.prototype.toString.call(value))
}

function resolvePdfParse(mod: unknown): PdfParseFn {
  if (typeof mod === "function") {
    return mod as PdfParseFn
  }

  if (isRecord(mod) && typeof mod.default === "function") {
    return mod.default as PdfParseFn
  }

  if (isRecord(mod) && typeof mod.PDFParse === "function") {
    if (isClassConstructor(mod.PDFParse)) {
      const Parser = mod.PDFParse as PdfParseClass
      return async (buffer: Buffer) => {
        const instance = new Parser({ disableWorker: true })
        try {
          await instance.load(buffer)
          const text = await instance.getText()
          return { text }
        } finally {
          instance.destroy?.()
        }
      }
    }

    return mod.PDFParse as PdfParseFn
  }

  if (
    isRecord(mod) &&
    isRecord(mod.default) &&
    typeof mod.default.PDFParse === "function"
  ) {
    if (isClassConstructor(mod.default.PDFParse)) {
      const Parser = mod.default.PDFParse as PdfParseClass
      return async (buffer: Buffer) => {
        const instance = new Parser({ disableWorker: true })
        try {
          await instance.load(buffer)
          const text = await instance.getText()
          return { text }
        } finally {
          instance.destroy?.()
        }
      }
    }

    return mod.default.PDFParse as PdfParseFn
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
