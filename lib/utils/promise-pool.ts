export async function runWithConcurrencyLimit<T, R>(
  items: T[],
  limit: number,
  handler: (item: T) => Promise<R>
): Promise<R[]> {
  const safeLimit = Math.max(1, Math.trunc(limit))
  const results: R[] = new Array(items.length)

  let nextIndex = 0

  const worker = async () => {
    while (true) {
      const currentIndex = nextIndex
      if (currentIndex >= items.length) return
      nextIndex += 1

      results[currentIndex] = await handler(items[currentIndex])
    }
  }

  const workers = Array.from(
    { length: Math.min(safeLimit, items.length) },
    () => worker()
  )

  await Promise.all(workers)
  return results
}
