import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SimplifiedMcpServer } from './server.js';
import { SimplifiedConfig } from './types.js';

// Immediately log startup
console.error('[MCP] index.ts loaded at', new Date().toISOString());
console.error('[MCP] Process argv:', process.argv);
console.error('[MCP] Process env V0_API_KEY exists:', !!process.env.V0_API_KEY);

export async function startServer(apiKey?: string, verbose: boolean = false): Promise<SimplifiedMcpServer> {
  try {
    const packageInfo = await getPackageInfo();
    
    const config: SimplifiedConfig = {
      name: 'v0-mcp-server',
      version: packageInfo.version || '1.0.0',
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
    console.error('🐛 Raw server initialization error:', error);
    throw new Error(`Failed to initialize MCP server: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function getPackageInfo(): Promise<{ version?: string; name?: string }> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const url = await import('url');
    
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
    const packagePath = path.join(__dirname, '..', 'package.json');
    
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      return {
        version: packageJson.version,
        name: packageJson.name
      };
    }
  } catch (error) {
    // Fallback to defaults
  }
  
  return {
    version: '1.0.0',
    name: 'v0-mcp-server'
  };
}

let serverInstance: SimplifiedMcpServer | null = null;

process.on('SIGINT', async () => {
  if (serverInstance && serverInstance.isRunning()) {
    console.error('[MCP] Graceful shutdown...');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (serverInstance && serverInstance.isRunning()) {
    console.error('[MCP] Graceful shutdown...');
  }
  process.exit(0);
});

// Exports
export { SimplifiedMcpServer } from './server.js';
export * from './types.js';
export * from './utils/sdk-discovery.js';
export * from './utils/tool-schema.js';
export * from './utils/aliases.js';
export * from './utils/param-validator.js';
export * from './utils/response-formatter.js';
export { ApiKeyManager } from './auth.js';

// Auto-startup when run directly
try {
  console.error('[MCP] Auto-startup section reached');
  console.error('[MCP] Simplified v0 MCP Server starting...');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const scriptDir = path.resolve(__dirname, '..');

  let envPath = path.join(process.cwd(), '.env');
  let envLoaded = false;

  if (fs.existsSync(envPath)) {
    console.error(`[MCP] Loading environment from: ${envPath}`);
    loadEnv({ path: envPath });
    envLoaded = true;
  } else {
    envPath = path.join(scriptDir, '.env');
    if (fs.existsSync(envPath)) {
      console.error(`[MCP] Loading environment from: ${envPath}`);
      loadEnv({ path: envPath });
      envLoaded = true;
    }
  }

  if (!envLoaded) {
    console.error('[MCP] No .env file found in current directory or project root');
  }

  if (!process.env.V0_API_KEY) {
    console.error('[MCP] ERROR: V0_API_KEY environment variable is required');
    console.error('[MCP] Please set it in one of these ways:');
    console.error('[MCP] 1. Create a .env file with: V0_API_KEY=your_key_here');
    console.error('[MCP] 2. Set environment variable: export V0_API_KEY=your_key_here');
    console.error('[MCP] 3. Pass via MCP config: -e V0_API_KEY=your_key_here');
    console.error('[MCP] Get your API key from: https://v0.dev/chat/settings/keys');
    process.exit(1);
  }

  const apiKeyFormats = [
    /^v1:[a-zA-Z0-9+/=]+:[a-zA-Z0-9+/=]+$/,
    /^v0_[a-zA-Z0-9_-]+$/
  ];
  const isValidFormat = apiKeyFormats.some(format => format.test(process.env.V0_API_KEY!));
  if (!isValidFormat) {
    console.error('[MCP] ERROR: Invalid V0_API_KEY format');
    console.error('[MCP] Expected format: v1:xxxxx:xxxxx or v0_xxxxxxxxx');
    console.error('[MCP] Get your API key from: https://v0.dev/chat/settings/keys');
    process.exit(1);
  }

  console.error('[MCP] API key loaded successfully');

  startServer()
    .then((server) => {
      console.error('[MCP] ✅ Simplified server initialized successfully');
      console.error('[MCP] ✅ Auto-discovery completed');
      
      const discoveredTools = server.getDiscoveredTools();
      const toolsList = discoveredTools.length > 0 ? discoveredTools.map(t => t.toolName).join(', ') : 'none discovered, using fallback';
      console.error(`[MCP] ✅ Registered ${discoveredTools.length} tools: ${toolsList}`);
      console.error('[MCP] ✅ Ready for MCP protocol messages on stdio');
    })
    .catch(error => {
      console.error('[MCP] ❌ Fatal error during startup:', error);
      console.error('[MCP] Stack trace:', error.stack);
      console.error('[MCP] Common issues:');
      console.error('[MCP] - Invalid API key (check if it works on v0.dev)');
      console.error('[MCP] - Network connectivity issues');
      console.error('[MCP] - v0.dev API might be down');
      console.error('[MCP] - SDK discovery failed (falling back to minimal toolset)');
      process.exit(1);
    });
} catch (error) {
  console.error('[MCP] ❌ Fatal error in auto-startup:', error);
  console.error('[MCP] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
  process.exit(1);
}