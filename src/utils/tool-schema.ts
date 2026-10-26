/**
 * Tool Schema Generation Utilities
 * 
 * Automatically generates MCP-compliant tool schemas from discovered SDK methods.
 * Handles parameter mapping and type conversion between SDK and MCP formats.
 */

import { DiscoveredMethod, ToolSchema, ParameterSchema, MethodParameter } from '../types.js';

/**
 * Generates MCP tool schema from discovered method
 * 
 * @param method - Discovered SDK method
 * @returns MCP-compliant tool schema
 */
export function generateMcpToolSchema(method: DiscoveredMethod): ToolSchema {
  const inputSchema = generateInputSchema(method.parameters);
  
  return {
    name: method.toolName,
    description: method.description || generateMethodDescription(method),
    inputSchema
  };
}

/**
 * Generates input schema for MCP tool from method parameters
 * 
 * @param parameters - Method parameter definitions
 * @returns MCP input schema object
 */
function generateInputSchema(parameters: MethodParameter[]) {
  const properties: Record<string, ParameterSchema> = {};
  const required: string[] = [];

  for (const param of parameters) {
    properties[param.name] = mapParameterToSchema(param);
    
    if (param.required) {
      required.push(param.name);
    }
  }

  return {
    type: 'object' as const,
    properties,
    required,
    additionalProperties: true  // Allow additional properties for auto-discovered methods
  };
}

/**
 * Maps SDK method parameter to MCP parameter schema
 * 
 * @param param - Method parameter definition
 * @returns MCP parameter schema
 */
function mapParameterToSchema(param: MethodParameter): ParameterSchema {
  const baseSchema: ParameterSchema = {
    type: mapTypeToMcpType(param.type),
    description: getEnhancedParameterDescription(param)
  };

  // Add type-specific constraints and special handling
  switch (param.type) {
    case 'string': {
      const stringSchema: ParameterSchema = {
        ...baseSchema,
        type: 'string',
        minLength: inferMinLength(param.name),
        maxLength: inferMaxLength(param.name)
      };

      // Add enum values for known enumerated parameters
      const enumValues = paramEnums[param.name];
      if (enumValues) {
        stringSchema.enum = enumValues;
      }

      return stringSchema;
    }
      
    case 'number':
      return {
        ...baseSchema,
        type: 'number',
        minimum: inferMinimumValue(param.name),
        maximum: inferMaximumValue(param.name)
      };
      
    case 'boolean':
      return {
        ...baseSchema,
        type: 'boolean'
      };
      
    case 'object':
      return {
        ...baseSchema,
        type: 'object'
      };
      
    case 'array':
      return {
        ...baseSchema,
        type: 'array'
      };
      
    default:
      return baseSchema;
  }
}

/**
 * Maps TypeScript types to MCP schema types
 * 
 * @param tsType - TypeScript type string
 * @returns MCP schema type
 */
function mapTypeToMcpType(tsType: string): 'string' | 'number' | 'boolean' | 'object' | 'array' {
  switch (tsType.toLowerCase()) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'array';
    case 'object':
    default:
      return 'object';
  }
}

/**
 * Generates human-readable description for discovered method
 * 
 * @param method - Discovered SDK method
 * @returns Method description
 */
function generateMethodDescription(method: DiscoveredMethod): string {
  const { namespace, method: methodName } = method;
  
  // Generate context-aware descriptions based on common patterns
  const descriptions: Record<string, Record<string, string>> = {
    // Focused v0 tools (no v0_ prefix)
    v0: {
      generate: 'Generate UI/code from a prompt. Use list_chats to see existing chats. Pass chatId to continue that conversation (e.g. "make buttons blue"), or omit for a new task. Returns files with path and content.',
      list_chats: 'List your v0 chats (id, name, updatedAt, webUrl). Use to pick which chatId to pass to generate, or omit chatId to start new.',
      get_chat: 'Get chat details including generated files. Returns chat info and all files from the latest version.',
      delete_chat: 'Delete a chat. Irreversible.',
      rate_limits: 'Check API rate limits and quotas.',
      deploy: 'Deploy a chat to get a live URL. Optionally specify versionId, defaults to latest.'
    },
    // Legacy SDK namespaces (for backward compat if needed)
    chats: {
      create: 'Create a new chat conversation for component generation.',
      find: 'List chats.',
      getById: 'Retrieve a chat by ID with files.',
      sendMessage: 'Send a message to an existing chat.',
      delete: 'Delete a chat.',
      favorite: 'Mark or unmark a chat as favorite',
      fork: 'Create a copy of an existing chat.',
      update: 'Update chat properties'
    },
    projects: {
      create: 'Create a new project.',
      find: 'List projects.',
      getById: 'Retrieve a project by ID',
      update: 'Update project properties',
      assign: 'Assign a chat to a project',
      getByChatId: 'Get project for a chat'
    },
    deployments: {
      create: 'Deploy a chat version',
      find: 'List deployments',
      getById: 'Get deployment details',
      delete: 'Delete a deployment',
      findLogs: 'Get deployment logs',
      findErrors: 'Get deployment errors'
    },
    hooks: {
      create: 'Create a webhook',
      find: 'List webhooks',
      getById: 'Get webhook by ID',
      update: 'Update webhook',
      delete: 'Delete webhook'
    },
    rateLimits: {
      find: 'Check API rate limits'
    },
    user: {
      get: 'Get current user info',
      getBilling: 'Get billing info',
      getPlan: 'Get subscription plan',
      getScopes: 'List API scopes'
    }
  };

  // Try to find a specific description
  const namespaceDescriptions = descriptions[namespace];
  if (namespaceDescriptions && namespaceDescriptions[methodName]) {
    return namespaceDescriptions[methodName];
  }

  // Generate generic description based on method name patterns
  return generateGenericDescription(namespace, methodName);
}

/**
 * Generates generic description when specific ones aren't available
 * 
 * @param namespace - SDK namespace
 * @param methodName - Method name
 * @returns Generic method description
 */
function generateGenericDescription(namespace: string, methodName: string): string {
  const namespaceLabel = formatNamespaceLabel(namespace);
  
  // Common method name patterns
  if (methodName.startsWith('create')) {
    return `Create a new ${namespaceLabel.slice(0, -1)}`; // Remove 's' for singular
  }
  if (methodName.startsWith('find') || methodName.startsWith('list')) {
    return `Find and list ${namespaceLabel}`;
  }
  if (methodName.startsWith('get')) {
    return `Retrieve ${namespaceLabel.slice(0, -1)} information`;
  }
  if (methodName.startsWith('update')) {
    return `Update ${namespaceLabel.slice(0, -1)} properties`;
  }
  if (methodName.startsWith('delete')) {
    return `Delete a ${namespaceLabel.slice(0, -1)}`;
  }
  
  return `Execute ${methodName} operation on ${namespaceLabel}`;
}

/**
 * Formats namespace name for user display
 * 
 * @param namespace - Raw namespace string
 * @returns Formatted namespace label
 */
function formatNamespaceLabel(namespace: string): string {
  // Convert camelCase to space-separated words
  const formatted = namespace
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .trim();
    
  return formatted;
}

/**
 * Maps SDK parameters to MCP format with proper transformations
 * 
 * @param sdkParams - Original SDK parameters
 * @param method - Discovered method for context
 * @returns MCP-compatible parameters
 */
export function mapSdkParamsToMcp(sdkParams: any, method: DiscoveredMethod): any {
  if (!sdkParams || typeof sdkParams !== 'object') {
    return sdkParams;
  }

  // Handle common parameter transformations
  const mcpParams = { ...sdkParams };

  // Transform specific parameter patterns based on method context
  if (method.namespace === 'chats') {
    // For chat methods, ensure message content is properly formatted
    if (mcpParams.message && typeof mcpParams.message === 'string') {
      mcpParams.message = mcpParams.message.trim();
    }
  }

  if (method.namespace === 'projects') {
    // For project methods, ensure proper ID format
    if (mcpParams.projectId && typeof mcpParams.projectId === 'string') {
      mcpParams.projectId = mcpParams.projectId.trim();
    }
  }

  return mcpParams;
}

/**
 * Infers parameter type constraints based on parameter name
 */

/**
 * Known enumerated string parameters and their allowed values. Keyed by the
 * parameter name so schema generation can attach `enum` constraints without
 * runtime SDK introspection.
 */
const paramEnums: Record<string, string[]> = {
  chatPrivacy: ['public', 'private', 'team', 'team-edit', 'unlisted'],
  privacy: ['public', 'private', 'team', 'team-edit', 'unlisted'],
  projectPrivacy: ['private', 'team'],
  modelId: ['v0-auto', 'v0-mini', 'v0-pro', 'v0-max', 'v0-max-fast'],
  type: ['files', 'repo', 'registry', 'zip', 'template'],
  taskType: ['confirmed-steps', 'plan-exit-response', 'answered-questions', 'confirmed-permissions', 'vercel-connect-setup'],
  status: ['approved', 'rejected', 'request-changes'],
  responseMode: ['sync', 'async', 'experimental_stream']
};

const paramLengthConstraints: Record<string, { min?: number; max?: number }> = {
  id: { min: 1 },
  chatId: { min: 1 },
  projectId: { min: 1 },
  deploymentId: { min: 1 },
  hookId: { min: 1 },
  message: { min: 1, max: 50000 },
  description: { min: 10, max: 10000 },
  name: { min: 1, max: 100 },
  title: { min: 1, max: 200 },
  url: { max: 2000 }
};

function inferMinLength(paramName: string): number | undefined {
  return paramLengthConstraints[paramName]?.min;
}

function inferMaxLength(paramName: string): number | undefined {
  return paramLengthConstraints[paramName]?.max;
}

function inferMinimumValue(paramName: string): number | undefined {
  if (paramName.includes('count') || paramName.includes('limit')) {
    return 1;
  }
  if (paramName.includes('page')) {
    return 1;
  }
  return undefined;
}

function inferMaximumValue(paramName: string): number | undefined {
  if (paramName.includes('limit')) {
    return 100;
  }
  if (paramName.includes('page')) {
    return 1000;
  }
  return undefined;
}

/**
 * Infers parameter types from method context and parameter names
 * 
 * @param method - Discovered method
 * @param paramName - Parameter name
 * @returns Inferred parameter type with constraints
 */
export function inferParameterTypes(method: DiscoveredMethod): MethodParameter[] {
  // This would be enhanced with actual TypeScript AST parsing
  // For now, return the parameters as discovered
  return method.parameters.map(param => ({
    ...param,
    // Add any method-specific type refinements
    type: refineParameterType(param, method)
  }));
}

/**
 * Refines parameter type based on method context
 * 
 * @param param - Original parameter
 * @param method - Method context
 * @returns Refined parameter type
 */
function refineParameterType(param: MethodParameter, method: DiscoveredMethod): string {
  // Refine types based on common patterns
  if (param.name.endsWith('Id')) {
    return 'string';
  }
  
  if (param.name === 'message' || param.name === 'description' || param.name === 'changes') {
    return 'string';
  }
  
  if (param.name.includes('count') || param.name.includes('limit') || param.name.includes('page')) {
    return 'number';
  }
  
  if (param.name.includes('enable') || param.name.includes('is') || param.name.includes('has')) {
    return 'boolean';
  }
  
  return param.type;
}

/**
 * Gets enhanced parameter description based on parameter name and context
 * 
 * @param param - Method parameter
 * @returns Enhanced description
 */
function getEnhancedParameterDescription(param: MethodParameter): string {
  // Enhanced descriptions based on documentation
  const enhancedDescriptions: Record<string, string> = {
    message: 'The user\'s prompt describing the desired UI. Primary signal for generation.',
    system: 'System-level instructions defining the AI\'s persona and constraints. Powerful tool for wrapper customization to enforce technical requirements.',
    projectId: 'The ID of the project to associate this chat with. Crucial for maintaining organizational hygiene - keeps related generations together.',
    chatPrivacy: 'Visibility setting for the chat. Options: public, private, team, unlisted. Enterprise wrappers should default to private/team for compliance.',
    privacy: 'Privacy setting. Options: public, private, team, unlisted. Defaults may vary by API version - always set explicitly.',
    modelConfiguration: 'Technical configuration for the generation engine. Object with thinking (boolean) and imageGenerations (boolean) properties.',
    thinking: 'Enable Chain of Thought (CoT) reasoning. Increases latency but significantly improves handling of complex logic. Expose as "High Quality / Slower" toggle.',
    imageGenerations: 'Control whether the model acts as a multimodal agent. If true, generates image assets (via DALL-E). If false, uses placeholders.',
    attachments: 'Multimodal inputs such as images or design specs. Array of attachment objects.',
    chatId: 'The identifier of the active conversation thread. Sufficient for platform to retrieve full context.',
    versionId: 'The specific version to branch from. Enables non-linear workflows - "undo" or try different direction from previous steps.',
    name: 'Human-readable name for the resource',
    description: 'Optional metadata describing the resource\'s purpose',
    scope: 'Context to check rate limits (e.g., global or per-project)',
    deploymentId: 'The ID of the deployment to inspect',
  };

  if (enhancedDescriptions[param.name]) {
    return enhancedDescriptions[param.name];
  }

  return param.description || `${param.name} parameter`;
}