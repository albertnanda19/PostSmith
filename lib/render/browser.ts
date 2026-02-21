import puppeteer, { type Browser } from "puppeteer"

let browserPromise: Promise<Browser> | null = null
let browserInstance: Browser | null = null

async function launchBrowser(): Promise<Browser> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  browser.on("disconnected", () => {
    browserInstance = null
    browserPromise = null
  })

  return browser
}

export async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance
  }

  if (!browserPromise) {
    browserPromise = launchBrowser()
      .then((b) => {
        browserInstance = b
        return b
      })
      .catch((err: unknown) => {
        browserPromise = null
        browserInstance = null
        if (err instanceof Error) {
          throw new Error(`Failed to launch browser: ${err.message}`)
        }
        throw new Error("Failed to launch browser")
      })
  }

  return browserPromise
}
