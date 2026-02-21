import type { GenerationOptions, PostOutput } from "@/types/post"

export async function generateCarousel(
  _inputText: string,
  _options: GenerationOptions
): Promise<PostOutput> {
  return { slides: [], caption: "", hashtags: [] }
}
