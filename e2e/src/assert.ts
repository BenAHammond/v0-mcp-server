/**
 * Throw `message` when `cond` is false.
 *
 * @param cond the condition that must be true.
 * @param message the assertion description.
 */
export function assertTrue(cond: boolean, message: string): void {
  if (!cond) throw new Error(message);
}

/**
 * Throw `message` (with actual/expected) when `actual` is not `=== expected`.
 *
 * @param actual the value under test.
 * @param expected the value `actual` must equal.
 * @param message the assertion description.
 */
export function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  }
}

/**
 * Throw `message` when `haystack` does not contain `needle`.
 *
 * @param haystack the string to search in.
 * @param needle the substring that must be present.
 * @param message the assertion description.
 */
export function assertIncludes(haystack: string, needle: string, message: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(`${message} (missing ${JSON.stringify(needle)})`);
  }
}
