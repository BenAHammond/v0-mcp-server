/**
 * Tool Alias Management
 * 
 * Minimal alias support - can be extended if needed for backward compatibility.
 * Currently returns an empty map since we have a clean, focused API.
 */

import { ToolAlias } from '../types.js';

/**
 * Creates the alias mapping (currently empty for clean API)
 */
export function createAliasMap(): Map<string, ToolAlias> {
  return new Map<string, ToolAlias>();
}

/**
 * Transforms legacy tool parameters to new format
 */
export function transformLegacyParams(toolName: string, params: any): any {
  return params;
}

/**
 * Transforms SDK response back to legacy format
 */
export function resolveLegacyResponse(toolName: string, response: any): any {
  return response;
}

/**
 * Resolves legacy tool name to new SDK tool name
 */
export function resolveLegacyToolName(toolName: string): string {
  return toolName;
}

/**
 * Checks if a tool name is a legacy alias
 */
export function isLegacyTool(toolName: string): boolean {
  return false;
}

/**
 * Gets all legacy tool names for tool listing
 */
export function getLegacyToolNames(): string[] {
  return [];
}
