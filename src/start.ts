import { SimplifiedMcpServer } from './server.js';
import { SimplifiedConfig } from './types.js';
import { logInfo, logError } from './utils/logs.js';
import { PACKAGE_META } from './version.js';

let serverInstance: SimplifiedMcpServer | null = null;

/**
 * Builds the server config from the API key and environment, then starts the
 * MCP server over stdio. Returns the running server instance.
 *
 * @param apiKey - v0.dev API key (falls back to `V0_API_KEY`)
 * @param verbose - Enable verbose logging
 * @returns The started server instance
 */
export async function startServer(apiKey?: string, verbose: boolean = false): Promise<SimplifiedMcpServer> {
  try {
    const config: SimplifiedConfig = {
      name: PACKAGE_META.name,
      version: PACKAGE_META.version,
      apiKey: apiKey || process.env.V0_API_KEY || '',
      verbose,
      timeout: 30000
    };

    if (!config.apiKey) {
      throw new Error(
        'V0_API_KEY is required. Provide it via --api-key argument or V0_API_KEY environment variable.\n' +
        'Get your API key from: https://v0.dev/chat/settings/keys'
      );
    }

    const server = new SimplifiedMcpServer(config);
    await server.start();
    serverInstance = server;
    return server;
  } catch (error) {
    logError('Raw server initialization error:', error);
    throw new Error(`Failed to initialize MCP server: ${error instanceof Error ? error.message : String(error)}`);
  }
}

process.on('SIGINT', async () => {
  if (serverInstance && serverInstance.isRunning()) {
    logInfo('Graceful shutdown...');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (serverInstance && serverInstance.isRunning()) {
    logInfo('Graceful shutdown...');
  }
  process.exit(0);
});
