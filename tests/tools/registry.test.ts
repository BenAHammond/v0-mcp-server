/**
 * Tests for Functional Tool Registry
 */

import { describe, it, expect } from '@jest/globals';
import {
  createToolRegistry,
  registerTool,
  findTool,
  listTools,
  getToolNames,
  hasTool,
  removeTool,
  updateTool,
  validateRequiredTools,
  mergeRegistries,
  filterTools,
  mapTools,
  reduceTools,
  getToolCount,
  isEmptyRegistry,
  fromToolArray,
  toToolDefinitions,
  getToolSchemas,
  cloneRegistry,
  formatRegistryError,
  type ToolInfo,
  type RegistryError
} from '../../src/tools/registry.js';
import { isLeft, isRight } from '../../src/types/either.js';

// Mock tool for testing
const createMockTool = (name: string, description: string = 'Test tool'): ToolInfo => ({
  name,
  description,
  schema: {
    inputSchema: {
      type: 'object',
      properties: {
        test: { type: 'string' }
      },
      required: ['test']
    }
  },
  handler: {
    execute: async (input: any) => ({ success: true, files: [] }),
    getSchema: () => ({ inputSchema: {} })
  }
});

describe('Tool Registry Functions', () => {
  describe('createToolRegistry', () => {
    it('should create an empty registry', () => {
      const registry = createToolRegistry();
      expect(registry.size).toBe(0);
      expect(isEmptyRegistry(registry)).toBe(true);
    });
  });

  describe('registerTool', () => {
    it('should register a valid tool', () => {
      const registry = createToolRegistry();
      const tool = createMockTool('test_tool');
      const result = registerTool(registry, tool);

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.size).toBe(1);
        expect(result.right.has('test_tool')).toBe(true);
      }
    });

    it('should reject duplicate tool names', () => {
      const registry = createToolRegistry();
      const tool = createMockTool('test_tool');
      
      const result1 = registerTool(registry, tool);
      expect(isRight(result1)).toBe(true);
      
      if (isRight(result1)) {
        const result2 = registerTool(result1.right, tool);
        expect(isLeft(result2)).toBe(true);
        if (isLeft(result2)) {
          expect(result2.left.type).toBe('TOOL_ALREADY_EXISTS');
        }
      }
    });

    it('should reject invalid tool names', () => {
      const registry = createToolRegistry();
      const invalidNames = ['', ' ', 'CamelCase', 'kebab-case', '123start', 'has spaces'];

      for (const name of invalidNames) {
        const tool = createMockTool(name);
        const result = registerTool(registry, tool);
        expect(isLeft(result)).toBe(true);
        if (isLeft(result)) {
          expect(result.left.type).toBe('INVALID_TOOL_NAME');
        }
      }
    });

    it('should accept valid snake_case names', () => {
      const registry = createToolRegistry();
      const validNames = ['tool', 'test_tool', 'my_awesome_tool', 'tool123', 'tool_123'];

      let currentRegistry = registry;
      for (const name of validNames) {
        const tool = createMockTool(name);
        const result = registerTool(currentRegistry, tool);
        expect(isRight(result)).toBe(true);
        if (isRight(result)) {
          currentRegistry = result.right;
        }
      }
      
      expect(currentRegistry.size).toBe(validNames.length);
    });

    it('should reject tools without schema', () => {
      const registry = createToolRegistry();
      const tool: ToolInfo = {
        name: 'test_tool',
        description: 'Test',
        schema: null as any,
        handler: {
          execute: async () => ({ success: true, files: [] }),
          getSchema: () => ({})
        }
      };

      const result = registerTool(registry, tool);
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.type).toBe('INVALID_SCHEMA');
      }
    });

    it('should not mutate original registry', () => {
      const registry = createToolRegistry();
      const tool = createMockTool('test_tool');
      const originalSize = registry.size;

      const result = registerTool(registry, tool);
      
      expect(registry.size).toBe(originalSize);
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.size).toBe(originalSize + 1);
      }
    });
  });

  describe('findTool', () => {
    it('should find existing tool', () => {
      const registry = createToolRegistry();
      const tool = createMockTool('test_tool');
      const registerResult = registerTool(registry, tool);

      if (isRight(registerResult)) {
        const findResult = findTool(registerResult.right, 'test_tool');
        expect(isRight(findResult)).toBe(true);
        if (isRight(findResult)) {
          expect(findResult.right.name).toBe('test_tool');
        }
      }
    });

    it('should return error for non-existent tool', () => {
      const registry = createToolRegistry();
      const result = findTool(registry, 'non_existent');
      
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.type).toBe('TOOL_NOT_FOUND');
      }
    });
  });

  describe('listTools', () => {
    it('should list all tools', () => {
      const registry = createToolRegistry();
      const tools = [
        createMockTool('tool1'),
        createMockTool('tool2'),
        createMockTool('tool3')
      ];

      let currentRegistry = registry;
      for (const tool of tools) {
        const result = registerTool(currentRegistry, tool);
        if (isRight(result)) {
          currentRegistry = result.right;
        }
      }

      const list = listTools(currentRegistry);
      expect(list).toHaveLength(3);
      expect(list.map(t => t.name).sort()).toEqual(['tool1', 'tool2', 'tool3']);
    });

    it('should return empty array for empty registry', () => {
      const registry = createToolRegistry();
      const list = listTools(registry);
      expect(list).toEqual([]);
    });
  });

  describe('removeTool', () => {
    it('should remove existing tool', () => {
      const registry = createToolRegistry();
      const tool = createMockTool('test_tool');
      const registerResult = registerTool(registry, tool);

      if (isRight(registerResult)) {
        const removeResult = removeTool(registerResult.right, 'test_tool');
        expect(isRight(removeResult)).toBe(true);
        if (isRight(removeResult)) {
          expect(removeResult.right.size).toBe(0);
          expect(removeResult.right.has('test_tool')).toBe(false);
        }
      }
    });

    it('should return error for non-existent tool', () => {
      const registry = createToolRegistry();
      const result = removeTool(registry, 'non_existent');
      
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.type).toBe('TOOL_NOT_FOUND');
      }
    });

    it('should not mutate original registry', () => {
      const registry = createToolRegistry();
      const tool = createMockTool('test_tool');
      const registerResult = registerTool(registry, tool);

      if (isRight(registerResult)) {
        const registryBefore = registerResult.right;
        const sizeBefore = registryBefore.size;
        const removeResult = removeTool(registryBefore, 'test_tool');
        
        expect(registryBefore.size).toBe(sizeBefore);
        expect(isRight(removeResult)).toBe(true);
      }
    });
  });

  describe('updateTool', () => {
    it('should update existing tool', () => {
      const registry = createToolRegistry();
      const tool = createMockTool('test_tool', 'Original description');
      const registerResult = registerTool(registry, tool);

      if (isRight(registerResult)) {
        const updatedTool = createMockTool('test_tool', 'Updated description');
        const updateResult = updateTool(registerResult.right, updatedTool);
        
        expect(isRight(updateResult)).toBe(true);
        if (isRight(updateResult)) {
          const found = findTool(updateResult.right, 'test_tool');
          if (isRight(found)) {
            expect(found.right.description).toBe('Updated description');
          }
        }
      }
    });

    it('should return error for non-existent tool', () => {
      const registry = createToolRegistry();
      const tool = createMockTool('non_existent');
      const result = updateTool(registry, tool);
      
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.type).toBe('TOOL_NOT_FOUND');
      }
    });
  });

  describe('validateRequiredTools', () => {
    it('should validate when all required tools present', () => {
      const registry = createToolRegistry();
      const tool1 = createMockTool('generate_component');
      const tool2 = createMockTool('iterate_component');
      
      let currentRegistry = registry;
      const result1 = registerTool(currentRegistry, tool1);
      if (isRight(result1)) currentRegistry = result1.right;
      
      const result2 = registerTool(currentRegistry, tool2);
      if (isRight(result2)) currentRegistry = result2.right;

      const validation = validateRequiredTools(
        currentRegistry, 
        ['generate_component', 'iterate_component']
      );
      
      expect(isRight(validation)).toBe(true);
    });

    it('should return error when required tools missing', () => {
      const registry = createToolRegistry();
      const tool = createMockTool('some_tool');
      const registerResult = registerTool(registry, tool);

      if (isRight(registerResult)) {
        const validation = validateRequiredTools(
          registerResult.right,
          ['generate_component', 'iterate_component']
        );
        
        expect(isLeft(validation)).toBe(true);
        if (isLeft(validation)) {
          expect(validation.left.type).toBe('MISSING_REQUIRED_TOOLS');
          expect(validation.left.missing).toEqual(['generate_component', 'iterate_component']);
        }
      }
    });

    it('should return error for empty registry', () => {
      const registry = createToolRegistry();
      const validation = validateRequiredTools(registry, ['any_tool']);
      
      expect(isLeft(validation)).toBe(true);
      if (isLeft(validation)) {
        expect(validation.left.type).toBe('EMPTY_REGISTRY');
      }
    });
  });

  describe('mergeRegistries', () => {
    it('should merge two registries', () => {
      const registry1 = createToolRegistry();
      const registry2 = createToolRegistry();
      
      const tool1 = createMockTool('tool1');
      const tool2 = createMockTool('tool2');
      const tool3 = createMockTool('tool3');
      
      let reg1 = registry1;
      let reg2 = registry2;
      
      const result1 = registerTool(reg1, tool1);
      if (isRight(result1)) reg1 = result1.right;
      
      const result2 = registerTool(reg1, tool2);
      if (isRight(result2)) reg1 = result2.right;
      
      const result3 = registerTool(reg2, tool3);
      if (isRight(result3)) reg2 = result3.right;
      
      const merged = mergeRegistries(reg1, reg2);
      expect(merged.size).toBe(3);
      expect(getToolNames(merged).sort()).toEqual(['tool1', 'tool2', 'tool3']);
    });

    it('should override tools from first registry with second', () => {
      const registry1 = createToolRegistry();
      const registry2 = createToolRegistry();
      
      const tool1 = createMockTool('shared_tool', 'From registry 1');
      const tool2 = createMockTool('shared_tool', 'From registry 2');
      
      let reg1 = registry1;
      let reg2 = registry2;
      
      const result1 = registerTool(reg1, tool1);
      if (isRight(result1)) reg1 = result1.right;
      
      const result2 = registerTool(reg2, tool2);
      if (isRight(result2)) reg2 = result2.right;
      
      const merged = mergeRegistries(reg1, reg2);
      const found = findTool(merged, 'shared_tool');
      
      if (isRight(found)) {
        expect(found.right.description).toBe('From registry 2');
      }
    });
  });

  describe('filterTools', () => {
    it('should filter tools by predicate', () => {
      const registry = createToolRegistry();
      const tools = [
        createMockTool('component_tool', 'Component related'),
        createMockTool('chat_tool', 'Chat related'),
        createMockTool('project_tool', 'Project related'),
        createMockTool('another_component', 'Component related')
      ];

      let currentRegistry = registry;
      for (const tool of tools) {
        const result = registerTool(currentRegistry, tool);
        if (isRight(result)) currentRegistry = result.right;
      }

      const filtered = filterTools(
        currentRegistry, 
        tool => tool.description.includes('Component')
      );
      
      expect(filtered.size).toBe(2);
      expect(getToolNames(filtered).sort()).toEqual(['another_component', 'component_tool']);
    });
  });

  describe('mapTools', () => {
    it('should map over tools', () => {
      const registry = createToolRegistry();
      const tools = [
        createMockTool('tool1'),
        createMockTool('tool2'),
        createMockTool('tool3')
      ];

      let currentRegistry = registry;
      for (const tool of tools) {
        const result = registerTool(currentRegistry, tool);
        if (isRight(result)) currentRegistry = result.right;
      }

      const names = mapTools(currentRegistry, tool => tool.name);
      expect(names.sort()).toEqual(['tool1', 'tool2', 'tool3']);
    });
  });

  describe('reduceTools', () => {
    it('should reduce over tools', () => {
      const registry = createToolRegistry();
      const tools = [
        createMockTool('tool1', 'Description 1'),
        createMockTool('tool2', 'Description 2'),
        createMockTool('tool3', 'Description 3')
      ];

      let currentRegistry = registry;
      for (const tool of tools) {
        const result = registerTool(currentRegistry, tool);
        if (isRight(result)) currentRegistry = result.right;
      }

      const totalLength = reduceTools(
        currentRegistry,
        (acc, tool) => acc + tool.description.length,
        0
      );
      
      expect(totalLength).toBe('Description 1'.length * 3);
    });
  });

  describe('fromToolArray', () => {
    it('should create registry from array', () => {
      const tools = [
        createMockTool('tool1'),
        createMockTool('tool2'),
        createMockTool('tool3')
      ];

      const result = fromToolArray(tools);
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.size).toBe(3);
        expect(getToolNames(result.right).sort()).toEqual(['tool1', 'tool2', 'tool3']);
      }
    });

    it('should fail if any tool is invalid', () => {
      const tools = [
        createMockTool('tool1'),
        createMockTool('invalid-name'), // Invalid name
        createMockTool('tool3')
      ];

      const result = fromToolArray(tools);
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.type).toBe('INVALID_TOOL_NAME');
      }
    });
  });

  describe('formatRegistryError', () => {
    it('should format all error types', () => {
      const errors: RegistryError[] = [
        { type: 'TOOL_ALREADY_EXISTS', name: 'test' },
        { type: 'TOOL_NOT_FOUND', name: 'test' },
        { type: 'INVALID_TOOL_NAME', name: 'test', reason: 'bad format' },
        { type: 'INVALID_SCHEMA', name: 'test', reason: 'missing field' },
        { type: 'EMPTY_REGISTRY' },
        { type: 'MISSING_REQUIRED_TOOLS', missing: ['tool1', 'tool2'] }
      ];

      for (const error of errors) {
        const message = formatRegistryError(error);
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
      }
    });
  });

  describe('cloneRegistry', () => {
    it('should create a new registry instance', () => {
      const registry = createToolRegistry();
      const tool = createMockTool('test_tool');
      const registerResult = registerTool(registry, tool);

      if (isRight(registerResult)) {
        const original = registerResult.right;
        const cloned = cloneRegistry(original);
        
        expect(cloned).not.toBe(original);
        expect(cloned.size).toBe(original.size);
        expect(getToolNames(cloned)).toEqual(getToolNames(original));
      }
    });
  });
});