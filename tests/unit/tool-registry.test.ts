/**
 * Unit tests for ToolRegistry and ToolFactory
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ToolRegistry, ToolFactory } from '../../src/tool-registry.js';
import { GenerateComponentTool } from '../../src/tools/generate-component.js';
import { IterateComponentTool } from '../../src/tools/iterate-component.js';

// Mock the tool classes
jest.mock('../../src/tools/generate-component.js');
jest.mock('../../src/tools/iterate-component.js');

describe('ToolFactory', () => {
  const testApiKey = 'v0_test_key_123456789012345';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTool', () => {
    test('should create GenerateComponentTool', () => {
      const mockGenerateTool = {
        getSchema: jest.fn(),
        execute: jest.fn()
      };
      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockGenerateTool as any);

      const tool = ToolFactory.createTool('generate_component', testApiKey);

      expect(GenerateComponentTool).toHaveBeenCalledWith(testApiKey);
      expect(tool).toBe(mockGenerateTool);
    });

    test('should create IterateComponentTool', () => {
      const mockIterateTool = {
        getSchema: jest.fn(),
        execute: jest.fn()
      };
      (IterateComponentTool as jest.MockedClass<typeof IterateComponentTool>)
        .mockImplementation(() => mockIterateTool as any);

      const tool = ToolFactory.createTool('iterate_component', testApiKey);

      expect(IterateComponentTool).toHaveBeenCalledWith(testApiKey);
      expect(tool).toBe(mockIterateTool);
    });

    test('should throw error for unknown tool name', () => {
      expect(() => ToolFactory.createTool('unknown_tool' as any, testApiKey))
        .toThrow(/Unknown tool: unknown_tool/);
    });

    test('should throw error for invalid API key', () => {
      expect(() => ToolFactory.createTool('generate_component', 'invalid_key'))
        .toThrow(/Invalid API key/);
    });

    test('should throw error for empty API key', () => {
      expect(() => ToolFactory.createTool('generate_component', ''))
        .toThrow(/API key is required/);
    });
  });

  describe('getAvailableTools', () => {
    test('should return all available tool names', () => {
      const tools = ToolFactory.getAvailableTools();
      expect(tools).toEqual(['generate_component', 'iterate_component']);
    });

    test('should return array of exactly 2 tools', () => {
      const tools = ToolFactory.getAvailableTools();
      expect(tools).toHaveLength(2);
    });
  });

  describe('validateToolName', () => {
    test('should validate known tool names', () => {
      expect(() => ToolFactory.validateToolName('generate_component')).not.toThrow();
      expect(() => ToolFactory.validateToolName('iterate_component')).not.toThrow();
    });

    test('should reject unknown tool names', () => {
      expect(() => ToolFactory.validateToolName('unknown_tool' as any))
        .toThrow(/Unknown tool: unknown_tool/);
    });

    test('should reject empty tool name', () => {
      expect(() => ToolFactory.validateToolName('' as any))
        .toThrow(/Tool name is required/);
    });
  });
});

describe('ToolRegistry', () => {
  let registry: ToolRegistry;
  const testApiKey = 'v0_test_key_123456789012345';

  beforeEach(() => {
    jest.clearAllMocks();
    registry = new ToolRegistry(testApiKey);
  });

  describe('constructor', () => {
    test('should create registry with valid API key', () => {
      expect(() => new ToolRegistry(testApiKey)).not.toThrow();
    });

    test('should throw error for invalid API key', () => {
      expect(() => new ToolRegistry('invalid_key')).toThrow(/Invalid API key/);
    });

    test('should initialize with empty tools map', () => {
      expect((registry as any).tools.size).toBe(0);
    });
  });

  describe('registerTool', () => {
    test('should register generate_component tool', () => {
      const mockTool = {
        getSchema: jest.fn().mockReturnValue({
          name: 'generate_component',
          description: 'Generate component',
          inputSchema: { type: 'object' }
        }),
        execute: jest.fn()
      };
      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockTool as any);

      registry.registerTool('generate_component');

      expect(GenerateComponentTool).toHaveBeenCalledWith(testApiKey);
      expect((registry as any).tools.has('generate_component')).toBe(true);
    });

    test('should register iterate_component tool', () => {
      const mockTool = {
        getSchema: jest.fn().mockReturnValue({
          name: 'iterate_component',
          description: 'Iterate component',
          inputSchema: { type: 'object' }
        }),
        execute: jest.fn()
      };
      (IterateComponentTool as jest.MockedClass<typeof IterateComponentTool>)
        .mockImplementation(() => mockTool as any);

      registry.registerTool('iterate_component');

      expect(IterateComponentTool).toHaveBeenCalledWith(testApiKey);
      expect((registry as any).tools.has('iterate_component')).toBe(true);
    });

    test('should prevent duplicate tool registration', () => {
      const mockTool = { getSchema: jest.fn(), execute: jest.fn() };
      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockTool as any);

      registry.registerTool('generate_component');
      
      expect(() => registry.registerTool('generate_component'))
        .toThrow(/Tool generate_component is already registered/);
    });

    test('should throw error for unknown tool', () => {
      expect(() => registry.registerTool('unknown_tool' as any))
        .toThrow(/Unknown tool: unknown_tool/);
    });
  });

  describe('registerAllTools', () => {
    test('should register all available tools', () => {
      const mockGenerateTool = {
        getSchema: jest.fn().mockReturnValue({ name: 'generate_component' }),
        execute: jest.fn()
      };
      const mockIterateTool = {
        getSchema: jest.fn().mockReturnValue({ name: 'iterate_component' }),
        execute: jest.fn()
      };

      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockGenerateTool as any);
      (IterateComponentTool as jest.MockedClass<typeof IterateComponentTool>)
        .mockImplementation(() => mockIterateTool as any);

      registry.registerAllTools();

      expect((registry as any).tools.size).toBe(2);
      expect((registry as any).tools.has('generate_component')).toBe(true);
      expect((registry as any).tools.has('iterate_component')).toBe(true);
    });

    test('should not register tools twice', () => {
      const mockTool = { getSchema: jest.fn(), execute: jest.fn() };
      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockTool as any);
      (IterateComponentTool as jest.MockedClass<typeof IterateComponentTool>)
        .mockImplementation(() => mockTool as any);

      registry.registerAllTools();
      const firstSize = (registry as any).tools.size;

      // Should not throw or register duplicates
      registry.registerAllTools();
      const secondSize = (registry as any).tools.size;

      expect(firstSize).toBe(secondSize);
    });
  });

  describe('getTool', () => {
    test('should return registered tool', () => {
      const mockTool = {
        getSchema: jest.fn().mockReturnValue({ name: 'generate_component' }),
        execute: jest.fn()
      };
      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockTool as any);

      registry.registerTool('generate_component');
      const tool = registry.getTool('generate_component');

      expect(tool).toBe(mockTool);
    });

    test('should return undefined for unregistered tool', () => {
      const tool = registry.getTool('generate_component');
      expect(tool).toBeUndefined();
    });
  });

  describe('getToolSchema', () => {
    test('should return schema for registered tool', () => {
      const mockSchema = {
        name: 'generate_component',
        description: 'Generate a component',
        inputSchema: { type: 'object', properties: {} }
      };
      const mockTool = {
        getSchema: jest.fn().mockReturnValue(mockSchema),
        execute: jest.fn()
      };
      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockTool as any);

      registry.registerTool('generate_component');
      const schema = registry.getToolSchema('generate_component');

      expect(schema).toBe(mockSchema);
      expect(mockTool.getSchema).toHaveBeenCalled();
    });

    test('should return undefined for unregistered tool', () => {
      const schema = registry.getToolSchema('generate_component');
      expect(schema).toBeUndefined();
    });
  });

  describe('getAllSchemas', () => {
    test('should return schemas for all registered tools', () => {
      const mockGenerateSchema = {
        name: 'generate_component',
        description: 'Generate component',
        inputSchema: { type: 'object' }
      };
      const mockIterateSchema = {
        name: 'iterate_component',
        description: 'Iterate component',
        inputSchema: { type: 'object' }
      };

      const mockGenerateTool = {
        getSchema: jest.fn().mockReturnValue(mockGenerateSchema),
        execute: jest.fn()
      };
      const mockIterateTool = {
        getSchema: jest.fn().mockReturnValue(mockIterateSchema),
        execute: jest.fn()
      };

      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockGenerateTool as any);
      (IterateComponentTool as jest.MockedClass<typeof IterateComponentTool>)
        .mockImplementation(() => mockIterateTool as any);

      registry.registerAllTools();
      const schemas = registry.getAllSchemas();

      expect(schemas).toHaveLength(2);
      expect(schemas).toContainEqual(mockGenerateSchema);
      expect(schemas).toContainEqual(mockIterateSchema);
    });

    test('should return empty array when no tools registered', () => {
      const schemas = registry.getAllSchemas();
      expect(schemas).toEqual([]);
    });
  });

  describe('getRegisteredToolNames', () => {
    test('should return names of registered tools', () => {
      const mockTool = { getSchema: jest.fn(), execute: jest.fn() };
      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockTool as any);

      registry.registerTool('generate_component');
      const names = registry.getRegisteredToolNames();

      expect(names).toEqual(['generate_component']);
    });

    test('should return empty array when no tools registered', () => {
      const names = registry.getRegisteredToolNames();
      expect(names).toEqual([]);
    });

    test('should return all tool names when all tools registered', () => {
      const mockTool = { getSchema: jest.fn(), execute: jest.fn() };
      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockTool as any);
      (IterateComponentTool as jest.MockedClass<typeof IterateComponentTool>)
        .mockImplementation(() => mockTool as any);

      registry.registerAllTools();
      const names = registry.getRegisteredToolNames();

      expect(names).toHaveLength(2);
      expect(names).toContain('generate_component');
      expect(names).toContain('iterate_component');
    });
  });

  describe('isToolRegistered', () => {
    test('should return true for registered tool', () => {
      const mockTool = { getSchema: jest.fn(), execute: jest.fn() };
      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockTool as any);

      registry.registerTool('generate_component');
      
      expect(registry.isToolRegistered('generate_component')).toBe(true);
    });

    test('should return false for unregistered tool', () => {
      expect(registry.isToolRegistered('generate_component')).toBe(false);
    });
  });

  describe('unregisterTool', () => {
    test('should unregister existing tool', () => {
      const mockTool = { getSchema: jest.fn(), execute: jest.fn() };
      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockTool as any);

      registry.registerTool('generate_component');
      expect(registry.isToolRegistered('generate_component')).toBe(true);

      registry.unregisterTool('generate_component');
      expect(registry.isToolRegistered('generate_component')).toBe(false);
    });

    test('should handle unregistering non-existent tool gracefully', () => {
      expect(() => registry.unregisterTool('generate_component')).not.toThrow();
    });
  });

  describe('clear', () => {
    test('should clear all registered tools', () => {
      const mockTool = { getSchema: jest.fn(), execute: jest.fn() };
      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockTool as any);
      (IterateComponentTool as jest.MockedClass<typeof IterateComponentTool>)
        .mockImplementation(() => mockTool as any);

      registry.registerAllTools();
      expect(registry.getRegisteredToolNames()).toHaveLength(2);

      registry.clear();
      expect(registry.getRegisteredToolNames()).toHaveLength(0);
    });
  });

  describe('getRegistrationSummary', () => {
    test('should return registration summary', () => {
      const mockTool = { getSchema: jest.fn(), execute: jest.fn() };
      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockTool as any);

      registry.registerTool('generate_component');
      const summary = registry.getRegistrationSummary();

      expect(summary).toEqual({
        totalAvailable: 2,
        totalRegistered: 1,
        registeredTools: ['generate_component'],
        unregisteredTools: ['iterate_component']
      });
    });

    test('should return summary with no tools registered', () => {
      const summary = registry.getRegistrationSummary();

      expect(summary).toEqual({
        totalAvailable: 2,
        totalRegistered: 0,
        registeredTools: [],
        unregisteredTools: ['generate_component', 'iterate_component']
      });
    });

    test('should return summary with all tools registered', () => {
      const mockTool = { getSchema: jest.fn(), execute: jest.fn() };
      (GenerateComponentTool as jest.MockedClass<typeof GenerateComponentTool>)
        .mockImplementation(() => mockTool as any);
      (IterateComponentTool as jest.MockedClass<typeof IterateComponentTool>)
        .mockImplementation(() => mockTool as any);

      registry.registerAllTools();
      const summary = registry.getRegistrationSummary();

      expect(summary).toEqual({
        totalAvailable: 2,
        totalRegistered: 2,
        registeredTools: ['generate_component', 'iterate_component'],
        unregisteredTools: []
      });
    });
  });
});