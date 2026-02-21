import { PDFDocument } from "pdf-lib"

import type { PostBackgroundColor, StructuredSlide } from "@/types/post"
import { RENDER_PRESET_SIZES } from "@/types/post"
import { renderSlideToPng } from "@/lib/render/render-slide"
import { runWithConcurrencyLimit } from "@/lib/utils/promise-pool"

type IndexedPng = {
  index: number
  png: Buffer
}

export async function renderSlidesToPdfBuffer(
  slides: StructuredSlide[],
  backgroundColor: PostBackgroundColor,
  preset: "linkedin" = "linkedin",
  concurrency = 2
): Promise<Buffer> {
  if (!slides.length) {
    throw new Error("Slides are required")
  }

  const size = RENDER_PRESET_SIZES[preset]
  const pdf = await PDFDocument.create()

  const indexedPngs: IndexedPng[] = []

  await runWithConcurrencyLimit(
    slides.map((slide, index) => ({ slide, index })),
    concurrency,
    async ({ slide, index }) => {
      const png = await renderSlideToPng(slide, backgroundColor, preset)
      indexedPngs.push({ index, png })
      return null
    }
  )

  indexedPngs.sort((a, b) => a.index - b.index)

  for (const item of indexedPngs) {
    const page = pdf.addPage([size.width, size.height])
    const embedded = await pdf.embedPng(item.png)
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
    })
  }

  const bytes = await pdf.save()
  return Buffer.from(bytes)
}
