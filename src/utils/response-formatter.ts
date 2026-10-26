/**
 * Response Formatting Utilities
 *
 * Formats SDK responses for consistent MCP output. Tools are expected to shape
 * their own results (a concise, LLM-friendly object) inside their `sdkFunction`;
 * this module only handles the raw SDK shapes that need post-processing.
 */

import { ToolExecutionResult } from '../types.js';

/**
 * Formats an SDK response for consistent MCP output.
 *
 * Raw `ChatDetail` responses (returned by create/sendMessage/init/resolveTask
 * and marked with `object: 'chat'`) have their files extracted for display.
 * Everything else is treated as an already-shaped tool result and passed
 * through untouched so no data is dropped.
 *
 * @param response - Raw SDK response or shaped tool result
 * @param toolName - Name of the tool that generated the response
 * @returns Formatted response for MCP
 */
export function formatSdkResponse(response: any, toolName: string): any {
  if (!response) {
    return {
      success: false,
      error: 'No response from SDK method',
      toolName
    };
  }

  try {
    if (response.object === 'chat') {
      return formatChatDetailResponse(response, toolName);
    }

    // Tool already returned a shaped result — pass it through without dropping data.
    return { success: true, toolName, ...response };
  } catch (error) {
    return {
      success: false,
      error: `Failed to format response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      toolName,
      rawResponse: response
    };
  }
}

/**
 * Formats a raw SDK `ChatDetail` response: extracts files from
 * `latestVersion.files` and surfaces chat metadata for display.
 */
function formatChatDetailResponse(response: any, toolName: string): any {
  const files = (response.latestVersion?.files || []).map((file: any) => ({
    path: file.name,
    content: file.content,
    locked: file.locked ?? false
  }));

  const formatted: any = {
    success: true,
    toolName,
    chatId: response.id,
    previewUrl: response.webUrl,
    privacy: response.privacy,
    projectId: response.projectId
  };

  if (response.name || response.title) {
    formatted.title = response.name || response.title;
  }

  if (files.length > 0) {
    formatted.files = files;
    formatted.message = `Generated ${files.length} file(s)`;
  }

  return formatted;
}

/**
 * Formats error responses with a consistent structure.
 *
 * @param error - The error to format
 * @param toolName - Name of the tool that errored
 * @param context - Optional execution phase/context label
 * @returns Standardized error response object
 */
export function formatErrorResponse(error: any, toolName: string, context?: string): any {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return {
    success: false,
    toolName,
    error: errorMessage,
    context: context || 'tool_execution',
    timestamp: new Date().toISOString()
  };
}

/**
 * Formats an execution result into plain text for the MCP response.
 *
 * @param result - The tool execution result to format
 * @returns Human-readable text representation
 */
export function formatExecutionResult(result: ToolExecutionResult): string {
  if (result.success && result.result) {
    if (result.result.formattedContent) {
      return result.result.formattedContent;
    }

    if (result.result.message) {
      return result.result.message;
    }
  }

  if (result.success && result.formattedResult) {
    if (typeof result.formattedResult === 'string') {
      return result.formattedResult;
    }

    if (result.formattedResult.formattedContent) {
      return result.formattedResult.formattedContent;
    }

    if (result.formattedResult.message) {
      return result.formattedResult.message;
    }

    return JSON.stringify(result.formattedResult, null, 2);
  }

  if (!result.success && result.error) {
    return `Error: ${result.error}`;
  }

  return 'Operation completed successfully';
}
