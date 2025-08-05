/**
 * Core Types for Simplified v0 MCP Server
 */

// Configuration types
export interface SimplifiedConfig {
  name?: string;
  version?: string;
  apiKey: string;
  verbose?: boolean;
  timeout?: number;
}

// Either monad for functional error handling
export type Either<L, R> = 
  | { _tag: 'Left'; left: L }
  | { _tag: 'Right'; right: R };

// v0 SDK namespaces that can be discovered
export enum SdkNamespace {
  CHATS = 'chats',
  PROJECTS = 'projects', 
  DEPLOYMENTS = 'deployments',
  HOOKS = 'hooks',
  INTEGRATIONS = 'integrations',
  RATE_LIMITS = 'rateLimits',
  USER = 'user'
}

// Discovered method from SDK introspection
export interface DiscoveredMethod {
  namespace: string;
  method: string;
  toolName: string;
  sdkFunction: Function;
  parameters: MethodParameter[];
  returnType: string;
  fullPath: string;
}

// Method parameter definition
export interface MethodParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: any;
}

// Tool mapping for auto-discovery
export interface ToolMapping {
  discoveredTools: Map<string, DiscoveredMethod>;
  aliases: Map<string, ToolAlias>;
  schemas: Map<string, ToolSchema>;
}

// Tool schema for MCP registration
export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, ParameterSchema>;
    required: string[];
    additionalProperties: boolean;
  };
}

// Parameter schema for MCP tool input
export interface ParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  enum?: string[];
  default?: any;
}

// Tool execution context
export interface ToolExecutionContext {
  toolName: string;
  parameters: any;
  timestamp: Date;
}

// Tool execution result
export interface ToolExecutionResult {
  success: boolean;
  result?: any;
  formattedResult?: any;
  error?: string;
  errorCode?: string;
  duration: number;
}

// Tool alias for backward compatibility
export interface ToolAlias {
  legacyName: string;
  newName: string;
  transformParams: (params: any) => any;
  transformResponse: (response: any) => any;
}

// Discovery result from SDK introspection
export interface DiscoveryResult {
  methods: DiscoveredMethod[];
  totalDiscovered: number;
  namespaces: string[];
  errors: string[];
}

// V0 client configuration
export interface V0ClientConfig {
  apiKey: string;
}

// Constants
export const SETUP_URL = 'https://v0.dev/chat/settings/keys';

export const PERFORMANCE_LIMITS = {
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_CHANGES_LENGTH: 2000,
  MAX_CHAT_ID_LENGTH: 100,
  REQUEST_TIMEOUT: 30000,
  MAX_CONCURRENT_REQUESTS: 5
};