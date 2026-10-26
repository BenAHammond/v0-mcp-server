/**
 * Response Formatting Utilities
 *
 * Formats SDK responses for consistent MCP output. Operations are expected to
 * return a raw SDK shape; this module only handles the raw shapes that need
 * post-processing (chat details) and passes everything else through untouched.
 */

import { z } from 'zod';

/**
 * Formats an SDK response for consistent MCP output.
 *
 * Raw `ChatDetail` responses (returned by create/sendMessage/init/resolveTask
 * and marked with `object: 'chat'`) have their files extracted for display.
 * Everything else is passed through untouched so no data is dropped.
 *
 * @param response - Raw SDK response
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

    // Already a plain result — pass it through without dropping data.
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
  return {
    success: false,
    toolName,
    error: describeError(error),
    context: context || 'tool_execution',
    timestamp: new Date().toISOString()
  };
}

/**
 * Renders any thrown value as a concise, human-readable message. Zod validation
 * errors are flattened to `path: message` entries instead of the raw issue JSON.
 */
function describeError(error: any): string {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join('.') || '(input)'}: ${issue.message}`)
      .join('; ');
  }
  return error instanceof Error ? error.message : String(error);
}
