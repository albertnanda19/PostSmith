import path from "path"
import { pathToFileURL } from "url"

import type { Page } from "puppeteer"

import { getBrowser } from "@/lib/render/browser"
import { buildSlideHtml } from "@/lib/render/template-builder"

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
  headline: string,
  content: string,
  slideIndex: number
): Promise<Buffer> {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 })

    const html = injectBaseHref(
      buildSlideHtml(headline, content, slideIndex),
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

    if (!Buffer.isBuffer(buffer)) {
      throw new Error("Failed to render PNG")
    }

    return buffer
  } finally {
    await closePageSafely(page)
  }
}
