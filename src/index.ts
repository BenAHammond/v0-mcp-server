import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { startServer } from './start.js';
import { logInfo, logError, logDebug } from './utils/logs.js';

// Immediately log startup
logInfo('index.ts loaded at ' + new Date().toISOString());
logDebug('Process argv:', process.argv);
logDebug('Process env V0_API_KEY exists:', !!process.env.V0_API_KEY);

// Exports
export { startServer } from './start.js';
export { SimplifiedMcpServer } from './server.js';
export * from './types.js';
export * from './utils/tool-schema.js';
export * from './utils/param-validator.js';
export * from './utils/response-formatter.js';
export { ApiKeyManager } from './auth.js';

// Auto-startup when run directly (not when imported by the CLI).
// `index.ts` is both the library entry and the direct-run entry; guard so that
// importing it from the CLI does not start a second server on stdio.
const isDirectEntry = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (isDirectEntry) {
  try {
    logDebug('Auto-startup section reached');
    logInfo('Simplified v0 MCP Server starting...');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const scriptDir = path.resolve(__dirname, '..');

    // Load .env only when V0_API_KEY is not already set (e.g. by MCP client config).
    // When Cursor/Claude Code pass V0_API_KEY in env, we do not load .env.
    if (!process.env.V0_API_KEY) {
      let envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        loadEnv({ path: envPath });
      } else {
        envPath = path.join(scriptDir, '.env');
        if (fs.existsSync(envPath)) {
          loadEnv({ path: envPath });
        }
      }
    }

    if (!process.env.V0_API_KEY) {
      logError('V0_API_KEY environment variable is required');
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
      logError('Invalid V0_API_KEY format');
      console.error('[MCP] Expected format: v1:xxxxx:xxxxx or v0_xxxxxxxxx');
      console.error('[MCP] Get your API key from: https://v0.dev/chat/settings/keys');
      process.exit(1);
    }

    logInfo('API key loaded successfully');

    startServer()
      .then((server) => {
        logInfo('✅ Simplified server initialized successfully');
        logInfo('✅ Auto-discovery completed');

        const discoveredTools = server.getDiscoveredTools();
        const toolsList = discoveredTools.length > 0 ? discoveredTools.map(t => t.toolName).join(', ') : 'none discovered, using fallback';
        logInfo(`✅ Registered ${discoveredTools.length} tools: ${toolsList}`);
        logInfo('✅ Ready for MCP protocol messages on stdio');
      })
      .catch(error => {
        logError('❌ Fatal error during startup:', error);
        logError('Stack trace:', error.stack);
        console.error('[MCP] Common issues:');
        console.error('[MCP] - Invalid API key (check if it works on v0.dev)');
        console.error('[MCP] - Network connectivity issues');
        console.error('[MCP] - v0.dev API might be down');
        console.error('[MCP] - SDK discovery failed (falling back to minimal toolset)');
        process.exit(1);
      });
  } catch (error) {
    logError('❌ Fatal error in auto-startup:', error);
    logError('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}
