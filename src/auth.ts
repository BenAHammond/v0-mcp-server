/**
 * API Key Management for v0 MCP Server
 * 
 * Handles v0.dev API key validation, format checking, and secure storage
 * following security requirements SR-1 and user story US-3.
 */

import { SETUP_URL } from './types.js';

export interface McpError {
  code: string;
  message: string;
  data?: any;
}

/**
 * Manages v0.dev API key validation and secure handling
 */
export class ApiKeyManager {
  private readonly apiKey: string;

  /**
   * Creates a new ApiKeyManager instance
   * @param apiKey - API key from CLI argument or environment variable
   */
  constructor(apiKey?: string) {
    // Try CLI argument first, then environment variable
    this.apiKey = apiKey || process.env.V0_API_KEY || '';
    this.validate();
  }

  /**
   * Validates the API key format and availability
   * @throws {Error} If API key is missing or invalid format
   */
  private validate(): void {
    if (!this.apiKey) {
      throw new Error(
        `V0_API_KEY is required. Get your API key from: ${SETUP_URL}\n\n` +
        'Usage:\n' +
        '  npx v0-mcp-server --api-key YOUR_KEY\n' +
        '  # OR set environment variable:\n' +
        '  export V0_API_KEY=YOUR_KEY && npx v0-mcp-server'
      );
    }

    if (!this.isValidFormat(this.apiKey)) {
      const validation = ApiKeyManager.validateKeyFormat(this.apiKey);
      throw new Error(
        `${validation.error}\n` +
        `Get a valid key from: ${SETUP_URL}`
      );
    }
  }

  /**
   * Validates API key format without exposing the actual key
   * @param key - API key to validate
   * @returns true if format appears valid
   */
  private isValidFormat(key: string): boolean {
    const validation = ApiKeyManager.validateKeyFormat(key);
    return validation.valid;
  }

  /**
   * Returns the API key for use in v0.dev API calls
   * @returns The validated API key
   */
  getKey(): string {
    return this.apiKey;
  }

  /**
   * Returns a redacted version for logging/debugging
   * Never exposes the actual API key value
   * @returns Redacted key representation
   */
  toString(): string {
    return '[REDACTED]';
  }

  /**
   * Creates a safe representation for JSON serialization
   * Ensures API key is never accidentally logged or serialized
   * @returns Safe object without sensitive data
   */
  toJSON(): object {
    return {
      hasKey: Boolean(this.apiKey),
      keyLength: this.apiKey.length,
      keyPrefix: this.apiKey.startsWith('v1:') ? 'v1:' : 
                 this.apiKey.startsWith('v0_') ? 'v0_' : '[INVALID]'
    };
  }

  /**
   * Validates API key format statically without creating an instance
   * @param key - API key to validate
   * @returns Result indicating validation success or error
   */
  static validateKeyFormat(key: string): { valid: boolean; error?: string } {
    if (!key) {
      return {
        valid: false,
        error: `API key is required. Get your key from: ${SETUP_URL}`
      };
    }

    // v0.dev API keys start with 'v1:' (current format) or 'v0_' (legacy format)
    if (!key.startsWith('v1:') && !key.startsWith('v0_')) {
      return {
        valid: false,
        error: `Invalid API key format. Expected key starting with 'v1:' or 'v0_'.`
      };
    }

    if (key.length < 20) {
      return {
        valid: false,
        error: 'API key appears too short. Please check your key.'
      };
    }

    if (key.length > 200) {
      return {
        valid: false,
        error: 'API key appears too long. Please check your key.'
      };
    }

    // Validate format based on API key type
    if (key.startsWith('v1:')) {
      // v1: format: v1:base64:base64
      if (!/^v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/.test(key)) {
        return {
          valid: false,
          error: 'Invalid v1 API key format. Expected format: v1:xxxxx:xxxxx'
        };
      }
    } else if (key.startsWith('v0_')) {
      // Legacy v0_ format
      if (!/^v0_[A-Za-z0-9_-]+$/.test(key)) {
        return {
          valid: false,
          error: 'Invalid v0 API key format. Only letters, numbers, underscores and hyphens are allowed.'
        };
      }
    }

    return { valid: true };
  }

  /**
   * Creates an MCP-formatted error for API key issues
   * @param message - Error message
   * @returns Standardized MCP error
   */
  static createApiKeyError(message: string): McpError {
    return {
      code: 'INVALID_API_KEY',
      message,
      data: {
        setupUrl: SETUP_URL,
        required: true
      }
    };
  }
}

/**
 * Utility function to safely check if an API key is available
 * @param apiKey - Optional API key
 * @returns true if a valid-looking API key is available
 */
export function hasValidApiKey(apiKey?: string): boolean {
  const key = apiKey || process.env.V0_API_KEY;
  if (!key) return false;
  
  const validation = ApiKeyManager.validateKeyFormat(key);
  return validation.valid;
}

/**
 * Utility function to get setup instructions for API key
 * @returns User-friendly setup instructions
 */
export function getApiKeySetupInstructions(): string {
  return (
    `API Key Setup Instructions:\n\n` +
    `1. Visit: ${SETUP_URL}\n` +
    `2. Sign in to your v0.dev account\n` +
    `3. Generate a new API key\n` +
    `4. Use it with this server:\n` +
    `   npx v0-mcp-server --api-key YOUR_KEY\n\n` +
    `Or set as environment variable:\n` +
    `   export V0_API_KEY=YOUR_KEY\n` +
    `   npx v0-mcp-server`
  );
}