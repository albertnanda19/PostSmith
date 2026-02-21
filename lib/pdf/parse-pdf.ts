export type ParsePdfResult = {
  text: string
}

export async function parsePdf(_input: ArrayBuffer): Promise<ParsePdfResult> {
  return { text: "" }
}
