/**
 * Core Types for the v0 MCP Server
 */

// Configuration types
export interface SimplifiedConfig {
  name?: string;
  version?: string;
  apiKey: string;
  verbose?: boolean;
  timeout?: number;
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
