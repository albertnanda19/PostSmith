import path from "path"
import { pathToFileURL } from "url"

import type { Page } from "puppeteer"

import { getBrowser } from "@/lib/render/browser"
import { buildSlideHtml } from "@/lib/render/template-builder"
import type { PostBackgroundColor, RenderPreset, StructuredSlide } from "@/types/post"
import { RENDER_PRESET_SIZES } from "@/types/post"

function buildPublicBaseHref(): string {
  const publicDir = path.join(process.cwd(), "public")
  const href = pathToFileURL(publicDir).href
  return href.endsWith("/") ? href : `${href}/`
}

function injectBaseHref(html: string, baseHref: string): string {
  const headTag = "<head>"
  const idx = html.indexOf(headTag)
  if (idx === -1) return html
  const insertAt = idx + headTag.length
  return `${html.slice(0, insertAt)}<base href=\"${baseHref}\">${html.slice(insertAt)}`
}

async function closePageSafely(page: Page): Promise<void> {
  try {
    await page.close()
  } catch {
    return
  }
}

export async function renderSlideToPng(
  slide: StructuredSlide,
  backgroundColor?: PostBackgroundColor,
  preset: RenderPreset = "square"
): Promise<Buffer> {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    const size = RENDER_PRESET_SIZES[preset]
    await page.setViewport({ width: size.width, height: size.height, deviceScaleFactor: 1 })

    const html = injectBaseHref(
      buildSlideHtml(slide, backgroundColor, preset),
      buildPublicBaseHref()
    )

    await page.setContent(html, { waitUntil: "networkidle0" })
    await page.evaluate(async () => {
      await document.fonts.ready
    })

    const buffer = await page.screenshot({
      type: "png",
      fullPage: false,
    })

    if (Buffer.isBuffer(buffer)) {
      return buffer
    }

    if (buffer instanceof Uint8Array) {
      return Buffer.from(buffer)
    }

    throw new Error("Failed to render PNG")
  } finally {
    await closePageSafely(page)
  }
}
