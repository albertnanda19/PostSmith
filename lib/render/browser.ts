export type BrowserHandle = {
  close: () => Promise<void>
}

export async function createBrowser(): Promise<BrowserHandle> {
  return { close: async () => {} }
}
