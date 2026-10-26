/** Throw `message` when `cond` is false. */
export function assertTrue(cond: boolean, message: string): void {
  if (!cond) throw new Error(message);
}

/** Throw `message` (with actual/expected) when `actual` is not `=== expected`. */
export function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  }
}

/** Throw `message` when `haystack` does not contain `needle`. */
export function assertIncludes(haystack: string, needle: string, message: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(`${message} (missing ${JSON.stringify(needle)})`);
  }
}
