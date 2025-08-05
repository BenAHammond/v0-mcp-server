/**
 * Unit tests for IterateComponentTool
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { IterateComponentTool } from '../../src/tools/iterate-component.js';
import { V0Adapter } from '../../src/v0-adapter.js';
import { UnifiedCodeFormatter } from '../../src/unified-code-formatter.js';
import { ErrorHandler } from '../../src/error-handler.js';
import { IterateComponentInput } from '../../src/types/mcp-types.js';
import { V0ChatResponse } from '../../src/types/api-types.js';

// Mock dependencies
jest.mock('../../src/v0-adapter.js');
jest.mock('../../src/unified-code-formatter.js');
jest.mock('../../src/error-handler.js');

describe('IterateComponentTool', () => {
  let tool: IterateComponentTool;
  let mockAdapter: jest.Mocked<V0Adapter>;
  let mockFormatter: jest.Mocked<UnifiedCodeFormatter>;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;

  beforeEach(() => {
    // Create mocks
    mockAdapter = {
      iterateChat: jest.fn(),
      getChat: jest.fn()
    } as any;

    mockFormatter = {
      formatResponse: jest.fn(),
      formatForClaudeCode: jest.fn()
    } as any;

    mockErrorHandler = {
      handle: jest.fn()
    } as any;

    // Mock constructors
    (V0Adapter as jest.MockedClass<typeof V0Adapter>).mockImplementation(() => mockAdapter);
    (UnifiedCodeFormatter as jest.MockedClass<typeof UnifiedCodeFormatter>).mockImplementation(() => mockFormatter);
    (ErrorHandler as jest.MockedClass<typeof ErrorHandler>).mockImplementation(() => mockErrorHandler);

    // Create tool instance
    tool = new IterateComponentTool('v0_test_key_123456789012345');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should create tool with valid API key', () => {
      expect(() => new IterateComponentTool('v0_test_key_123456789012345')).not.toThrow();
    });

    test('should throw error for invalid API key', () => {
      expect(() => new IterateComponentTool('invalid_key')).toThrow(/Invalid API key/);
    });
  });

  describe('execute', () => {
    test('should execute component iteration successfully', async () => {
      const input: IterateComponentInput = {
        chatId: 'chat_123',
        message: 'Add a loading state to the button',
        preserveContext: true
      };

      const mockV0Response: V0ChatResponse = {
        chatId: 'chat_123',
        previewUrl: 'https://v0.dev/preview/123',
        files: [
          {
            name: 'Button.tsx',
            content: 'export const Button = ({ loading = false }) => <button disabled={loading}>{loading ? "Loading..." : "Click me"}</button>;',
            type: 'component',
            language: 'typescript'
          }
        ],
        success: true
      };

      const mockFormattedResponse = {
        files: mockV0Response.files,
        summary: '1 React component updated',
        fileCount: 1,
        totalSize: 120
      };

      const mockClaudeOutput = '## Updated 1 React component\n\n### Button.tsx\n```typescript\nexport const Button = ({ loading = false }) => <button disabled={loading}>{loading ? "Loading..." : "Click me"}</button>;\n```';

      mockAdapter.iterateChat.mockResolvedValue(mockV0Response);
      mockFormatter.formatResponse.mockReturnValue(mockFormattedResponse);
      mockFormatter.formatForClaudeCode.mockReturnValue(mockClaudeOutput);

      const result = await tool.execute(input);

      expect(mockAdapter.iterateChat).toHaveBeenCalledWith('chat_123', 'Add a loading state to the button');
      expect(mockFormatter.formatResponse).toHaveBeenCalledWith(mockV0Response.files);
      expect(mockFormatter.formatForClaudeCode).toHaveBeenCalledWith(
        mockV0Response.files,
        'chat_123',
        'https://v0.dev/preview/123'
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: mockClaudeOutput
          }
        ],
        isError: false,
        metadata: {
          chatId: 'chat_123',
          previewUrl: 'https://v0.dev/preview/123',
          fileCount: 1,
          totalSize: 120,
          iteration: true
        }
      });
    });

    test('should handle minimal input', async () => {
      const input: IterateComponentInput = {
        chatId: 'chat_456',
        message: 'Change color to red'
      };

      const mockV0Response: V0ChatResponse = {
        chatId: 'chat_456',
        previewUrl: 'https://v0.dev/preview/456',
        files: [
          {
            name: 'Button.tsx',
            content: 'export const Button = () => <button className="bg-red-500">Click</button>;',
            type: 'component',
            language: 'typescript'
          }
        ],
        success: true
      };

      mockAdapter.iterateChat.mockResolvedValue(mockV0Response);
      mockFormatter.formatResponse.mockReturnValue({
        files: mockV0Response.files,
        summary: '1 component',
        fileCount: 1,
        totalSize: 75
      });
      mockFormatter.formatForClaudeCode.mockReturnValue('Formatted output');

      await tool.execute(input);

      expect(mockAdapter.iterateChat).toHaveBeenCalledWith('chat_456', 'Change color to red');
    });

    test('should handle context preservation', async () => {
      const input: IterateComponentInput = {
        chatId: 'chat_789',
        message: 'Add TypeScript types',
        preserveContext: true
      };

      // Mock getting existing chat context
      const mockExistingChat: V0ChatResponse = {
        chatId: 'chat_789',
        previewUrl: 'https://v0.dev/preview/789',
        files: [
          {
            name: 'Button.tsx',
            content: 'export const Button = () => <button>Old version</button>;',
            type: 'component',
            language: 'typescript'
          }
        ],
        success: true
      };

      const mockUpdatedResponse: V0ChatResponse = {
        chatId: 'chat_789',
        previewUrl: 'https://v0.dev/preview/789',
        files: [
          {
            name: 'Button.tsx',
            content: 'interface ButtonProps { onClick?: () => void; } export const Button = ({ onClick }: ButtonProps) => <button onClick={onClick}>Click</button>;',
            type: 'component',
            language: 'typescript'
          }
        ],
        success: true
      };

      mockAdapter.getChat.mockResolvedValue(mockExistingChat);
      mockAdapter.iterateChat.mockResolvedValue(mockUpdatedResponse);
      mockFormatter.formatResponse.mockReturnValue({
        files: mockUpdatedResponse.files,
        summary: '1 component with types',
        fileCount: 1,
        totalSize: 150
      });
      mockFormatter.formatForClaudeCode.mockReturnValue('Updated with types');

      await tool.execute(input);

      expect(mockAdapter.getChat).toHaveBeenCalledWith('chat_789');
      expect(mockAdapter.iterateChat).toHaveBeenCalledWith('chat_789', 'Add TypeScript types');
    });

    test('should handle empty chat ID', async () => {
      const input: IterateComponentInput = {
        chatId: '',
        message: 'Test message'
      };

      await expect(tool.execute(input)).rejects.toThrow(/Chat ID cannot be empty/);
    });

    test('should handle empty message', async () => {
      const input: IterateComponentInput = {
        chatId: 'chat_123',
        message: ''
      };

      await expect(tool.execute(input)).rejects.toThrow(/Message cannot be empty/);
    });

    test('should handle whitespace-only message', async () => {
      const input: IterateComponentInput = {
        chatId: 'chat_123',
        message: '   '
      };

      await expect(tool.execute(input)).rejects.toThrow(/Message cannot be empty/);
    });

    test('should handle very long message', async () => {
      const input: IterateComponentInput = {
        chatId: 'chat_123',
        message: 'x'.repeat(5001)
      };

      await expect(tool.execute(input)).rejects.toThrow(/Message is too long/);
    });

    test('should handle chat not found error', async () => {
      const input: IterateComponentInput = {
        chatId: 'nonexistent_chat',
        message: 'Update component'
      };

      const chatNotFoundError = new Error('Chat not found');
      (chatNotFoundError as any).code = 'CHAT_NOT_FOUND';
      mockAdapter.iterateChat.mockRejectedValue(chatNotFoundError);
      mockErrorHandler.handle.mockReturnValue({
        code: 'CHAT_NOT_FOUND',
        message: 'The specified chat was not found. Please check the chat ID.',
        data: { chatId: 'nonexistent_chat' }
      });

      const result = await tool.execute(input);

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(chatNotFoundError);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('chat was not found');
    });

    test('should handle v0 adapter errors', async () => {
      const input: IterateComponentInput = {
        chatId: 'chat_123',
        message: 'Update component'
      };

      const adapterError = new Error('Network timeout');
      mockAdapter.iterateChat.mockRejectedValue(adapterError);
      mockErrorHandler.handle.mockReturnValue({
        code: 'NETWORK_TIMEOUT',
        message: 'Request timed out. Please try again.',
        data: { timeout: 30000 }
      });

      const result = await tool.execute(input);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('timed out');
    });

    test('should handle formatting errors', async () => {
      const input: IterateComponentInput = {
        chatId: 'chat_123',
        message: 'Update component'
      };

      mockAdapter.iterateChat.mockResolvedValue({
        chatId: 'chat_123',
        previewUrl: 'https://v0.dev/preview/123',
        files: [],
        success: true
      });

      const formatError = new Error('Formatting failed');
      mockFormatter.formatResponse.mockImplementation(() => {
        throw formatError;
      });
      mockErrorHandler.handle.mockReturnValue({
        code: 'FORMATTING_ERROR',
        message: 'Failed to format response',
        data: {}
      });

      const result = await tool.execute(input);

      expect(result.isError).toBe(true);
    });
  });

  describe('validateInput', () => {
    test('should validate correct input', () => {
      const input: IterateComponentInput = {
        chatId: 'chat_123',
        message: 'Valid update message',
        preserveContext: true
      };

      expect(() => (tool as any).validateInput(input)).not.toThrow();
    });

    test('should require chatId', () => {
      const input = {
        message: 'Test message'
      } as IterateComponentInput;

      expect(() => (tool as any).validateInput(input)).toThrow(/Chat ID is required/);
    });

    test('should require message', () => {
      const input = {
        chatId: 'chat_123'
      } as IterateComponentInput;

      expect(() => (tool as any).validateInput(input)).toThrow(/Message is required/);
    });

    test('should validate chatId format', () => {
      const input: IterateComponentInput = {
        chatId: 'invalid chat id with spaces',
        message: 'Test message'
      };

      expect(() => (tool as any).validateInput(input)).toThrow(/Invalid chat ID format/);
    });

    test('should allow undefined preserveContext', () => {
      const input: IterateComponentInput = {
        chatId: 'chat_123',
        message: 'Test message'
      };

      expect(() => (tool as any).validateInput(input)).not.toThrow();
    });
  });

  describe('validateChatId', () => {
    test('should validate correct chat ID format', () => {
      expect(() => (tool as any).validateChatId('chat_123')).not.toThrow();
      expect(() => (tool as any).validateChatId('chat_abc_456')).not.toThrow();
      expect(() => (tool as any).validateChatId('long_chat_id_with_underscores')).not.toThrow();
    });

    test('should reject empty chat ID', () => {
      expect(() => (tool as any).validateChatId('')).toThrow(/Chat ID cannot be empty/);
    });

    test('should reject chat ID with spaces', () => {
      expect(() => (tool as any).validateChatId('chat 123')).toThrow(/Invalid chat ID format/);
    });

    test('should reject chat ID with special characters', () => {
      expect(() => (tool as any).validateChatId('chat@123')).toThrow(/Invalid chat ID format/);
      expect(() => (tool as any).validateChatId('chat#123')).toThrow(/Invalid chat ID format/);
      expect(() => (tool as any).validateChatId('chat!123')).toThrow(/Invalid chat ID format/);
    });

    test('should reject very long chat IDs', () => {
      const longChatId = 'chat_' + 'x'.repeat(200);
      expect(() => (tool as any).validateChatId(longChatId)).toThrow(/too long/);
    });
  });

  describe('getSchema', () => {
    test('should return valid MCP tool schema', () => {
      const schema = tool.getSchema();

      expect(schema.name).toBe('iterate_component');
      expect(schema.description).toContain('Iterate on an existing component');
      expect(schema.inputSchema).toBeDefined();
      expect(schema.inputSchema.type).toBe('object');
      expect(schema.inputSchema.properties).toHaveProperty('chatId');
      expect(schema.inputSchema.properties).toHaveProperty('message');
      expect(schema.inputSchema.properties).toHaveProperty('preserveContext');
      expect(schema.inputSchema.required).toContain('chatId');
      expect(schema.inputSchema.required).toContain('message');
    });

    test('should have correct property types', () => {
      const schema = tool.getSchema();
      const properties = schema.inputSchema.properties;

      expect(properties.chatId.type).toBe('string');
      expect(properties.message.type).toBe('string');
      expect(properties.preserveContext.type).toBe('boolean');

      expect(properties.chatId.description).toContain('Chat ID');
      expect(properties.message.description).toContain('iteration message');
      expect(properties.preserveContext.description).toContain('context');
    });
  });

  describe('error context preservation', () => {
    test('should include chatId in error metadata', async () => {
      const input: IterateComponentInput = {
        chatId: 'error_chat_123',
        message: 'Test message'
      };

      const adapterError = new Error('Test error');
      mockAdapter.iterateChat.mockRejectedValue(adapterError);
      mockErrorHandler.handle.mockReturnValue({
        code: 'TEST_ERROR',
        message: 'Test error occurred',
        data: { chatId: 'error_chat_123' }
      });

      const result = await tool.execute(input);

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(adapterError);
      expect(result.metadata).toEqual({
        chatId: 'error_chat_123',
        error: true
      });
    });
  });

  describe('context preservation behavior', () => {
    test('should not fetch context when preserveContext is false', async () => {
      const input: IterateComponentInput = {
        chatId: 'chat_123',
        message: 'Update without context',
        preserveContext: false
      };

      mockAdapter.iterateChat.mockResolvedValue({
        chatId: 'chat_123',
        previewUrl: 'https://v0.dev/preview/123',
        files: [],
        success: true
      });
      mockFormatter.formatResponse.mockReturnValue({
        files: [],
        summary: 'No files',
        fileCount: 0,
        totalSize: 0
      });
      mockFormatter.formatForClaudeCode.mockReturnValue('No content');

      await tool.execute(input);

      expect(mockAdapter.getChat).not.toHaveBeenCalled();
      expect(mockAdapter.iterateChat).toHaveBeenCalledWith('chat_123', 'Update without context');
    });

    test('should not fetch context when preserveContext is undefined', async () => {
      const input: IterateComponentInput = {
        chatId: 'chat_123',
        message: 'Update with default behavior'
      };

      mockAdapter.iterateChat.mockResolvedValue({
        chatId: 'chat_123',
        previewUrl: 'https://v0.dev/preview/123',
        files: [],
        success: true
      });
      mockFormatter.formatResponse.mockReturnValue({
        files: [],
        summary: 'No files',
        fileCount: 0,
        totalSize: 0
      });
      mockFormatter.formatForClaudeCode.mockReturnValue('No content');

      await tool.execute(input);

      expect(mockAdapter.getChat).not.toHaveBeenCalled();
    });
  });
});