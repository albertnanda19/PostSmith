const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024
const MIN_GENERATION_TEXT_LENGTH = 100

export class ValidationError extends Error {
  override name = "ValidationError"
}

export function validatePdfFile(file: File): void {
  if (!file) {
    throw new ValidationError("File is required")
  }

  if (file.type !== "application/pdf") {
    throw new ValidationError("Only PDF files are allowed")
  }

  if (file.size <= 0) {
    throw new ValidationError("PDF file is empty")
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    throw new ValidationError("PDF file must not exceed 10MB")
  }
}

export function validateGenerationText(text: string): void {
  if (!text || !text.trim()) {
    throw new ValidationError("Text is required")
  }

  if (text.trim().length < MIN_GENERATION_TEXT_LENGTH) {
    throw new ValidationError("Text must be at least 100 characters")
  }
}

export function validateRenderSlideInput(
  headline: string,
  content: string,
  slideIndex: number
): void {
  if (!headline || !headline.trim()) {
    throw new ValidationError("Headline is required")
  }

  if (!content || !content.trim()) {
    throw new ValidationError("Content is required")
  }

  if (!Number.isFinite(slideIndex) || Math.trunc(slideIndex) < 1) {
    throw new ValidationError("slideIndex must be at least 1")
  }
}
