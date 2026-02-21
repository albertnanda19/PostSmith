const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024

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
