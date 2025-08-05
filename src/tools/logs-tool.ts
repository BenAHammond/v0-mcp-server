import { DiscoveredMethod } from '../types.js';
import { logManager } from '../utils/logs.js';

export function createLogsTools(): DiscoveredMethod[] {
  return [
    {
      namespace: 'logs',
      method: 'get',
      toolName: 'logs_get',
      sdkFunction: async (params: { limit?: number; level?: string; search?: string }) => {
        const { limit = 100, level, search } = params;
        
        if (search) {
          return {
            logs: logManager.searchLogs(search, limit),
            summary: logManager.getLogSummary()
          };
        }
        
        if (level && ['info', 'error', 'debug', 'warn'].includes(level)) {
          return {
            logs: logManager.getLogsByLevel(level as any, limit),
            summary: logManager.getLogSummary()
          };
        }
        
        return {
          logs: logManager.getRecentLogs(limit),
          summary: logManager.getLogSummary()
        };
      },
      parameters: [
        {
          name: 'limit',
          type: 'number',
          required: false,
          description: 'Maximum number of logs to return (default: 100)'
        },
        {
          name: 'level',
          type: 'string',
          required: false,
          description: 'Filter by log level (info, error, debug, warn)'
        },
        {
          name: 'search',
          type: 'string',
          required: false,
          description: 'Search logs by message content'
        }
      ],
      returnType: 'object',
      fullPath: 'logs.get'
    },
    {
      namespace: 'logs',
      method: 'readDebugFile',
      toolName: 'logs_read_debug_file',
      sdkFunction: async (params: { lines?: number }) => {
        const { lines = 100 } = params;
        const fileLines = await logManager.readDebugFile(lines);
        
        return {
          debugFile: '/tmp/v0-mcp-debug.log',
          lines: fileLines,
          totalLines: fileLines.length
        };
      },
      parameters: [
        {
          name: 'lines',
          type: 'number',
          required: false,
          description: 'Number of lines to read from the end of the file (default: 100)'
        }
      ],
      returnType: 'object',
      fullPath: 'logs.readDebugFile'
    },
    {
      namespace: 'logs',
      method: 'summary',
      toolName: 'logs_summary',
      sdkFunction: async () => {
        const summary = logManager.getLogSummary();
        const envInfo = {
          apiKeyPresent: !!process.env.V0_API_KEY,
          apiKeyLength: process.env.V0_API_KEY?.length || 0,
          verbose: process.env.VERBOSE === 'true',
          nodeVersion: process.version,
          platform: process.platform,
          cwd: process.cwd()
        };
        
        return {
          ...summary,
          environment: envInfo,
          timestamp: new Date().toISOString()
        };
      },
      parameters: [],
      returnType: 'object',
      fullPath: 'logs.summary'
    },
    {
      namespace: 'logs',
      method: 'clear',
      toolName: 'logs_clear',
      sdkFunction: async () => {
        logManager.clearLogs();
        return {
          success: true,
          message: 'In-memory logs cleared'
        };
      },
      parameters: [],
      returnType: 'object',
      fullPath: 'logs.clear'
    }
  ];
}