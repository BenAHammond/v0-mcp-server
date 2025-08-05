/**
 * Unit tests for GenerateComponentTool
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { GenerateComponentTool } from '../../src/tools/generate-component.js';
import { V0Adapter } from '../../src/v0-adapter.js';
import { UnifiedCodeFormatter } from '../../src/unified-code-formatter.js';
import { ErrorHandler } from '../../src/error-handler.js';
import { GenerateComponentInput } from '../../src/types/mcp-types.js';
import { V0ChatResponse } from '../../src/types/api-types.js';

// Mock dependencies
jest.mock('../../src/v0-adapter.js');
jest.mock('../../src/unified-code-formatter.js');
jest.mock('../../src/error-handler.js');

describe('GenerateComponentTool', () => {
  let tool: GenerateComponentTool;
  let mockAdapter: jest.Mocked<V0Adapter>;
  let mockFormatter: jest.Mocked<UnifiedCodeFormatter>;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;

  beforeEach(() => {
    // Create mocks
    mockAdapter = {
      createChat: jest.fn()
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
    tool = new GenerateComponentTool('v0_test_key_123456789012345');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should create tool with valid API key', () => {
      expect(() => new GenerateComponentTool('v0_test_key_123456789012345')).not.toThrow();
    });

    test('should throw error for invalid API key', () => {
      expect(() => new GenerateComponentTool('invalid_key')).toThrow(/Invalid API key/);
    });
  });

  describe('execute', () => {
    test('should execute component generation successfully', async () => {
      const input: GenerateComponentInput = {
        description: 'Create a blue button component',
        options: {
          framework: 'react',
          typescript: true,
          styling: 'tailwind'
        }
      };

      const mockV0Response: V0ChatResponse = {
        chatId: 'chat_123',
        previewUrl: 'https://v0.dev/preview/123',
        files: [
          {
            name: 'Button.tsx',
            content: 'export const Button = () => <button className="bg-blue-500">Click me</button>;',
            type: 'component',
            language: 'typescript'
          }
        ],
        success: true
      };

      const mockFormattedResponse = {
        files: mockV0Response.files,
        summary: '1 React component generated',
        fileCount: 1,
        totalSize: 85
      };

      const mockClaudeOutput = '## Generated 1 React component\n\n### Button.tsx\n```typescript\nexport const Button = () => <button className="bg-blue-500">Click me</button>;\n```';

      mockAdapter.createChat.mockResolvedValue(mockV0Response);
      mockFormatter.formatResponse.mockReturnValue(mockFormattedResponse);
      mockFormatter.formatForClaudeCode.mockReturnValue(mockClaudeOutput);

      const result = await tool.execute(input);

      expect(mockAdapter.createChat).toHaveBeenCalledWith(
        'Create a blue button component. Use React with TypeScript and Tailwind CSS for styling.'
      );
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
          totalSize: 85
        }
      });
    });

    test('should handle minimal input', async () => {
      const input: GenerateComponentInput = {
        description: 'Simple button'
      };

      const mockV0Response: V0ChatResponse = {
        chatId: 'chat_456',
        previewUrl: 'https://v0.dev/preview/456',
        files: [
          {
            name: 'Button.tsx',
            content: 'export const Button = () => <button>Click</button>;',
            type: 'component',
            language: 'typescript'
          }
        ],
        success: true
      };

      mockAdapter.createChat.mockResolvedValue(mockV0Response);
      mockFormatter.formatResponse.mockReturnValue({
        files: mockV0Response.files,
        summary: '1 component',
        fileCount: 1,
        totalSize: 50
      });
      mockFormatter.formatForClaudeCode.mockReturnValue('Formatted output');

      await tool.execute(input);

      expect(mockAdapter.createChat).toHaveBeenCalledWith('Simple button');
    });

    test('should construct enhanced prompt with options', async () => {
      const input: GenerateComponentInput = {
        description: 'Data table component',
        options: {
          framework: 'vue',
          typescript: false,
          styling: 'css'
        }
      };

      mockAdapter.createChat.mockResolvedValue({
        chatId: 'chat_789',
        previewUrl: 'https://v0.dev/preview/789',
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

      expect(mockAdapter.createChat).toHaveBeenCalledWith(
        'Data table component. Use Vue with JavaScript and CSS for styling.'
      );
    });

    test('should handle empty description', async () => {
      const input: GenerateComponentInput = {
        description: ''
      };

      await expect(tool.execute(input)).rejects.toThrow(/Description cannot be empty/);
    });

    test('should handle whitespace-only description', async () => {
      const input: GenerateComponentInput = {
        description: '   '
      };

      await expect(tool.execute(input)).rejects.toThrow(/Description cannot be empty/);
    });

    test('should handle very long description', async () => {
      const input: GenerateComponentInput = {
        description: 'x'.repeat(5001)
      };

      await expect(tool.execute(input)).rejects.toThrow(/Description is too long/);
    });

    test('should handle v0 adapter errors', async () => {
      const input: GenerateComponentInput = {
        description: 'Test component'
      };

      const adapterError = new Error('API rate limit exceeded');
      mockAdapter.createChat.mockRejectedValue(adapterError);
      mockErrorHandler.handle.mockReturnValue({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please try again later.',
        data: { retryAfter: 60 }
      });

      const result = await tool.execute(input);

      expect(mockErrorHandler.handle).toHaveBeenCalledWith(adapterError);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Rate limit exceeded');
    });

    test('should handle formatting errors', async () => {
      const input: GenerateComponentInput = {
        description: 'Test component'
      };

      mockAdapter.createChat.mockResolvedValue({
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
      const input: GenerateComponentInput = {
        description: 'Valid component description',
        options: {
          framework: 'react',
          typescript: true,
          styling: 'tailwind'
        }
      };

      expect(() => (tool as any).validateInput(input)).not.toThrow();
    });

    test('should require description', () => {
      const input = {} as GenerateComponentInput;

      expect(() => (tool as any).validateInput(input)).toThrow(/Description is required/);
    });

    test('should validate framework option', () => {
      const input: GenerateComponentInput = {
        description: 'Test',
        options: {
          framework: 'angular' as any
        }
      };

      expect(() => (tool as any).validateInput(input)).toThrow(/Invalid framework/);
    });

    test('should validate styling option', () => {
      const input: GenerateComponentInput = {
        description: 'Test',
        options: {
          styling: 'bootstrap' as any
        }
      };

      expect(() => (tool as any).validateInput(input)).toThrow(/Invalid styling/);
    });

    test('should allow undefined options', () => {
      const input: GenerateComponentInput = {
        description: 'Test component'
      };

      expect(() => (tool as any).validateInput(input)).not.toThrow();
    });
  });

  describe('buildPrompt', () => {
    test('should build basic prompt with description only', () => {
      const input: GenerateComponentInput = {
        description: 'Create a button'
      };

      const prompt = (tool as any).buildPrompt(input);
      expect(prompt).toBe('Create a button');
    });

    test('should build enhanced prompt with all options', () => {
      const input: GenerateComponentInput = {
        description: 'Create a button',
        options: {
          framework: 'react',
          typescript: true,
          styling: 'tailwind'
        }
      };

      const prompt = (tool as any).buildPrompt(input);
      expect(prompt).toBe('Create a button. Use React with TypeScript and Tailwind CSS for styling.');
    });

    test('should build prompt with partial options', () => {
      const input: GenerateComponentInput = {
        description: 'Create a form',
        options: {
          framework: 'vue',
          typescript: false
        }
      };

      const prompt = (tool as any).buildPrompt(input);
      expect(prompt).toBe('Create a form. Use Vue with JavaScript.');
    });

    test('should handle default values correctly', () => {
      const input: GenerateComponentInput = {
        description: 'Create a card',
        options: {
          styling: 'css'
        }
      };

      const prompt = (tool as any).buildPrompt(input);
      expect(prompt).toBe('Create a card. Use CSS for styling.');
    });
  });

  describe('getSchema', () => {
    test('should return valid MCP tool schema', () => {
      const schema = tool.getSchema();

      expect(schema.name).toBe('generate_component');
      expect(schema.description).toContain('Generate a new component');
      expect(schema.inputSchema).toBeDefined();
      expect(schema.inputSchema.type).toBe('object');
      expect(schema.inputSchema.properties).toHaveProperty('description');
      expect(schema.inputSchema.properties).toHaveProperty('options');
      expect(schema.inputSchema.required).toContain('description');
    });

    test('should have correct option schemas', () => {
      const schema = tool.getSchema();
      const optionsSchema = schema.inputSchema.properties.options;

      expect(optionsSchema.type).toBe('object');
      expect(optionsSchema.properties).toHaveProperty('framework');
      expect(optionsSchema.properties).toHaveProperty('typescript');
      expect(optionsSchema.properties).toHaveProperty('styling');

      expect(optionsSchema.properties.framework.enum).toEqual(['react', 'vue', 'svelte']);
      expect(optionsSchema.properties.styling.enum).toEqual(['css', 'tailwind', 'styled-components']);
      expect(optionsSchema.properties.typescript.type).toBe('boolean');
    });
  });
});