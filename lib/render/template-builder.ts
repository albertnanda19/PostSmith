function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function clampSlideIndex(slideIndex: number): number {
  if (!Number.isFinite(slideIndex)) return 1
  const idx = Math.trunc(slideIndex)
  return idx < 1 ? 1 : idx
}

export function buildSlideHtml(
  headline: string,
  content: string,
  slideIndex: number
): string {
  const safeHeadline = escapeHtml(headline.trim())
  const safeContent = escapeHtml(content.trim())
  const safeIndex = clampSlideIndex(slideIndex)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @font-face {
        font-family: "Virgil";
        src: url("fonts/virgil.ttf") format("truetype");
        font-weight: 400;
        font-style: normal;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        width: 1080px;
        height: 1080px;
        margin: 0;
        padding: 0;
        background: #ffffff;
      }

      body {
        font-family: "Virgil", ui-sans-serif, system-ui, -apple-system, "Segoe UI",
          Arial, sans-serif;
        color: #111827;
      }

      .frame {
        width: 1080px;
        height: 1080px;
        padding: 96px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 28px;
        position: relative;
        overflow: hidden;
      }

      .slide-number {
        position: absolute;
        top: 40px;
        right: 40px;
        font-size: 18px;
        color: #6b7280;
      }

      .headline {
        font-size: 64px;
        line-height: 1.08;
        letter-spacing: -0.02em;
        font-weight: 700;
        margin: 0;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      .content {
        font-size: 30px;
        line-height: 1.35;
        font-weight: 500;
        margin: 0;
        color: #1f2937;
        word-break: break-word;
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-line-clamp: 10;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div class="frame">
      <div class="slide-number">Slide ${safeIndex}</div>
      <h1 class="headline">${safeHeadline}</h1>
      <p class="content">${safeContent}</p>
    </div>
  </body>
</html>`
}
