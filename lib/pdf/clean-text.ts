function removeControlCharacters(input: string): string {
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
}

function normalizeLineBreaks(input: string): string {
  return input.replace(/\r\n?/g, "\n")
}

function collapseExcessBlankLines(input: string): string {
  return input.replace(/\n{3,}/g, "\n\n")
}

function collapseSpaces(input: string): string {
  return input.replace(/[ \t]{2,}/g, " ")
}

function normalizeParagraphs(input: string): string {
  const paragraphs = input
    .split("\n\n")
    .map((p) => p.replace(/\n+/g, " "))

  return paragraphs.join("\n\n")
}

export function cleanExtractedText(rawText: string): string {
  const cleaned = collapseSpaces(
    normalizeParagraphs(
      collapseExcessBlankLines(normalizeLineBreaks(removeControlCharacters(rawText)))
    )
  )

  return cleaned.trim()
}
