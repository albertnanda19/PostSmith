export type ValidationResult = {
  valid: boolean
  error?: string
}

export function ok(): ValidationResult {
  return { valid: true }
}

export function fail(error: string): ValidationResult {
  return { valid: false, error }
}
