import archiver from "archiver"
import type { Archiver } from "archiver"
import type { Readable } from "stream"

import { renderSlideToPng } from "@/lib/render/render-slide"
import { runWithConcurrencyLimit } from "@/lib/utils/promise-pool"
import { validateRenderSlideInput } from "@/lib/utils/validation"

export type RenderBatchSlideInput = {
  headline: string
  content: string
  slideIndex: number
}

type IndexedSlide = {
  index: number
  slide: RenderBatchSlideInput
}

function formatSlideFilename(slideIndex: number): string {
  const padded = String(Math.trunc(slideIndex)).padStart(2, "0")
  return `slide-${padded}.png`
}

function createZipArchive(): Archiver {
  return archiver("zip", { zlib: { level: 9 } })
}

export function renderSlidesToZipStream(
  slides: RenderBatchSlideInput[],
  concurrency = 2
): Readable {
  if (!slides.length) {
    throw new Error("Slides are required")
  }

  const archive = createZipArchive()

  const buffered = new Map<number, Buffer>()
  let nextToAppend = 0
  let appendChain: Promise<void> = Promise.resolve()

  const queueAppend = (index: number, png: Buffer) => {
    buffered.set(index, png)

    appendChain = appendChain.then(() => {
      while (buffered.has(nextToAppend)) {
        const buf = buffered.get(nextToAppend)
        if (!buf) break
        buffered.delete(nextToAppend)
        const slide = slides[nextToAppend]
        archive.append(buf, { name: formatSlideFilename(slide.slideIndex) })
        nextToAppend += 1
      }
    })
  }

  const task = async () => {
    const indexed: IndexedSlide[] = slides.map((slide, index) => ({ index, slide }))

    await runWithConcurrencyLimit(indexed, concurrency, async ({ index, slide }) => {
      validateRenderSlideInput(slide.headline, slide.content, slide.slideIndex)

      const png = await renderSlideToPng(
        slide.headline,
        slide.content,
        slide.slideIndex
      )

      queueAppend(index, png)
      return null
    })

    await appendChain

    await archive.finalize()
  }

  task().catch((err: unknown) => {
    const error = err instanceof Error ? err : new Error("Batch render failed")
    archive.destroy(error)
  })

  return archive
}
