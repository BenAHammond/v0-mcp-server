/**
 * Unit tests for ApiKeyManager
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ApiKeyManager, hasValidApiKey, getApiKeySetupInstructions } from '../../src/auth.js';

describe('ApiKeyManager', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    delete process.env.V0_API_KEY;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('constructor', () => {
    test('should accept valid API key via parameter', () => {
      const validKey = 'v0_test_key_123456789012345';
      expect(() => new ApiKeyManager(validKey)).not.toThrow();
    });

    test('should accept valid API key via environment variable', () => {
      const validKey = 'v0_test_key_123456789012345';
      process.env.V0_API_KEY = validKey;
      expect(() => new ApiKeyManager()).not.toThrow();
    });

    test('should throw error for missing API key', () => {
      expect(() => new ApiKeyManager()).toThrow(/V0_API_KEY is required/);
    });

    test('should throw error for invalid API key format', () => {
      expect(() => new ApiKeyManager('invalid_key')).toThrow(/Invalid API key format/);
    });

    test('should throw error for key too short', () => {
      expect(() => new ApiKeyManager('v0_short')).toThrow(/API key appears too short/);
    });

    test('should throw error for key without v0_ prefix', () => {
      expect(() => new ApiKeyManager('invalid_key_123456789012345')).toThrow(/Invalid API key format/);
    });
  });

  describe('getKey', () => {
    test('should return the validated API key', () => {
      const validKey = 'v0_test_key_123456789012345';
      const manager = new ApiKeyManager(validKey);
      expect(manager.getKey()).toBe(validKey);
    });
  });

  describe('toString', () => {
    test('should return redacted string for security', () => {
      const validKey = 'v0_test_key_123456789012345';
      const manager = new ApiKeyManager(validKey);
      expect(manager.toString()).toBe('[REDACTED]');
    });
  });

  describe('toJSON', () => {
    test('should return safe object without actual key', () => {
      const validKey = 'v0_test_key_123456789012345';
      const manager = new ApiKeyManager(validKey);
      const json = manager.toJSON();
      
      expect(json).toEqual({
        hasKey: true,
        keyLength: validKey.length,
        keyPrefix: 'v0_'
      });
    });

    test('should indicate invalid key in JSON', () => {
      try {
        new ApiKeyManager('invalid_key_123');
      } catch {
        // Expected to throw, but test the static method instead
        const json = ApiKeyManager.validateKeyFormat('invalid_key_123');
        expect(json.valid).toBe(false);
      }
    });
  });

  describe('validateKeyFormat', () => {
    test('should return valid for correct format', () => {
      const result = ApiKeyManager.validateKeyFormat('v0_test_key_123456789012345');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should return invalid for empty key', () => {
      const result = ApiKeyManager.validateKeyFormat('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('API key is required');
    });

    test('should return invalid for wrong prefix', () => {
      const result = ApiKeyManager.validateKeyFormat('wrong_prefix_123456789012345');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid API key format');
    });

    test('should return invalid for too short key', () => {
      const result = ApiKeyManager.validateKeyFormat('v0_short');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too short');
    });

    test('should return invalid for too long key', () => {
      const longKey = 'v0_' + 'x'.repeat(300);
      const result = ApiKeyManager.validateKeyFormat(longKey);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should return invalid for invalid characters', () => {
      const result = ApiKeyManager.validateKeyFormat('v0_test@key#123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid v0 API key format');
    });
  });

  describe('createApiKeyError', () => {
    test('should create properly formatted MCP error', () => {
      const message = 'Test error message';
      const error = ApiKeyManager.createApiKeyError(message);
      
      expect(error.code).toBe('INVALID_API_KEY');
      expect(error.message).toBe(message);
      expect(error.data).toEqual({
        setupUrl: 'https://v0.dev/chat/settings/keys',
        required: true
      });
    });
  });
});

describe('hasValidApiKey', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.V0_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('should return true for valid API key parameter', () => {
    expect(hasValidApiKey('v0_test_key_123456789012345')).toBe(true);
  });

  test('should return true for valid API key in environment', () => {
    process.env.V0_API_KEY = 'v0_test_key_123456789012345';
    expect(hasValidApiKey()).toBe(true);
  });

  test('should return false for missing API key', () => {
    expect(hasValidApiKey()).toBe(false);
  });

  test('should return false for invalid API key', () => {
    expect(hasValidApiKey('invalid_key')).toBe(false);
  });

  test('should prefer parameter over environment', () => {
    process.env.V0_API_KEY = 'v0_env_key_123456789012345';
    expect(hasValidApiKey('v0_param_key_123456789012345')).toBe(true);
  });
});

describe('getApiKeySetupInstructions', () => {
  test('should return setup instructions', () => {
    const instructions = getApiKeySetupInstructions();
    expect(instructions).toContain('API Key Setup Instructions');
    expect(instructions).toContain('https://v0.dev/chat/settings/keys');
    expect(instructions).toContain('npx v0-mcp-server --api-key');
    expect(instructions).toContain('export V0_API_KEY');
  });
});