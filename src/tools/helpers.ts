/**
 * Shared helpers for v0 tool builders.
 *
 * Tool `sdkFunction`s receive flat, LLM-friendly parameters and are responsible
 * for (a) assembling the nested payload the SDK expects and (b) shaping the
 * response into a concise object. These helpers remove the boilerplate.
 */

/**
 * Removes `undefined` values so they are not forwarded to the SDK.
 *
 * @param obj - The object to strip `undefined` values from
 * @returns A partial view of `obj` containing only the defined entries
 */
export function compact<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

/**
 * Builds the SDK `modelConfiguration` object from flattened params
 * (`modelId`, `thinking`, `imageGenerations`). Returns `undefined` when no model
 * configuration fields were provided.
 *
 * @param params - The flattened model configuration fields
 * @returns The nested `modelConfiguration` object, or `undefined` when no field was provided
 */
export function buildModelConfiguration(params: {
  modelId?: string;
  thinking?: boolean;
  imageGenerations?: boolean;
}): Record<string, any> | undefined {
  const { modelId, thinking, imageGenerations } = params;
  if (modelId === undefined && thinking === undefined && imageGenerations === undefined) {
    return undefined;
  }
  return compact({ modelId, imageGenerations, thinking });
}

/**
 * Requires a trimmed, non-empty string, throwing a helpful error otherwise.
 *
 * @param value - The value to coerce to a string
 * @param fieldName - The parameter name, used in the thrown error
 * @returns The trimmed, non-empty string
 */
export function requireString(value: any, fieldName: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) throw new Error(`${fieldName} is required`);
  return trimmed;
}
