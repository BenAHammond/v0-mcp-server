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
    description: generateMethodDescription(method),
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
    description: param.description || `${param.name} parameter`
  };

  // Add type-specific constraints
  switch (param.type) {
    case 'string':
      return {
        ...baseSchema,
        type: 'string',
        minLength: inferMinLength(param.name),
        maxLength: inferMaxLength(param.name)
      };
      
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
    chats: {
      create: 'Create a new chat conversation for component generation',
      find: 'Search and list existing chat conversations',
      getById: 'Retrieve a specific chat conversation by ID',
      sendMessage: 'Send a message to an existing chat conversation',
      delete: 'Delete a chat conversation',
      favorite: 'Mark or unmark a chat as favorite',
      fork: 'Create a copy of an existing chat conversation',
      update: 'Update chat conversation properties'
    },
    projects: {
      create: 'Create a new project for organizing components',
      find: 'Search and list existing projects',
      getById: 'Retrieve a specific project by ID',
      update: 'Update project properties and settings',
      assign: 'Assign a chat conversation to a project'
    },
    deployments: {
      create: 'Deploy a component or project to hosting',
      find: 'List existing deployments',
      getById: 'Retrieve deployment details by ID',
      delete: 'Delete a deployment',
      findLogs: 'Retrieve deployment logs for debugging',
      findErrors: 'Retrieve deployment errors and failures'
    },
    hooks: {
      create: 'Create a webhook for event notifications',
      find: 'List configured webhooks',
      getById: 'Retrieve webhook configuration by ID',
      update: 'Update webhook settings and URL',
      delete: 'Delete a webhook configuration'
    },
    rateLimits: {
      find: 'Check current API rate limit status and quotas'
    },
    user: {
      get: 'Retrieve current user profile information',
      getBilling: 'Get user billing information and usage',
      getPlan: 'Retrieve current subscription plan details',
      getScopes: 'List available API scopes and permissions'
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

function inferMinLength(paramName: string): number | undefined {
  const lengthConstraints: Record<string, number> = {
    id: 1,
    chatId: 1,
    projectId: 1,
    deploymentId: 1,
    hookId: 1,
    message: 1,
    description: 10,
    name: 1,
    title: 1
  };
  
  return lengthConstraints[paramName];
}

function inferMaxLength(paramName: string): number | undefined {
  const lengthConstraints: Record<string, number> = {
    message: 50000,
    description: 10000,
    name: 100,
    title: 200,
    url: 2000
  };
  
  return lengthConstraints[paramName];
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