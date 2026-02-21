export type GeminiClientConfig = {
  apiKey: string
}

export function createGeminiClient(_config: GeminiClientConfig) {
  return {
    generateText: async (_prompt: string) => "",
  }
}
