/**
 * Unit tests for V0Adapter
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { V0Adapter } from '../../src/v0-adapter.js';
import { V0ChatResponse, V0File } from '../../src/types/api-types.js';

// Mock the v0-sdk
jest.mock('v0-sdk', () => {
  return {
    V0: jest.fn().mockImplementation(() => ({
      chats: {
        create: jest.fn(),
        get: jest.fn(),
        sendMessage: jest.fn()
      }
    }))
  };
});

describe('V0Adapter', () => {
  let adapter: V0Adapter;
  let mockV0Client: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create adapter with test API key
    adapter = new V0Adapter('v0_test_key_123456789012345');
    
    // Get reference to mock client
    mockV0Client = (adapter as any).client;
  });

  describe('constructor', () => {
    test('should create adapter with valid API key', () => {
      expect(() => new V0Adapter('v0_test_key_123456789012345')).not.toThrow();
    });

    test('should throw error for invalid API key', () => {
      expect(() => new V0Adapter('invalid_key')).toThrow(/Invalid API key format/);
    });
  });

  describe('createChat', () => {
    test('should create chat and return transformed response', async () => {
      // Mock successful chat creation
      const mockChatResponse = {
        id: 'chat_123',
        url: 'https://v0.dev/preview/123',
        files: [
          {
            name: 'Button.tsx',
            content: 'export const Button = () => <button>Click me</button>;',
            type: 'component'
          }
        ]
      };

      mockV0Client.chats.create.mockResolvedValue(mockChatResponse);

      const result = await adapter.createChat('Create a button component');

      expect(mockV0Client.chats.create).toHaveBeenCalledWith({
        message: 'Create a button component'
      });
      
      expect(result).toEqual({
        chatId: 'chat_123',
        previewUrl: 'https://v0.dev/preview/123',
        files: [
          {
            name: 'Button.tsx',
            content: 'export const Button = () => <button>Click me</button>;',
            type: 'component',
            language: 'typescript'
          }
        ],
        success: true
      });
    });

    test('should handle empty message', async () => {
      await expect(adapter.createChat('')).rejects.toThrow(/Message cannot be empty/);
    });

    test('should handle API errors', async () => {
      mockV0Client.chats.create.mockRejectedValue(new Error('API Error'));

      await expect(adapter.createChat('test message')).rejects.toThrow(/Failed to create chat/);
    });

    test('should handle rate limiting', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).code = 'RATE_LIMIT_EXCEEDED';
      mockV0Client.chats.create.mockRejectedValue(rateLimitError);

      await expect(adapter.createChat('test message')).rejects.toThrow(/rate limit/);
    });
  });

  describe('iterateChat', () => {
    test('should iterate existing chat with message', async () => {
      const mockIterateResponse = {
        id: 'chat_123',
        url: 'https://v0.dev/preview/123',
        files: [
          {
            name: 'Button.tsx',
            content: 'export const Button = ({ text }: { text: string }) => <button>{text}</button>;',
            type: 'component'
          }
        ]
      };

      mockV0Client.chats.sendMessage.mockResolvedValue(mockIterateResponse);

      const result = await adapter.iterateChat('chat_123', 'Add a text prop to the button');

      expect(mockV0Client.chats.sendMessage).toHaveBeenCalledWith('chat_123', {
        message: 'Add a text prop to the button'
      });
      
      expect(result.files[0].content).toContain('text: string');
    });

    test('should handle invalid chat ID', async () => {
      await expect(adapter.iterateChat('', 'test message')).rejects.toThrow(/Chat ID cannot be empty/);
    });

    test('should handle chat not found', async () => {
      const notFoundError = new Error('Chat not found');
      (notFoundError as any).code = 'CHAT_NOT_FOUND';
      mockV0Client.chats.sendMessage.mockRejectedValue(notFoundError);

      await expect(adapter.iterateChat('invalid_chat', 'test')).rejects.toThrow(/Chat not found/);
    });
  });

  describe('getChat', () => {
    test('should retrieve existing chat', async () => {
      const mockChatData = {
        id: 'chat_123',
        url: 'https://v0.dev/preview/123',
        messages: ['Initial message', 'Follow up'],
        files: [
          {
            name: 'Component.tsx',
            content: 'export const Component = () => <div>Test</div>;',
            type: 'component'
          }
        ]
      };

      mockV0Client.chats.get.mockResolvedValue(mockChatData);

      const result = await adapter.getChat('chat_123');

      expect(mockV0Client.chats.get).toHaveBeenCalledWith('chat_123');
      expect(result.chatId).toBe('chat_123');
      expect(result.files).toHaveLength(1);
    });

    test('should handle missing chat ID', async () => {
      await expect(adapter.getChat('')).rejects.toThrow(/Chat ID cannot be empty/);
    });
  });

  describe('transformResponse', () => {
    test('should transform v0 response to standard format', () => {
      const v0Response = {
        id: 'chat_123',
        url: 'https://v0.dev/preview/123',
        files: [
          {
            name: 'App.tsx',
            content: 'export default function App() { return <div>Hello</div>; }',
            type: 'component'
          },
          {
            name: 'styles.css',
            content: '.app { color: blue; }',
            type: 'style'
          }
        ]
      };

      const result = (adapter as any).transformResponse(v0Response);

      expect(result).toEqual({
        chatId: 'chat_123',
        previewUrl: 'https://v0.dev/preview/123',
        files: [
          {
            name: 'App.tsx',
            content: 'export default function App() { return <div>Hello</div>; }',
            type: 'component',
            language: 'typescript'
          },
          {
            name: 'styles.css',
            content: '.app { color: blue; }',
            type: 'style',
            language: 'css'
          }
        ],
        success: true
      });
    });

    test('should handle response without files', () => {
      const v0Response = {
        id: 'chat_123',
        url: 'https://v0.dev/preview/123',
        files: []
      };

      const result = (adapter as any).transformResponse(v0Response);

      expect(result.files).toEqual([]);
      expect(result.success).toBe(true);
    });
  });

  describe('detectLanguage', () => {
    test('should detect TypeScript from .tsx extension', () => {
      const language = (adapter as any).detectLanguage('Component.tsx', 'component');
      expect(language).toBe('typescript');
    });

    test('should detect JavaScript from .jsx extension', () => {
      const language = (adapter as any).detectLanguage('Component.jsx', 'component');
      expect(language).toBe('javascript');
    });

    test('should detect CSS from .css extension', () => {
      const language = (adapter as any).detectLanguage('styles.css', 'style');
      expect(language).toBe('css');
    });

    test('should detect JSON from .json extension', () => {
      const language = (adapter as any).detectLanguage('config.json', 'config');
      expect(language).toBe('json');
    });

    test('should detect markdown from .md extension', () => {
      const language = (adapter as any).detectLanguage('README.md', 'documentation');
      expect(language).toBe('markdown');
    });

    test('should fall back to type-based detection', () => {
      const language = (adapter as any).detectLanguage('unknown', 'component');
      expect(language).toBe('typescript'); // Default for components
    });
  });

  describe('validateInput', () => {
    test('should validate non-empty message', () => {
      expect(() => (adapter as any).validateInput('Valid message')).not.toThrow();
    });

    test('should reject empty message', () => {
      expect(() => (adapter as any).validateInput('')).toThrow(/Message cannot be empty/);
    });

    test('should reject whitespace-only message', () => {
      expect(() => (adapter as any).validateInput('   ')).toThrow(/Message cannot be empty/);
    });

    test('should reject very long messages', () => {
      const longMessage = 'x'.repeat(10001);
      expect(() => (adapter as any).validateInput(longMessage)).toThrow(/too long/);
    });
  });

  describe('validateChatId', () => {
    test('should validate non-empty chat ID', () => {
      expect(() => (adapter as any).validateChatId('chat_123')).not.toThrow();
    });

    test('should reject empty chat ID', () => {
      expect(() => (adapter as any).validateChatId('')).toThrow(/Chat ID cannot be empty/);
    });

    test('should reject whitespace-only chat ID', () => {
      expect(() => (adapter as any).validateChatId('   ')).toThrow(/Chat ID cannot be empty/);
    });
  });

  describe('error handling', () => {
    test('should wrap v0 SDK errors with context', async () => {
      const originalError = new Error('Network timeout');
      mockV0Client.chats.create.mockRejectedValue(originalError);

      try {
        await adapter.createChat('test message');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Failed to create chat');
        expect((error as Error).message).toContain('Network timeout');
      }
    });

    test('should preserve error codes when available', async () => {
      const apiError = new Error('Unauthorized');
      (apiError as any).code = 'UNAUTHORIZED';
      mockV0Client.chats.create.mockRejectedValue(apiError);

      try {
        await adapter.createChat('test message');
      } catch (error) {
        expect((error as any).code).toBe('UNAUTHORIZED');
      }
    });
  });
});