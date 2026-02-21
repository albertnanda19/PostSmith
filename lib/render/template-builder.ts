import type { StructuredSlide } from "@/types/post"

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function applyHighlights(pointText: string, highlights: string[]): string {
  const base = escapeHtml(pointText)
  const normalized = highlights
    .map((h) => h.trim())
    .filter((h) => h.length > 0)

  const unique = Array.from(new Set(normalized))
  unique.sort((a, b) => b.length - a.length)

  return unique.reduce((acc, highlight) => {
    const safeHighlight = escapeHtml(highlight)
    const re = new RegExp(escapeRegex(safeHighlight), "g")
    return acc.replace(re, `<span class="highlight">${safeHighlight}</span>`)
  }, base)
}

function renderHeroSlide(title: string, subtitle: string): string {
  const safeTitle = escapeHtml(title.trim())
  const safeSubtitle = escapeHtml(subtitle.trim())

  return `
      <div class="content hero">
        <div class="inner">
          <h1 class="hero-title">${safeTitle}</h1>
          <p class="hero-subtitle">${safeSubtitle}</p>
        </div>
      </div>`
}

function renderFlowSlide(steps: string[]): string {
  if (steps.length > 6) {
    throw new Error("Flow slide steps must be 6 or fewer")
  }

  const safeSteps = steps
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => escapeHtml(s))

  if (safeSteps.length === 0) {
    throw new Error("Flow slide steps are required")
  }

  const cards = safeSteps
    .map(
      (step) => `
          <div class="flow-step">
            <div class="flow-step-text">${step}</div>
          </div>`
    )
    .join("")

  return `
      <div class="content flow">
        <div class="inner">
          <h1 class="flow-title">Architecture Flow</h1>
          <div class="flow-stack">${cards}</div>
        </div>
      </div>`
}

function renderExplanationSlide(
  title: string,
  points: string[],
  highlight: string[]
): string {
  const safeTitle = escapeHtml(title.trim())

  const safePoints = points
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  if (safePoints.length === 0) {
    throw new Error("Explanation slide points are required")
  }

  const items = safePoints
    .map((p) => {
      const html = applyHighlights(p, highlight)
      return `
            <li class="point">
              <div class="bullet"></div>
              <div class="point-text">${html}</div>
            </li>`
    })
    .join("")

  return `
      <div class="content explanation">
        <div class="inner">
          <h1 class="explanation-title">${safeTitle}</h1>
          <ul class="points">${items}
          </ul>
        </div>
      </div>`
}

function renderCtaSlide(text: string): string {
  const safeText = escapeHtml(text.trim())

  return `
      <div class="content cta">
        <div class="inner cta-inner">
          <div class="cta-main">${safeText}</div>
          <div class="cta-divider"></div>
          <div class="cta-footer">Albert Mangiri</div>
        </div>
      </div>`
}

export function buildSlideHtml(slide: StructuredSlide): string {
  const body = (() => {
    switch (slide.type) {
      case "hero":
        return renderHeroSlide(slide.title, slide.subtitle)
      case "flow":
        return renderFlowSlide(slide.steps)
      case "explanation":
        return renderExplanationSlide(slide.title, slide.points, slide.highlight)
      case "cta":
        return renderCtaSlide(slide.text)
      default: {
        const unreachable: never = slide
        throw new Error(`Unknown slide type: ${JSON.stringify(unreachable)}`)
      }
    }
  })()

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * {
        box-sizing: border-box;
      }

      html,
      body {
        width: 1080px;
        height: 1080px;
        margin: 0;
        padding: 0;
        background: #0f172a;
      }

      body {
        font-family: Poppins, Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI",
          Roboto, Arial, sans-serif;
        color: #ffffff;
      }

      .frame {
        width: 1080px;
        height: 1080px;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        background: #0f172a;
      }

      .frame::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(
          900px 900px at 15% 10%,
          rgba(56, 189, 248, 0.14) 0%,
          rgba(15, 23, 42, 0) 62%
        );
        pointer-events: none;
      }

      .content {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 120px;
        display: flex;
      }

      .inner {
        width: 100%;
        max-width: 760px;
        display: flex;
        flex-direction: column;
        gap: 24px;
        margin-top: auto;
        margin-bottom: auto;
      }

      .hero {
        align-items: flex-start;
        justify-content: flex-start;
      }

      .hero-title {
        font-size: 72px;
        line-height: 1.05;
        letter-spacing: -0.03em;
        font-weight: 800;
        margin: 0;
        max-width: 760px;
        overflow-wrap: anywhere;
      }

      .hero-subtitle {
        font-size: 28px;
        line-height: 1.25;
        margin: 0;
        margin-top: 24px;
        color: #94a3b8;
        overflow-wrap: anywhere;
      }

      .flow {
        align-items: flex-start;
        justify-content: flex-start;
      }

      .flow-title {
        font-size: 56px;
        line-height: 1.08;
        letter-spacing: -0.02em;
        font-weight: 800;
        margin: 0;
      }

      .flow-stack {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding-left: 20px;
      }

      .flow-stack::before {
        content: "";
        position: absolute;
        top: 12px;
        bottom: 12px;
        left: 7px;
        width: 2px;
        background: rgba(148, 163, 184, 0.35);
        border-radius: 999px;
      }

      .flow-step {
        background: #1e293b;
        padding: 24px;
        border-radius: 16px;
        position: relative;
      }

      .flow-step::before {
        content: "";
        position: absolute;
        top: 28px;
        left: -20px;
        width: 14px;
        height: 14px;
        border-radius: 999px;
        background: #94a3b8;
      }

      .flow-step-text {
        font-size: 26px;
        line-height: 1.25;
        font-weight: 600;
        margin: 0;
        overflow-wrap: anywhere;
      }

      .explanation {
        align-items: flex-start;
        justify-content: flex-start;
      }

      .explanation-title {
        font-size: 56px;
        line-height: 1.08;
        letter-spacing: -0.02em;
        font-weight: 800;
        margin: 0;
        overflow-wrap: anywhere;
      }

      .points {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .point {
        display: flex;
        flex-direction: row;
        gap: 16px;
        align-items: flex-start;
      }

      .bullet {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.9);
        margin-top: 12px;
        flex: 0 0 auto;
      }

      .point-text {
        font-size: 24px;
        line-height: 1.4;
        font-weight: 500;
        color: #e2e8f0;
        overflow-wrap: anywhere;
      }

      .highlight {
        background: #22c55e;
        color: #0f172a;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 800;
        display: inline-block;
      }

      .cta {
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .cta-inner {
        max-width: 760px;
        height: 100%;
        margin-top: 0;
        margin-bottom: 0;
      }

      .cta-main {
        font-size: 64px;
        line-height: 1.08;
        letter-spacing: -0.03em;
        font-weight: 900;
        margin-top: 160px;
        overflow-wrap: anywhere;
      }

      .cta-divider {
        width: 180px;
        height: 2px;
        background: rgba(148, 163, 184, 0.35);
        border-radius: 999px;
        margin: 28px auto 0;
      }

      .cta-footer {
        margin-top: auto;
        padding-bottom: 40px;
        font-size: 18px;
        letter-spacing: 0.02em;
        color: rgba(148, 163, 184, 0.7);
      }
    </style>
  </head>
  <body>
    <div class="frame">
${body}
    </div>
  </body>
</html>`
}
