import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createClient as createV0Client } from 'v0-sdk';

import { 
  SimplifiedConfig, 
  DiscoveredMethod, 
  ToolMapping, 
  ToolExecutionResult 
} from './types.js';
import { generateMcpToolSchema } from './utils/tool-schema.js';
import { validateToolParameters } from './utils/param-validator.js';
import { formatSdkResponse, formatErrorResponse, formatExecutionResult } from './utils/response-formatter.js';
import { logInfo, logError, logDebug } from './utils/logs.js';
import { createLogsTools } from './tools/logs-tool.js';
import { createV0Tools } from './tools/v0-tools.js';
import { ConfigManager } from './config.js';
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
      aliases: new Map(),
      schemas: new Map()
    };
  }

  async start(): Promise<void> {
    if (this.isStarted) {
      throw new Error('Server is already started');
    }

    try {
      logInfo('Starting v0 MCP server...');
      logDebug('Config:', { 
        hasApiKey: !!this.config.apiKey,
        apiKeyLength: this.config.apiKey?.length,
        verbose: this.config.verbose,
        name: this.config.name,
        version: this.config.version 
      });
      
      await this.createV0Client();
      logInfo('v0 SDK client created');

      await this.registerTools();
      logInfo(`Registered ${this.toolMapping.discoveredTools.size} tools`);

      this.registerRequestHandlers();
      logInfo('Request handlers registered');

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logInfo('Server started with stdio transport');

      this.isStarted = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Failed to start server:', errorMessage);
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
      logInfo('Validating API key...');
      new ApiKeyManager(this.config.apiKey);
      logInfo('API key validated');

      logInfo('Creating v0 client...');
      this.v0Client = createV0Client({ 
        apiKey: this.config.apiKey
      });
      logInfo('v0 client created successfully');
    } catch (error) {
      logError('Error creating v0 client:', error);
      throw new Error(`Failed to create v0 client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async registerTools(): Promise<void> {
    // Register the 6 focused v0 tools
    const v0Tools = createV0Tools(this.v0Client);
    
    for (const tool of v0Tools) {
      this.registerTool(tool);
      logDebug(`Registered: ${tool.toolName}`);
    }

    // Add debug logging tools
    const logsTools = createLogsTools();
    for (const tool of logsTools) {
      this.registerTool(tool);
      logDebug(`Registered: ${tool.toolName}`);
    }

    if (this.config.verbose) {
      const toolNames = Array.from(this.toolMapping.discoveredTools.keys());
      logDebug(`Available tools: ${toolNames.join(', ')}`);
    }
  }

  private registerTool(method: DiscoveredMethod): void {
    const schema = generateMcpToolSchema(method);
    this.toolMapping.discoveredTools.set(method.toolName, method);
    this.toolMapping.schemas.set(method.toolName, schema);

    if (this.config.verbose) {
      console.error(`[MCP] Registered: ${method.toolName}`);
    }
  }

  private registerRequestHandlers(): void {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.toolMapping.schemas.values()).map(schema => ({
        name: schema.name,
        description: schema.description,
        inputSchema: schema.inputSchema
      }));

      if (this.config.verbose) {
        console.error(`[MCP] Listed ${tools.length} tools`);
      }

      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name: toolName, arguments: args } = request.params;
      logInfo(`Tool call: ${toolName}`, args);
      
      try {
        const result = await this.executeToolCall(toolName, args || {});
        
        logDebug(`Tool ${toolName} result`, result);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[MCP] Tool ${toolName} failed:`, errorMessage);
        
        return {
          content: [{
            type: 'text', 
            text: `Error: ${errorMessage}`
          }],
          isError: true
        };
      }
    });
  }

  async executeToolCall(toolName: string, params: any): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      const method = this.toolMapping.discoveredTools.get(toolName);
      if (!method) {
        const availableTools = Array.from(this.toolMapping.discoveredTools.keys());
        throw new Error(
          `Tool '${toolName}' not found. Available: ${availableTools.join(', ')}`
        );
      }

      if (!method.sdkFunction || typeof method.sdkFunction !== 'function') {
        throw new Error(`Tool '${toolName}' has no executable function`);
      }

      // Validate parameters
      const schema = this.toolMapping.schemas.get(toolName);
      if (schema) {
        const validation = validateToolParameters(toolName, params, schema);
        if (validation._tag === 'Left') {
          throw new Error(`Invalid parameters: ${validation.left.message}`);
        }
        params = validation.right;
      }

      // Clean undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined)
      );
      
      // Execute
      let sdkResult;
      if (method.parameters.length === 0) {
        sdkResult = await method.sdkFunction();
      } else {
        sdkResult = await method.sdkFunction(cleanParams);
      }

      const duration = Date.now() - startTime;
      const formattedResult = formatSdkResponse(sdkResult, toolName);

      if (this.config.verbose) {
        console.error(`[MCP] ${toolName} completed in ${duration}ms`);
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
      
      return {
        success: false,
        error: errorMessage,
        errorCode: 'TOOL_ERROR',
        formattedResult: formatErrorResponse(error, toolName, 'tool_execution'),
        duration
      };
    }
  }

  isRunning(): boolean {
    return this.isStarted;
  }

  getConfig(): SimplifiedConfig {
    return { ...this.config };
  }

  getDiscoveredTools(): DiscoveredMethod[] {
    return Array.from(this.toolMapping.discoveredTools.values());
  }
}
