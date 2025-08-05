/**
 * Response Formatting Utilities
 * 
 * Formats SDK responses for consistent MCP output and handles
 * backward compatibility response transformations.
 */

import { ToolExecutionResult } from '../types.js';

/**
 * Formats SDK response for consistent MCP output
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
    // Handle different response patterns from v0 SDK
    if (toolName.startsWith('chats_')) {
      return formatChatResponse(response, toolName);
    }
    
    if (toolName.startsWith('projects_')) {
      return formatProjectResponse(response, toolName);
    }
    
    if (toolName.startsWith('deployments_')) {
      return formatDeploymentResponse(response, toolName);
    }
    
    if (toolName.startsWith('rate_limits_')) {
      return formatRateLimitResponse(response, toolName);
    }
    
    if (toolName.startsWith('user_')) {
      return formatUserResponse(response, toolName);
    }

    // Default formatting for unknown tool types
    return formatGenericResponse(response, toolName);
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
 * Formats chat-related responses (create, sendMessage, etc.)
 */
function formatChatResponse(response: any, toolName: string): any {
  const formatted: any = {
    success: true,
    toolName
  };

  // Extract common chat fields
  if (response.id) {
    formatted.chatId = response.id;
  }
  
  if (response.webUrl) {
    formatted.previewUrl = response.webUrl;
  }
  
  if (response.apiUrl) {
    formatted.apiUrl = response.apiUrl;
  }

  // Extract files if available
  const files = extractFilesFromChatResponse(response);
  if (files.length > 0) {
    formatted.files = files.map((file: any) => ({
      path: file.name,
      content: file.content,
      locked: file.locked || false
    }));
    
    formatted.message = `Generated ${files.length} file(s)`;
    formatted.formattedContent = formatFilesForDisplay(files, response.id, response.webUrl);
  }

  // Add other useful fields
  if (response.name || response.title) {
    formatted.title = response.name || response.title;
  }
  
  if (response.createdAt) {
    formatted.createdAt = response.createdAt;
  }
  
  if (response.updatedAt) {
    formatted.updatedAt = response.updatedAt;
  }

  return formatted;
}

/**
 * Formats project-related responses
 */
function formatProjectResponse(response: any, toolName: string): any {
  const formatted: any = {
    success: true,
    toolName
  };

  if (response.id) {
    formatted.projectId = response.id;
  }
  
  if (response.name) {
    formatted.name = response.name;
  }
  
  if (response.description) {
    formatted.description = response.description;
  }
  
  if (response.webUrl) {
    formatted.webUrl = response.webUrl;
  }

  // Handle project arrays (for find operations)
  if (Array.isArray(response)) {
    return {
      success: true,
      toolName,
      projects: response.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        webUrl: project.webUrl,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      })),
      count: response.length
    };
  }

  return formatted;
}

/**
 * Formats deployment-related responses
 */
function formatDeploymentResponse(response: any, toolName: string): any {
  const formatted: any = {
    success: true,
    toolName
  };

  if (response.id) {
    formatted.deploymentId = response.id;
  }
  
  if (response.url) {
    formatted.deploymentUrl = response.url;
  }
  
  if (response.status) {
    formatted.status = response.status;
  }

  // Handle deployment arrays
  if (Array.isArray(response)) {
    return {
      success: true,
      toolName,
      deployments: response.map(deployment => ({
        id: deployment.id,
        url: deployment.url,
        status: deployment.status,
        createdAt: deployment.createdAt,
        updatedAt: deployment.updatedAt
      })),
      count: response.length
    };
  }

  // Handle logs (for findLogs)
  if (response.logs && Array.isArray(response.logs)) {
    formatted.logs = response.logs;
    formatted.logCount = response.logs.length;
  }

  return formatted;
}

/**
 * Formats rate limit responses
 */
function formatRateLimitResponse(response: any, toolName: string): any {
  return {
    success: true,
    toolName,
    rateLimits: response.rateLimits || response,
    message: 'Rate limits retrieved successfully'
  };
}

/**
 * Formats user-related responses
 */
function formatUserResponse(response: any, toolName: string): any {
  const formatted: any = {
    success: true,
    toolName
  };

  // Remove sensitive information and format safely
  if (response.id) {
    formatted.userId = response.id;
  }
  
  if (response.email) {
    // Mask email for privacy
    formatted.email = maskEmail(response.email);
  }
  
  if (response.name) {
    formatted.name = response.name;
  }

  // Handle billing info (remove sensitive data)
  if (response.billing) {
    formatted.billing = {
      plan: response.billing.plan,
      status: response.billing.status
      // Omit payment details, amounts, etc.
    };
  }

  return formatted;
}

/**
 * Formats generic responses for unknown tool types
 */
function formatGenericResponse(response: any, toolName: string): any {
  return {
    success: true,
    toolName,
    data: response,
    message: `${toolName} executed successfully`
  };
}

/**
 * Formats error responses with consistent structure
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
 * Extracts files from various chat response formats
 */
function extractFilesFromChatResponse(response: any): any[] {
  // Try different possible locations for files
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
 * Formats files for display in Claude Code
 */
function formatFilesForDisplay(files: any[], chatId?: string, previewUrl?: string): string {
  if (files.length === 0) {
    return 'No files generated';
  }

  let formatted = `Generated ${files.length} file(s)`;
  
  if (chatId) {
    formatted += ` (Chat ID: ${chatId})`;
  }
  
  formatted += '\n\n';
  
  for (const file of files) {
    const extension = getFileExtension(file.name);
    formatted += `## ${file.name}\n\n\`\`\`${extension}\n${file.content}\n\`\`\`\n\n`;
  }
  
  if (previewUrl) {
    formatted += `Preview: ${previewUrl}\n`;
  }
  
  formatted += '\nUse the Write tool to save these files to your project.';
  
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
    'html': 'html',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c'
  };
  
  return extensionMap[ext || ''] || 'text';
}

/**
 * Masks email address for privacy
 */
function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (!username || !domain) return '***@***.***';
  
  const maskedUsername = username.length > 2 
    ? username.substring(0, 2) + '*'.repeat(username.length - 2)
    : '**';
    
  return `${maskedUsername}@${domain}`;
}

/**
 * Formats execution result for MCP response text
 */
export function formatExecutionResult(result: ToolExecutionResult): string {
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