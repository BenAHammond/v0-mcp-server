/**
 * Shared helpers for v0 tool invocation.
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
