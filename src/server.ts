
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createClient as createV0Client } from 'v0-sdk';

import { 
  SimplifiedConfig, 
  DiscoveredMethod, 
  ToolMapping, 
  ToolExecutionContext, 
  ToolExecutionResult 
} from './types.js';
import { introspectSdkClient } from './utils/sdk-discovery.js';
import { generateMcpToolSchema } from './utils/tool-schema.js';
import { 
  createAliasMap, 
  transformLegacyParams, 
  resolveLegacyResponse, 
  resolveLegacyToolName,
  isLegacyTool,
  getLegacyToolNames
} from './utils/aliases.js';
import { validateToolParameters } from './utils/param-validator.js';
import { formatSdkResponse, formatErrorResponse, formatExecutionResult } from './utils/response-formatter.js';

import { ConfigManager, DEFAULT_CONFIG } from './config.js';
import { ApiKeyManager } from './auth.js';

export class SimplifiedMcpServer {
  private server: Server;
  private config: SimplifiedConfig;
  private v0Client: any;
  private toolMapping: ToolMapping;
  private isStarted = false;

  constructor(config?: Partial<SimplifiedConfig>) {
    this.config = this.createSimplifiedConfig(config);
    
    this.server = new Server(
      {
        name: this.config.name || 'v0-mcp-server',
        version: this.config.version || '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.toolMapping = {
      discoveredTools: new Map(),
      aliases: createAliasMap(),
      schemas: new Map()
    };
  }

  async start(): Promise<void> {
    if (this.isStarted) {
      throw new Error('Server is already started');
    }

    try {
      console.error('[MCP] Starting simplified v0 MCP server...');
      console.error('[MCP] Config:', { 
        hasApiKey: !!this.config.apiKey,
        apiKeyLength: this.config.apiKey?.length,
        verbose: this.config.verbose,
        name: this.config.name,
        version: this.config.version 
      });
      
      await this.createV0Client();
      console.error('[MCP] v0 SDK client created');

      await this.discoverAndRegisterTools();
      console.error(`[MCP] Discovered and registered ${this.toolMapping.discoveredTools.size} tools`);

      this.registerRequestHandlers();
      console.error('[MCP] Request handlers registered');

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('[MCP] Server started with stdio transport');

      this.isStarted = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[MCP] Failed to start server:', errorMessage);
      throw error;
    }
  }

  private createSimplifiedConfig(config?: Partial<SimplifiedConfig>): SimplifiedConfig {
    const configManager = new ConfigManager(config as any);
    const fullConfig = configManager.getConfig();

    return {
      apiKey: fullConfig.apiKey,
      verbose: fullConfig.verbose || false,
      timeout: fullConfig.timeout || 30000,
      name: fullConfig.name || 'v0-mcp-server',
      version: fullConfig.version || '1.0.0'
    };
  }

  private async createV0Client(): Promise<void> {
    try {
      console.error('[MCP] Validating API key...');
      new ApiKeyManager(this.config.apiKey);
      console.error('[MCP] API key validated');

      console.error('[MCP] Creating v0 client...');
      this.v0Client = createV0Client({ 
        apiKey: this.config.apiKey
      });
      console.error('[MCP] v0 client created successfully');

      if (this.config.verbose) {
        console.error('[MCP] v0 client initialized with API key');
      }
    } catch (error) {
      console.error('[MCP] Error creating v0 client:', error);
      throw new Error(`Failed to create v0 client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async discoverAndRegisterTools(): Promise<void> {
    try {
      const discoveryResult = introspectSdkClient(this.v0Client);
      
      if (this.config.verbose) {
        console.error(`[MCP] Found ${discoveryResult.methods.length} methods`);
        
        if (discoveryResult.errors.length > 0) {
          console.error('[MCP] Discovery errors:', discoveryResult.errors);
        }
      }

      for (const method of discoveryResult.methods) {
        try {
          this.registerDiscoveredTool(method);
        } catch (error) {
          console.error(`[MCP] Failed to register tool ${method.toolName}:`, error);
        }
      }

      if (this.config.verbose) {
        const toolNames = Array.from(this.toolMapping.discoveredTools.keys());
        const legacyNames = getLegacyToolNames();
        console.error(`[MCP] Registered tools: ${toolNames.join(', ')}`);
        console.error(`[MCP] Legacy aliases: ${legacyNames.join(', ')}`);
      }
    } catch (error) {
      console.error('[MCP] SDK discovery failed, falling back to minimal toolset:', error);
      this.registerMinimalToolset();
    }
  }

  private registerDiscoveredTool(method: DiscoveredMethod): void {
    const schema = generateMcpToolSchema(method);
    
    this.toolMapping.discoveredTools.set(method.toolName, method);
    this.toolMapping.schemas.set(method.toolName, schema);

    if (this.config.verbose) {
      console.error(`[MCP] Registered tool: ${method.toolName} (${method.fullPath})`);
    }
  }

  /**
   * Registers minimal toolset as fallback when SDK discovery fails
   */
  private registerMinimalToolset(): void {
    console.error('[MCP] Registering minimal fallback toolset...');
    
    // Create manual tool definitions for core functionality
    const coreTools = this.createCoreToolDefinitions();
    
    for (const tool of coreTools) {
      try {
        this.toolMapping.discoveredTools.set(tool.toolName, tool);
        this.toolMapping.schemas.set(tool.toolName, generateMcpToolSchema(tool));
        console.error(`[MCP] Registered fallback tool: ${tool.toolName}`);
      } catch (error) {
        console.error(`[MCP] Failed to register fallback tool ${tool.toolName}:`, error);
      }
    }
    
    console.error(`[MCP] Fallback toolset registered with ${coreTools.length} tools`);
  }

  /**
   * Creates core tool definitions when SDK discovery fails
   */
  private createCoreToolDefinitions(): DiscoveredMethod[] {
    const coreTools: DiscoveredMethod[] = [];
    
    // Create manual tool definition for chats.create (most important)
    try {
      if (this.v0Client?.chats?.create) {
        coreTools.push({
          namespace: 'chats',
          method: 'create',
          toolName: 'chats_create',
          sdkFunction: this.v0Client.chats.create.bind(this.v0Client.chats),
          parameters: [
            {
              name: 'message',
              type: 'string',
              required: true,
              description: 'Message describing the component to generate'
            }
          ],
          returnType: 'object',
          fullPath: 'chats.create'
        });
      }
    } catch (error) {
      console.error('[MCP] Failed to create chats_create fallback:', error);
    }

    // Create manual tool definition for chats.sendMessage if available
    try {
      if (this.v0Client?.chats?.sendMessage) {
        coreTools.push({
          namespace: 'chats',
          method: 'sendMessage',
          toolName: 'chats_sendMessage',
          sdkFunction: this.v0Client.chats.sendMessage.bind(this.v0Client.chats),
          parameters: [
            {
              name: 'chatId',
              type: 'string',
              required: true,
              description: 'The chat ID to send message to'
            },
            {
              name: 'message',
              type: 'string',
              required: true,
              description: 'The message content to send'
            }
          ],
          returnType: 'object',
          fullPath: 'chats.sendMessage'
        });
      }
    } catch (error) {
      console.error('[MCP] Failed to create chats_sendMessage fallback:', error);
    }

    // Create rate limits tool if available
    try {
      if (this.v0Client?.rateLimits?.get) {
        coreTools.push({
          namespace: 'rateLimits',
          method: 'get',
          toolName: 'rate_limits_get',
          sdkFunction: this.v0Client.rateLimits.get.bind(this.v0Client.rateLimits),
          parameters: [],
          returnType: 'object',
          fullPath: 'rateLimits.get'
        });
      }
    } catch (error) {
      console.error('[MCP] Failed to create rate_limits_get fallback:', error);
    }

    return coreTools;
  }

  /**
   * Registers MCP request handlers
   */
  private registerRequestHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: any[] = [];

      // Add discovered tools
      for (const [toolName, schema] of this.toolMapping.schemas) {
        tools.push({
          name: schema.name,
          description: schema.description,
          inputSchema: schema.inputSchema
        });
      }

      // Add legacy aliases with their transformed schemas
      for (const legacyName of getLegacyToolNames()) {
        const newName = resolveLegacyToolName(legacyName);
        const originalSchema = this.toolMapping.schemas.get(newName);
        
        if (originalSchema) {
          // Create legacy schema based on original but with legacy name and description
          tools.push({
            name: legacyName,
            description: this.getLegacyToolDescription(legacyName),
            inputSchema: this.getLegacyToolInputSchema(legacyName)
          });
        }
      }

      if (this.config.verbose) {
        console.error(`[MCP] Listed ${tools.length} tools`);
      }

      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name: toolName, arguments: args } = request.params;
      
      try {
        const result = await this.handleToolCall(toolName, args || {});
        
        return {
          content: [
            {
              type: 'text',
              text: this.formatToolResponse(result)
            }
          ]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[MCP] Tool call failed for ${toolName}:`, errorMessage);
        
        return {
          content: [
            {
              type: 'text', 
              text: `Error: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    });
  }

  /**
   * Handles tool call execution with direct SDK dispatch
   */
  async handleToolCall(toolName: string, params: any): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const requestId = `tool-${Date.now()}`;

    try {
      // Check if this is a legacy tool that needs aliasing
      if (isLegacyTool(toolName)) {
        return await this.handleLegacyToolCall(toolName, params, startTime, requestId);
      }

      // Handle direct SDK tool call
      const method = this.toolMapping.discoveredTools.get(toolName);
      if (!method) {
        const availableTools = Array.from(this.toolMapping.discoveredTools.keys());
        const legacyTools = getLegacyToolNames();
        const allTools = [...availableTools, ...legacyTools];
        throw new Error(
          `Tool '${toolName}' not found. Available tools: ${allTools.join(', ')}\n` +
          `If this tool should exist, there may be an SDK discovery issue.`
        );
      }

      // Check if the SDK function is still available (gracefully handle SDK changes)
      if (!method.sdkFunction || typeof method.sdkFunction !== 'function') {
        throw new Error(
          `Tool '${toolName}' is registered but the underlying SDK method is not available. ` +
          `This may indicate an SDK version mismatch or the method was removed.`
        );
      }

      // Validate parameters using schema
      const schema = this.toolMapping.schemas.get(toolName);
      if (schema) {
        const validation = validateToolParameters(toolName, params, schema);
        if (validation._tag === 'Left') {
          throw new Error(`Parameter validation failed: ${validation.left.message}`);
        }
        params = validation.right; // Use validated/transformed parameters
      }

      // Execute SDK method with proper parameter handling
      let sdkResult;
      
      // Handle parameter unwrapping for different method types
      if (method.parameters.length === 0) {
        // No parameters expected
        sdkResult = await method.sdkFunction();
      } else if (method.parameters.length === 1 && method.parameters[0].name === 'params') {
        // Method expects a single 'params' object - pass it directly  
        sdkResult = await method.sdkFunction(params.params || params);
      } else if (Object.keys(params).length === 1 && 'params' in params) {
        // If we wrapped parameters in a 'params' object, unwrap them
        sdkResult = await method.sdkFunction(params.params);
      } else {
        // Pass parameters directly
        sdkResult = await method.sdkFunction(params);
      }
      const duration = Date.now() - startTime;

      // Format the response using our formatter
      const formattedResult = formatSdkResponse(sdkResult, toolName);

      if (this.config.verbose) {
        console.error(`[MCP] Tool ${toolName} executed in ${duration}ms`);
      }

      return {
        success: true,
        result: sdkResult,
        formattedResult,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`[MCP] Tool execution failed for ${toolName}:`, errorMessage);
      
      // Format error response consistently
      const formattedError = formatErrorResponse(error, toolName, 'tool_execution');
      
      return {
        success: false,
        error: errorMessage,
        errorCode: 'TOOL_EXECUTION_ERROR',
        formattedResult: formattedError,
        duration
      };
    }
  }

  /**
   * Handles legacy tool calls with parameter/response transformation
   */
  private async handleLegacyToolCall(
    legacyToolName: string, 
    legacyParams: any, 
    startTime: number, 
    requestId: string
  ): Promise<ToolExecutionResult> {
    try {
      // Transform legacy parameters to new format
      const newToolName = resolveLegacyToolName(legacyToolName);
      const transformedParams = transformLegacyParams(legacyToolName, legacyParams);

      if (this.config.verbose) {
        console.error(`[MCP] Legacy tool ${legacyToolName} -> ${newToolName}`);
      }

      // Find the actual SDK method
      const method = this.toolMapping.discoveredTools.get(newToolName);
      if (!method) {
        throw new Error(
          `Underlying tool '${newToolName}' not found for legacy tool '${legacyToolName}'. ` +
          `This may indicate an SDK discovery issue or the method is no longer available.`
        );
      }

      // Check if the SDK function is still available
      if (!method.sdkFunction || typeof method.sdkFunction !== 'function') {
        throw new Error(
          `Legacy tool '${legacyToolName}' -> '${newToolName}' is registered but the underlying SDK method is not available. ` +
          `This may indicate an SDK version mismatch.`
        );
      }

      // Execute the SDK method
      const sdkResult = await method.sdkFunction(transformedParams);
      
      // Transform response back to legacy format
      const legacyResult = resolveLegacyResponse(legacyToolName, sdkResult);
      
      // Apply additional formatting for consistency
      const formattedResult = formatSdkResponse(legacyResult, legacyToolName);
      const duration = Date.now() - startTime;

      if (this.config.verbose) {
        console.error(`[MCP] Legacy tool ${legacyToolName} completed in ${duration}ms`);
      }

      return {
        success: true,
        result: legacyResult,
        formattedResult,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Format error response consistently
      const formattedError = formatErrorResponse(error, legacyToolName, 'legacy_tool_execution');
      
      return {
        success: false,
        error: errorMessage,
        errorCode: 'LEGACY_TOOL_ERROR',
        formattedResult: formattedError,
        duration
      };
    }
  }

  /**
   * Formats tool execution result for MCP response
   */
  private formatToolResponse(result: ToolExecutionResult): string {
    return formatExecutionResult(result);
  }

  /**
   * Gets description for legacy tools
   */
  private getLegacyToolDescription(legacyName: string): string {
    const descriptions: Record<string, string> = {
      'generate_component': 'Generate React components from text descriptions using v0.dev. Returns an array of files with path and content.',
      'iterate_component': 'Iterate on existing components by sending changes to v0.dev chat. Returns updated files with path and content.',
      'get_rate_limits': 'Get current v0.dev API rate limits and usage information.'
    };
    
    return descriptions[legacyName] || `Legacy alias for ${resolveLegacyToolName(legacyName)}`;
  }

  /**
   * Gets input schema for legacy tools
   */
  private getLegacyToolInputSchema(legacyName: string): any {
    const schemas: Record<string, any> = {
      'generate_component': {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Description of the component to generate',
            minLength: 1,
            maxLength: 5000
          },
          options: {
            type: 'object',
            description: 'Optional configuration for component generation',
            properties: {
              framework: {
                type: 'string',
                enum: ['react', 'vue', 'svelte'],
                description: 'Target framework for component generation',
                default: 'react'
              },
              typescript: {
                type: 'boolean', 
                description: 'Whether to use TypeScript',
                default: true
              },
              styling: {
                type: 'string',
                enum: ['css', 'tailwind', 'styled-components'],
                description: 'Styling approach for the component',
                default: 'tailwind'
              }
            },
            additionalProperties: false
          }
        },
        required: ['description'],
        additionalProperties: false
      },
      'iterate_component': {
        type: 'object',
        properties: {
          chatId: {
            type: 'string',
            description: 'The v0.dev chat ID from a previous component generation',
            minLength: 1,
            maxLength: 100
          },
          changes: {
            type: 'string',
            description: 'Description of the changes to make to the component',
            minLength: 1,
            maxLength: 2000
          }
        },
        required: ['chatId', 'changes'],
        additionalProperties: false
      },
      'get_rate_limits': {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    };
    
    return schemas[legacyName] || { type: 'object', properties: {}, additionalProperties: false };
  }

  /**
   * Checks if the server is running
   */
  isRunning(): boolean {
    return this.isStarted;
  }

  /**
   * Gets server configuration
   */
  getConfig(): SimplifiedConfig {
    return { ...this.config };
  }

  /**
   * Gets discovered tools information
   */
  getDiscoveredTools(): DiscoveredMethod[] {
    return Array.from(this.toolMapping.discoveredTools.values());
  }
}