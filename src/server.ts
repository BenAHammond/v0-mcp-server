import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createClient as createV0Client } from 'v0-sdk';

import { SimplifiedConfig } from './types.js';
import { formatSdkResponse, formatErrorResponse } from './utils/response-formatter.js';
import { logInfo, logError, logDebug } from './utils/logs.js';
import { createV0Tools, McpTool } from './tools/v0-tools.js';
import { ConfigManager } from './config.js';
import { ApiKeyManager } from './auth.js';
import { PACKAGE_META } from './version.js';

/**
 * MCP server that bridges Claude with the v0.dev SDK. Registers three tools —
 * `generate`, `request`, `search` — dispatches tool calls to the SDK client,
 * and communicates over stdio.
 */
export class SimplifiedMcpServer {
  private server: Server;
  private config: SimplifiedConfig;
  private v0Client: any;
  private tools: Map<string, McpTool>;
  private isStarted = false;

  /**
   * @param config - Partial configuration; defaults are filled in by `ConfigManager`
   */
  constructor(config?: Partial<SimplifiedConfig>) {
    this.config = this.createSimplifiedConfig(config);

    this.server = new Server(
      {
        name: this.config.name || PACKAGE_META.name,
        version: this.config.version || PACKAGE_META.version
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.tools = new Map();
  }

  /**
   * Validates the API key, creates the v0 client, registers tools and request
   * handlers, then connects to the stdio transport. Idempotent guard: throws
   * if the server is already started.
   *
   * @returns A promise that resolves once the server is connected
   */
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

      this.registerTools();
      logInfo(`Registered ${this.tools.size} tools`);

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
      name: fullConfig.name || PACKAGE_META.name,
      version: fullConfig.version || PACKAGE_META.version
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

  private registerTools(): void {
    for (const tool of createV0Tools()) {
      this.tools.set(tool.name, tool);
      logDebug(`Registered: ${tool.name}`);
    }
  }

  private registerRequestHandlers(): void {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.tools.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }));

      if (this.config.verbose) {
        console.error(`[MCP] Listed ${tools.length} tools`);
      }

      return { tools };
    });

    // Handle tool calls. `executeToolCall` catches every tool-level error and
    // returns a `{ success: false, ... }` result (it never throws), so a failed
    // call is surfaced to the client as an MCP `isError` response.
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name: toolName, arguments: args } = request.params;
      logInfo(`Tool call: ${toolName}`, args);

      const result = await this.executeToolCall(toolName, args || {});
      logDebug(`Tool ${toolName} result`, result);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }],
        isError: result.success === false
      };
    });
  }

  /**
   * Look up a tool by name, invoke it against the SDK client, and format the
   * result. Zod schemas live on each tool, so validation happens inside
   * `execute`; any thrown error is caught here and returned as a failure.
   *
   * @param toolName - Registered tool name
   * @param params - Raw tool arguments
   * @returns A `{ success, ... }` result object
   */
  async executeToolCall(toolName: string, params: any): Promise<Record<string, any>> {
    const startTime = Date.now();

    try {
      const tool = this.tools.get(toolName);
      if (!tool) {
        const available = Array.from(this.tools.keys());
        throw new Error(`Tool '${toolName}' not found. Available: ${available.join(', ')}`);
      }

      // Strip undefined values before dispatch so optional params stay clean.
      const cleanParams = Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined)
      );

      const result = await tool.execute(this.v0Client, cleanParams);

      if (this.config.verbose) {
        console.error(`[MCP] ${toolName} completed in ${Date.now() - startTime}ms`);
      }

      return formatSdkResponse(result, toolName);
    } catch (error) {
      return formatErrorResponse(error, toolName, 'tool_execution');
    }
  }

  /**
   * Whether the server has been started and is listening over stdio.
   */
  isRunning(): boolean {
    return this.isStarted;
  }

  /**
   * Returns a shallow copy of the active server configuration.
   */
  getConfig(): SimplifiedConfig {
    return { ...this.config };
  }

  /**
   * Returns the registered tool names in registration order.
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}
