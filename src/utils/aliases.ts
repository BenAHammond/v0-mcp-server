/**
 * Tool Alias Management
 * 
 * Provides backward compatibility by mapping legacy tool names to new SDK-based tools.
 * Handles parameter and response transformations to maintain identical behavior.
 */

import { ToolAlias } from '../types.js';

/**
 * Creates the complete alias mapping for backward compatibility
 * 
 * @returns Map of legacy tool names to their new SDK equivalents
 */
export function createAliasMap(): Map<string, ToolAlias> {
  const aliases = new Map<string, ToolAlias>();

  // generate_component -> chats_create
  aliases.set('generate_component', {
    legacyName: 'generate_component',
    newName: 'chats_create',
    transformParams: transformGenerateComponentParams,
    transformResponse: transformGenerateComponentResponse
  });

  // iterate_component -> chats_sendMessage  
  aliases.set('iterate_component', {
    legacyName: 'iterate_component',
    newName: 'chats_send_message',
    transformParams: transformIterateComponentParams,
    transformResponse: transformIterateComponentResponse
  });

  // get_rate_limits -> rateLimits_find
  aliases.set('get_rate_limits', {
    legacyName: 'get_rate_limits',
    newName: 'rate_limits_find',
    transformParams: transformRateLimitsParams,
    transformResponse: transformRateLimitsResponse
  });

  return aliases;
}

/**
 * Transforms generate_component parameters to chats_create format
 * 
 * Legacy format:
 * {
 *   description: string,
 *   options?: { framework?: string, typescript?: boolean, styling?: string }
 * }
 * 
 * SDK format:
 * { message: string }
 */
function transformGenerateComponentParams(params: any): any {
  if (!params || typeof params !== 'object') {
    throw new Error('Invalid generate_component parameters');
  }

  const { description, options } = params;

  if (!description || typeof description !== 'string') {
    throw new Error('generate_component requires a description parameter');
  }

  // Build the message by combining description with options
  let message = description.trim();

  if (options) {
    // Add framework specification (React is default)
    if (options.framework && options.framework !== 'react') {
      message += `\n\nFramework: ${options.framework}`;
    }

    // Add TypeScript specification
    if (options.typescript === false) {
      message += '\n\nUse JavaScript (no TypeScript)';
    } else {
      message += '\n\nUse TypeScript';
    }

    // Add styling preferences
    if (options.styling) {
      switch (options.styling) {
        case 'tailwind':
          message += '\n\nUse Tailwind CSS for styling';
          break;
        case 'styled-components':
          message += '\n\nUse styled-components for styling';
          break;
        case 'css':
          message += '\n\nUse plain CSS for styling';
          break;
      }
    }
  } else {
    // Default options
    message += '\n\nUse TypeScript';
    message += '\n\nUse Tailwind CSS for styling';
  }

  return { message };
}

/**
 * Transforms chats_create response back to generate_component format
 * 
 * SDK response format (from v0 chats.create):
 * {
 *   id: string,
 *   webUrl: string,
 *   latestVersion?: { files: Array<{name: string, content: string}> }
 * }
 * 
 * Legacy response format:
 * {
 *   success: boolean,
 *   chatId: string,
 *   previewUrl?: string,
 *   files: Array<{path: string, content: string}>,
 *   message?: string,
 *   formattedContent?: string
 * }
 */
function transformGenerateComponentResponse(response: any): any {
  if (!response) {
    return {
      success: false,
      chatId: '',
      previewUrl: '',
      files: [],
      error: 'No response from v0.dev API'
    };
  }

  try {
    const chatId = response.id || '';
    const previewUrl = response.webUrl || `https://v0.dev/chat/${chatId}`;
    const files = extractFilesFromResponse(response);

    return {
      success: true,
      chatId,
      previewUrl,
      files: files.map(file => ({
        path: file.name,
        content: file.content
      })),
      message: files.length > 0 
        ? `Successfully generated ${files.length} file(s). Use the Write tool to save these files to your project.`
        : 'Component generated successfully. Check the preview URL for details.',
      formattedContent: formatFilesForClaudeCode(files, chatId, previewUrl)
    };
  } catch (error) {
    return {
      success: false,
      chatId: response.id || '',
      previewUrl: response.webUrl || '',
      files: [],
      error: `Failed to process generate_component response: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Transforms iterate_component parameters to chats_sendMessage format
 * 
 * Legacy format:
 * {
 *   chatId: string,
 *   changes: string,
 *   preserveContext?: boolean
 * }
 * 
 * SDK format:
 * {
 *   chatId: string,
 *   message: string
 * }
 */
function transformIterateComponentParams(params: any): any {
  if (!params || typeof params !== 'object') {
    throw new Error('Invalid iterate_component parameters');
  }

  const { chatId, changes } = params;

  if (!chatId || typeof chatId !== 'string') {
    throw new Error('iterate_component requires a chatId parameter');
  }

  if (!changes || typeof changes !== 'string') {
    throw new Error('iterate_component requires a changes parameter');
  }

  return {
    chatId: chatId.trim(),
    message: changes.trim()
  };
}

/**
 * Transforms chats_sendMessage response back to iterate_component format
 */
function transformIterateComponentResponse(response: any): any {
  if (!response) {
    return {
      success: false,
      chatId: '',
      previewUrl: '',
      files: [],
      error: 'No response from v0.dev API'
    };
  }

  try {
    // The response structure should be similar to generate_component
    // since both use the chat API
    return transformGenerateComponentResponse(response);
  } catch (error) {
    return {
      success: false,
      chatId: response.chatId || '',
      previewUrl: '',
      files: [],
      error: `Failed to process iterate_component response: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Transforms get_rate_limits parameters (usually empty) to rateLimits_find format
 */
function transformRateLimitsParams(params: any): any {
  // rate_limits_find typically accepts an optional scope parameter
  // get_rate_limits doesn't have parameters, so we pass empty or default scope
  return params || {};
}

/**
 * Transforms rateLimits_find response to get_rate_limits format
 * 
 * SDK response format:
 * {
 *   rateLimits: Array<{
 *     resource: string,
 *     limit: number,
 *     remaining: number,
 *     resetTime: string
 *   }>
 * }
 * 
 * Legacy response format:
 * {
 *   success: boolean,
 *   rateLimits: Array<{
 *     resource: string,
 *     limit: number,
 *     remaining: number,
 *     resetTime: string
 *   }>
 * }
 */
function transformRateLimitsResponse(response: any): any {
  if (!response) {
    return {
      success: false,
      rateLimits: [],
      error: 'No rate limit data available'
    };
  }

  try {
    return {
      success: true,
      rateLimits: response.rateLimits || [],
      message: 'Rate limits retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      rateLimits: [],
      error: `Failed to process rate limits: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Transforms legacy tool parameters to new SDK format
 * 
 * @param toolName - Legacy tool name
 * @param params - Legacy parameters
 * @returns Transformed parameters for SDK method
 */
export function transformLegacyParams(toolName: string, params: any): any {
  const aliases = createAliasMap();
  const alias = aliases.get(toolName);

  if (!alias || !alias.transformParams) {
    // No transformation needed
    return params;
  }

  return alias.transformParams(params);
}

/**
 * Transforms SDK response back to legacy format
 * 
 * @param toolName - Legacy tool name
 * @param response - SDK response
 * @returns Transformed response in legacy format
 */
export function resolveLegacyResponse(toolName: string, response: any): any {
  const aliases = createAliasMap();
  const alias = aliases.get(toolName);

  if (!alias || !alias.transformResponse) {
    // No transformation needed
    return response;
  }

  return alias.transformResponse(response);
}

/**
 * Resolves legacy tool name to new SDK tool name
 * 
 * @param toolName - Tool name (legacy or new)
 * @returns Resolved SDK tool name
 */
export function resolveLegacyToolName(toolName: string): string {
  const aliases = createAliasMap();
  const alias = aliases.get(toolName);

  return alias ? alias.newName : toolName;
}

/**
 * Checks if a tool name is a legacy alias
 * 
 * @param toolName - Tool name to check
 * @returns True if toolName is a legacy alias
 */
export function isLegacyTool(toolName: string): boolean {
  const aliases = createAliasMap();
  return aliases.has(toolName);
}

/**
 * Gets all legacy tool names for tool listing
 * 
 * @returns Array of legacy tool names
 */
export function getLegacyToolNames(): string[] {
  const aliases = createAliasMap();
  return Array.from(aliases.keys());
}

// Helper functions

/**
 * Extracts files from v0 API response
 */
function extractFilesFromResponse(response: any): Array<{name: string, content: string}> {
  // Check various possible locations for files in the response
  if (response.latestVersion && response.latestVersion.files) {
    return response.latestVersion.files;
  }
  
  if (response.files) {
    return response.files;
  }
  
  if (response.version && response.version.files) {
    return response.version.files;
  }
  
  return [];
}

/**
 * Formats files for Claude Code display
 */
function formatFilesForClaudeCode(files: Array<{name: string, content: string}>, chatId: string, previewUrl: string): string {
  if (files.length === 0) {
    return `No files generated. Preview available at: ${previewUrl}`;
  }

  let formatted = `Generated ${files.length} file(s) from v0.dev (Chat ID: ${chatId})\n\n`;
  
  for (const file of files) {
    formatted += `## ${file.name}\n\n\`\`\`${getFileExtension(file.name)}\n${file.content}\n\`\`\`\n\n`;
  }
  
  formatted += `Preview: ${previewUrl}\n`;
  formatted += `\nUse the Write tool to save these files to your project.`;
  
  return formatted;
}

/**
 * Gets file extension for syntax highlighting
 */
function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const extensionMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'md': 'markdown',
    'html': 'html'
  };
  
  return extensionMap[ext || ''] || 'text';
}