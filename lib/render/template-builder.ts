import type { PostBackgroundColor, StructuredSlide } from "@/types/post"
import type { RenderPreset } from "@/types/post"
import { POST_BACKGROUND_COLORS, RENDER_PRESET_SIZES } from "@/types/post"

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function slideToThemeSeed(slide: StructuredSlide): string {
  switch (slide.type) {
    case "hero":
      return `${slide.title}|${slide.subtitle}`
    case "flow":
      return slide.steps.join("|")
    case "explanation":
      return `${slide.title}|${slide.points.join("|")}|${slide.highlight.join("|")}`
    case "paragraph":
      return `${slide.title}|${slide.text}`
    case "diagram":
      return `${slide.title}|${slide.nodes.join("|")}`
    case "cta":
      return slide.text
    default: {
      const unreachable: never = slide
      return String(unreachable)
    }
  }
}

function hashStringToInt(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return hash
}

function pickBackgroundColor(themeSeed: string): string {
  const idx = Math.abs(hashStringToInt(themeSeed)) % POST_BACKGROUND_COLORS.length
  return POST_BACKGROUND_COLORS[idx] ?? "#0f172a"
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

function renderHeroSlide(
  title: string,
  subtitle: string,
  variant: "default" | "center"
): string {
  const safeTitle = escapeHtml(title.trim())
  const safeSubtitle = escapeHtml(subtitle.trim())

  const heroClass = variant === "center" ? "hero hero-center" : "hero"

  return `
      <div class="content ${heroClass}">
        <div class="inner">
          <h1 class="hero-title">${safeTitle}</h1>
          <p class="hero-subtitle">${safeSubtitle}</p>
        </div>
      </div>`
}

function renderParagraphSlide(
  title: string,
  text: string,
  variant: "default" | "wide"
): string {
  const safeTitle = escapeHtml(title.trim())
  const safeText = escapeHtml(text.trim())

  const cls = variant === "wide" ? "paragraph paragraph-wide" : "paragraph"

  return `
      <div class="content ${cls}">
        <div class="inner">
          <h1 class="paragraph-title">${safeTitle}</h1>
          <p class="paragraph-text">${safeText}</p>
        </div>
      </div>`
}

function renderDiagramSlide(
  title: string,
  nodes: string[],
  variant: "default" | "grid"
): string {
  const safeTitle = escapeHtml(title.trim())
  const safeNodes = nodes
    .map((n) => n.trim())
    .filter((n) => n.length > 0)
    .map((n) => escapeHtml(n))

  if (safeNodes.length < 3) {
    throw new Error("Diagram slide nodes must be 3 or more")
  }

  const nodeCards = safeNodes
    .map(
      (n) => `
          <div class="diagram-node">
            <div class="diagram-node-text">${n}</div>
          </div>`
    )
    .join("")

  const cls = variant === "grid" ? "diagram-grid" : "diagram-stack"

  return `
      <div class="content diagram">
        <div class="inner">
          <h1 class="diagram-title">${safeTitle}</h1>
          <div class="${cls}">${nodeCards}</div>
        </div>
      </div>`
}

function renderFlowSlide(steps: string[], variant: "default" | "grid"): string {
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

  const stackClass = variant === "grid" ? "flow-grid" : "flow-stack"

  return `
      <div class="content flow">
        <div class="inner">
          <h1 class="flow-title">Architecture Flow</h1>
          <div class="${stackClass}">${cards}</div>
        </div>
      </div>`
}

function renderExplanationSlide(
  title: string,
  points: string[],
  highlight: string[],
  variant: "default" | "cards"
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

      if (variant === "cards") {
        return `
            <div class="point-card">
              <div class="point-card-text">${html}</div>
            </div>`
      }

      return `
            <li class="point">
              <div class="bullet"></div>
              <div class="point-text">${html}</div>
            </li>`
    })
    .join("")

  const pointsWrapper =
    variant === "cards"
      ? `<div class="points-cards">${items}
          </div>`
      : `<ul class="points">${items}
          </ul>`

  return `
      <div class="content explanation">
        <div class="inner">
          <h1 class="explanation-title">${safeTitle}</h1>
          ${pointsWrapper}
        </div>
      </div>`
}

function renderCtaSlide(text: string, variant: "default" | "minimal"): string {
  const safeText = escapeHtml(text.trim())

  const mainClass = variant === "minimal" ? "cta-main cta-main-minimal" : "cta-main"
  const divider = variant === "minimal" ? "" : '<div class="cta-divider"></div>'

  return `
      <div class="content cta">
        <div class="inner cta-inner">
          <div class="${mainClass}">${safeText}</div>
          ${divider}
          <div class="cta-footer">Albert Mangiri</div>
        </div>
      </div>`
}

export function buildSlideHtml(
  slide: StructuredSlide,
  backgroundColor?: PostBackgroundColor,
  preset: RenderPreset = "square"
): string {
  const body = (() => {
    switch (slide.type) {
      case "hero":
        return renderHeroSlide(slide.title, slide.subtitle, slide.variant ?? "default")
      case "flow":
        return renderFlowSlide(slide.steps, slide.variant ?? "default")
      case "explanation":
        return renderExplanationSlide(
          slide.title,
          slide.points,
          slide.highlight,
          slide.variant ?? "default"
        )
      case "paragraph":
        return renderParagraphSlide(slide.title, slide.text, slide.variant ?? "default")
      case "diagram":
        return renderDiagramSlide(slide.title, slide.nodes, slide.variant ?? "default")
      case "cta":
        return renderCtaSlide(slide.text, slide.variant ?? "default")
      default: {
        const unreachable: never = slide
        throw new Error(`Unknown slide type: ${JSON.stringify(unreachable)}`)
      }
    }
  })()

  const resolvedBackgroundColor =
    backgroundColor ?? (pickBackgroundColor(slideToThemeSeed(slide)) as PostBackgroundColor)

  const size = RENDER_PRESET_SIZES[preset]
  const scale = preset === "linkedin" ? 1.2 : 1

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        --bg: ${resolvedBackgroundColor};
        --scale: ${scale};
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        width: ${size.width}px;
        height: ${size.height}px;
        margin: 0;
        padding: 0;
        background: var(--bg);
      }

      body {
        font-family: Poppins, Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI",
          Roboto, Arial, sans-serif;
        color: #ffffff;
      }

      .frame {
        width: ${size.width}px;
        height: ${size.height}px;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        background: var(--bg);
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
        padding: calc(120px * var(--scale));
        display: flex;
      }

      .inner {
        width: 100%;
        max-width: calc(760px * var(--scale));
        display: flex;
        flex-direction: column;
        gap: calc(24px * var(--scale));
        margin-top: auto;
        margin-bottom: auto;
      }

      .hero {
        align-items: flex-start;
        justify-content: flex-start;
      }

      .hero-center {
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .hero-title {
        font-size: calc(72px * var(--scale));
        line-height: 1.05;
        letter-spacing: -0.03em;
        font-weight: 800;
        margin: 0;
        max-width: calc(760px * var(--scale));
        overflow-wrap: anywhere;
      }

      .hero-subtitle {
        font-size: calc(28px * var(--scale));
        line-height: 1.25;
        margin: 0;
        margin-top: calc(24px * var(--scale));
        color: #94a3b8;
        overflow-wrap: anywhere;
      }

      .flow {
        align-items: flex-start;
        justify-content: flex-start;
      }

      .flow-title {
        font-size: calc(56px * var(--scale));
        line-height: 1.08;
        letter-spacing: -0.02em;
        font-weight: 800;
        margin: 0;
      }

      .flow-stack {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: calc(20px * var(--scale));
        padding-left: calc(20px * var(--scale));
      }

      .flow-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: calc(18px * var(--scale));
      }

      .flow-stack::before {
        content: "";
        position: absolute;
        top: calc(12px * var(--scale));
        bottom: calc(12px * var(--scale));
        left: calc(7px * var(--scale));
        width: calc(2px * var(--scale));
        background: rgba(148, 163, 184, 0.35);
        border-radius: 999px;
      }

      .flow-step {
        background: #1e293b;
        padding: calc(24px * var(--scale));
        border-radius: calc(16px * var(--scale));
        position: relative;
      }

      .flow-grid .flow-step::before {
        content: none;
      }

      .flow-step::before {
        content: "";
        position: absolute;
        top: calc(28px * var(--scale));
        left: calc(-20px * var(--scale));
        width: calc(14px * var(--scale));
        height: calc(14px * var(--scale));
        border-radius: 999px;
        background: #94a3b8;
      }

      .flow-step-text {
        font-size: calc(26px * var(--scale));
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
        font-size: calc(56px * var(--scale));
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
        gap: calc(18px * var(--scale));
      }

      .points-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: calc(18px * var(--scale));
      }

      .point-card {
        background: rgba(30, 41, 59, 0.9);
        border-radius: calc(16px * var(--scale));
        padding: calc(22px * var(--scale));
        display: flex;
        align-items: flex-start;
      }

      .point-card-text {
        font-size: calc(24px * var(--scale));
        line-height: 1.35;
        font-weight: 600;
        color: #e2e8f0;
        overflow-wrap: anywhere;
      }

      .point {
        display: flex;
        flex-direction: row;
        gap: calc(16px * var(--scale));
        align-items: flex-start;
      }

      .bullet {
        width: calc(10px * var(--scale));
        height: calc(10px * var(--scale));
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.9);
        margin-top: calc(12px * var(--scale));
        flex: 0 0 auto;
      }

      .point-text {
        font-size: calc(24px * var(--scale));
        line-height: 1.4;
        font-weight: 500;
        color: #e2e8f0;
        overflow-wrap: anywhere;
      }

      .highlight {
        background: #22c55e;
        color: #0f172a;
        padding: calc(4px * var(--scale)) calc(8px * var(--scale));
        border-radius: calc(6px * var(--scale));
        font-weight: 800;
        display: inline-block;
      }

      .paragraph {
        align-items: flex-start;
        justify-content: flex-start;
      }

      .paragraph-wide .inner {
        max-width: calc(900px * var(--scale));
      }

      .paragraph-title {
        font-size: calc(56px * var(--scale));
        line-height: 1.08;
        letter-spacing: -0.02em;
        font-weight: 800;
        margin: 0;
        overflow-wrap: anywhere;
      }

      .paragraph-text {
        font-size: calc(30px * var(--scale));
        line-height: 1.5;
        font-weight: 500;
        margin: 0;
        color: #e2e8f0;
        overflow-wrap: anywhere;
      }

      .diagram {
        align-items: flex-start;
        justify-content: flex-start;
      }

      .diagram-title {
        font-size: calc(56px * var(--scale));
        line-height: 1.08;
        letter-spacing: -0.02em;
        font-weight: 800;
        margin: 0;
        overflow-wrap: anywhere;
      }

      .diagram-stack {
        display: flex;
        flex-direction: column;
        gap: calc(16px * var(--scale));
      }

      .diagram-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: calc(16px * var(--scale));
      }

      .diagram-node {
        background: rgba(30, 41, 59, 0.9);
        border-radius: calc(16px * var(--scale));
        padding: calc(22px * var(--scale));
      }

      .diagram-node-text {
        font-size: calc(26px * var(--scale));
        line-height: 1.3;
        font-weight: 700;
        color: #e2e8f0;
        overflow-wrap: anywhere;
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
        font-size: calc(64px * var(--scale));
        line-height: 1.08;
        letter-spacing: -0.03em;
        font-weight: 900;
        margin-top: calc(160px * var(--scale));
        overflow-wrap: anywhere;
      }

      .cta-main-minimal {
        font-size: calc(58px * var(--scale));
        letter-spacing: -0.02em;
        margin-top: calc(200px * var(--scale));
      }

      .cta-divider {
        width: calc(180px * var(--scale));
        height: calc(2px * var(--scale));
        background: rgba(148, 163, 184, 0.35);
        border-radius: 999px;
        margin: calc(28px * var(--scale)) auto 0;
      }

      .cta-footer {
        margin-top: auto;
        padding-bottom: calc(40px * var(--scale));
        font-size: calc(18px * var(--scale));
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
