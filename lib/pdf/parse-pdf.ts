import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

type PdfJsTextItem = {
  str: string
}

type PdfJsPage = {
  getTextContent: () => Promise<{ items: unknown[] }>
}

type PdfJsDocument = {
  numPages: number
  getPage: (pageNumber: number) => Promise<PdfJsPage>
  destroy: () => Promise<void>
}

type PdfJsLoadingTask = {
  promise: Promise<PdfJsDocument>
}

type PdfJsModule = {
  getDocument: (src: { data: Uint8Array; disableWorker: boolean }) => PdfJsLoadingTask
}

function resolvePdfJs(mod: unknown): PdfJsModule {
  if (!isRecord(mod) || typeof mod.getDocument !== "function") {
    throw new Error("PDF parser is unavailable")
  }

  return mod as unknown as PdfJsModule
}

function resolvePdfJsDistUrls(): { pdfUrl: string; workerUrl: string } {
  const require = createRequire(import.meta.url)
  const pdfPath = require.resolve("pdfjs-dist/legacy/build/pdf.mjs")
  const workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")
  return {
    pdfUrl: pathToFileURL(pdfPath).toString(),
    workerUrl: pathToFileURL(workerPath).toString(),
  }
}

function extractTextItems(items: unknown[]): string {
  const parts: string[] = []

  for (const item of items) {
    if (!isRecord(item)) continue
    const str = item.str
    if (typeof str !== "string") continue
    if (!str) continue
    parts.push(str)
  }

  return parts.join(" ")
}

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const { pdfUrl, workerUrl } = resolvePdfJsDistUrls()
  const mod: unknown = await import(pdfUrl)
  const pdfjs = resolvePdfJs(mod)

  if (isRecord(mod) && isRecord(mod.GlobalWorkerOptions)) {
    mod.GlobalWorkerOptions.workerSrc = workerUrl
  }

  const data = new Uint8Array(buffer)
  const task = pdfjs.getDocument({ data, disableWorker: true })
  const doc = await task.promise
  let combined = ""

  try {
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const pageText = extractTextItems(content.items).trim()
      if (!pageText) continue
      combined = combined ? `${combined}\n${pageText}` : pageText
    }
  } finally {
    await doc.destroy()
  }

  const text = combined.trim()

  if (!text) {
    throw new Error("No text could be extracted from the PDF")
  }

  return combined
}
