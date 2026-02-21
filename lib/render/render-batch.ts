import archiver from "archiver"
import type { Archiver } from "archiver"
import type { Readable } from "stream"

import { renderSlideToPng } from "@/lib/render/render-slide"
import { runWithConcurrencyLimit } from "@/lib/utils/promise-pool"
import type { PostBackgroundColor, RenderPreset, StructuredSlide } from "@/types/post"

type IndexedSlide = {
  index: number
  slide: StructuredSlide
}

function formatSlideFilename(index: number): string {
  const padded = String(index + 1).padStart(2, "0")
  return `slide-${padded}.png`
}

function createZipArchive(): Archiver {
  return archiver("zip", { zlib: { level: 9 } })
}

export function renderSlidesToZipStream(
  slides: StructuredSlide[],
  backgroundColor: PostBackgroundColor,
  preset: RenderPreset,
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
        archive.append(buf, { name: formatSlideFilename(nextToAppend) })
        nextToAppend += 1
      }
    })
  }

  const task = async () => {
    const indexed: IndexedSlide[] = slides.map((slide, index) => ({ index, slide }))

    await runWithConcurrencyLimit(indexed, concurrency, async ({ index, slide }) => {
      const png = await renderSlideToPng(slide, backgroundColor, preset)

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
