export type ZipSlidesInput = {
  files: Array<{ name: string; data: Uint8Array }>
}

export async function zipSlides(_input: ZipSlidesInput): Promise<Uint8Array> {
  return new Uint8Array()
}
