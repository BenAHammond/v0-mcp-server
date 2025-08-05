/**
 * Tests for Tool Executor
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import Ajv from 'ajv';
import {
  createToolExecutor,
  ExecutorDependencies,
  ToolDefinition,
  eitherToToolResponse,
  createSyncToolHandler,
  createAsyncToolHandler
} from '../../src/tools/executor.js';
import { PerformanceManager } from '../../src/performance.js';
import { FileLogger } from '../../src/logger.js';
import { right, left } from '../../src/types/either.js';

// Mock dependencies
const createMockDependencies = (): ExecutorDependencies => {
  const logger = {
    log: jest.fn(),
    error: jest.fn(),
    close: jest.fn()
  } as any;
  
  const performanceManager = new PerformanceManager();
  const ajv = new Ajv();
  
  return { performanceManager, logger, ajv };
};

// Sample tool for testing
const createTestTool = (name: string = 'test_tool'): ToolDefinition => ({
  name,
  description: 'Test tool',
  schema: {
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message'],
      additionalProperties: false
    }
  },
  handler: {
    execute: async (input: any) => ({
      success: true,
      data: { result: `Processed: ${input.message}` }
    }),
    getSchema: () => ({})
  }
});

describe('Tool Executor', () => {
  let deps: ExecutorDependencies;
  let executor: ReturnType<typeof createToolExecutor>;
  
  beforeEach(() => {
    deps = createMockDependencies();
    executor = createToolExecutor(deps);
  });
  
  describe('execute', () => {
    it('should execute a tool successfully with valid input', async () => {
      const tool = createTestTool();
      const input = { message: 'Hello' };
      
      const result = await executor.execute(tool, input);
      
      expect(result._tag).toBe('Right');
      if (result._tag === 'Right') {
        expect(result.right.response.success).toBe(true);
        expect(result.right.response.data).toEqual({ result: 'Processed: Hello' });
        expect(result.right.executionTimeMs).toBeGreaterThan(0);
        expect(result.right.context.toolName).toBe('test_tool');
      }
    });
    
    it('should fail with invalid input', async () => {
      const tool = createTestTool();
      const input = { wrongField: 'Hello' };
      
      const result = await executor.execute(tool, input);
      
      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left.code).toBe('VALIDATION_ERROR');
        expect(result.left.message).toContain('required');
      }
    });
    
    it('should handle execution errors', async () => {
      const tool: ToolDefinition = {
        ...createTestTool(),
        handler: {
          execute: async () => {
            throw new Error('Execution failed');
          },
          getSchema: () => ({})
        }
      };
      
      const result = await executor.execute(tool, { message: 'test' });
      
      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left.code).toBe('EXECUTION_ERROR');
        expect(result.left.message).toContain('Execution failed');
      }
    });
    
    it('should handle timeout', async () => {
      const slowTool: ToolDefinition = {
        ...createTestTool(),
        handler: {
          execute: async () => {
            await new Promise(resolve => setTimeout(resolve, 10000));
            return { success: true, data: {} };
          },
          getSchema: () => ({})
        }
      };
      
      // Set a short timeout
      deps.performanceManager = new PerformanceManager({ toolTimeout: 100 });
      executor = createToolExecutor(deps);
      
      const result = await executor.execute(slowTool, { message: 'test' });
      
      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left.code).toBe('EXECUTION_ERROR');
        expect(result.left.message).toContain('timed out');
      }
    });
  });
  
  describe('executeByName', () => {
    it('should execute tool by name from registry', async () => {
      const tool = createTestTool('my_tool');
      const registry = new Map([['my_tool', tool]]);
      const getToolFn = (name: string) => registry.get(name);
      
      const result = await executor.executeByName(getToolFn)('my_tool', { message: 'Test' });
      
      expect(result._tag).toBe('Right');
      if (result._tag === 'Right') {
        expect(result.right.response.success).toBe(true);
      }
    });
    
    it('should fail when tool not found', async () => {
      const getToolFn = () => undefined;
      
      const result = await executor.executeByName(getToolFn)('unknown_tool', {});
      
      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left.code).toBe('TOOL_NOT_FOUND');
      }
    });
  });
  
  describe('executeBatch', () => {
    it('should execute multiple tools in parallel', async () => {
      const tool1 = createTestTool('tool1');
      const tool2 = createTestTool('tool2');
      const registry = new Map([['tool1', tool1], ['tool2', tool2]]);
      const getToolFn = (name: string) => registry.get(name);
      
      const requests = [
        { toolName: 'tool1', input: { message: 'First' } },
        { toolName: 'tool2', input: { message: 'Second' } }
      ];
      
      const result = await executor.executeBatch(getToolFn)(requests);
      
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.results).toHaveLength(2);
      expect(result.totalTimeMs).toBeGreaterThan(0);
    });
    
    it('should handle mixed success and failure', async () => {
      const tool1 = createTestTool('tool1');
      const registry = new Map([['tool1', tool1]]);
      const getToolFn = (name: string) => registry.get(name);
      
      const requests = [
        { toolName: 'tool1', input: { message: 'Valid' } },
        { toolName: 'unknown', input: { message: 'Invalid' } },
        { toolName: 'tool1', input: { wrongField: 'Invalid' } }
      ];
      
      const result = await executor.executeBatch(getToolFn)(requests);
      
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(2);
      expect(result.results).toHaveLength(3);
    });
  });
  
  describe('executeWithRetry', () => {
    it('should retry on transient failures', async () => {
      let attempts = 0;
      const flakeyTool: ToolDefinition = {
        ...createTestTool(),
        handler: {
          execute: async (input) => {
            attempts++;
            if (attempts < 3) {
              throw new Error('Transient error');
            }
            return { success: true, data: { attempts } };
          },
          getSchema: () => ({})
        }
      };
      
      const retryExecutor = executor.executeWithRetry(3, 10);
      const result = await retryExecutor(flakeyTool, { message: 'test' });
      
      expect(result._tag).toBe('Right');
      expect(attempts).toBe(3);
      if (result._tag === 'Right') {
        expect(result.right.response.data.attempts).toBe(3);
      }
    });
    
    it('should not retry validation errors', async () => {
      const tool = createTestTool();
      let attempts = 0;
      
      const originalExecute = tool.handler.execute;
      tool.handler.execute = async (input) => {
        attempts++;
        return originalExecute(input);
      };
      
      const retryExecutor = executor.executeWithRetry(3, 10);
      const result = await retryExecutor(tool, { wrongField: 'invalid' });
      
      expect(result._tag).toBe('Left');
      expect(attempts).toBe(0); // Should not even attempt execution
      if (result._tag === 'Left') {
        expect(result.left.code).toBe('VALIDATION_ERROR');
      }
    });
  });
  
  describe('createCached', () => {
    it('should cache successful results', async () => {
      const tool = createTestTool();
      let executionCount = 0;
      
      const originalExecute = tool.handler.execute;
      tool.handler.execute = async (input) => {
        executionCount++;
        return originalExecute(input);
      };
      
      const cachedExecutor = executor.createCached();
      const input = { message: 'test' };
      
      // First call
      const result1 = await cachedExecutor(tool, input);
      expect(result1._tag).toBe('Right');
      expect(executionCount).toBe(1);
      
      // Second call should use cache
      const result2 = await cachedExecutor(tool, input);
      expect(result2._tag).toBe('Right');
      expect(executionCount).toBe(1); // Should not increase
      
      // Different input should not use cache
      const result3 = await cachedExecutor(tool, { message: 'different' });
      expect(result3._tag).toBe('Right');
      expect(executionCount).toBe(2);
    });
    
    it('should not cache failures', async () => {
      let attempts = 0;
      const flakeyTool: ToolDefinition = {
        ...createTestTool(),
        handler: {
          execute: async () => {
            attempts++;
            if (attempts === 1) {
              throw new Error('First attempt fails');
            }
            return { success: true, data: { attempts } };
          },
          getSchema: () => ({})
        }
      };
      
      const cachedExecutor = executor.createCached();
      const input = { message: 'test' };
      
      // First call fails
      const result1 = await cachedExecutor(flakeyTool, input);
      expect(result1._tag).toBe('Left');
      expect(attempts).toBe(1);
      
      // Second call should try again (not cached)
      const result2 = await cachedExecutor(flakeyTool, input);
      expect(result2._tag).toBe('Right');
      expect(attempts).toBe(2);
    });
  });
  
  describe('compose', () => {
    it('should compose multiple tools in sequence', async () => {
      const tool1 = createTestTool('tool1');
      const tool2: ToolDefinition = {
        ...createTestTool('tool2'),
        handler: {
          execute: async (input: any) => ({
            success: true,
            data: { result: `Tool2: ${input.data.result}` }
          }),
          getSchema: () => ({})
        }
      };
      
      const transform = (prevResult: any) => ({
        message: 'ignored',
        data: prevResult.data
      });
      
      const result = await executor.compose([tool1, tool2], transform)({ message: 'Start' });
      
      expect(result._tag).toBe('Right');
      if (result._tag === 'Right') {
        expect(result.right).toHaveLength(2);
        expect(result.right[1].response.data.result).toBe('Tool2: Processed: Start');
      }
    });
    
    it('should fail if any tool in composition fails', async () => {
      const tool1 = createTestTool('tool1');
      const failingTool: ToolDefinition = {
        ...createTestTool('failing'),
        handler: {
          execute: async () => {
            throw new Error('Tool failed');
          },
          getSchema: () => ({})
        }
      };
      
      const result = await executor.compose([tool1, failingTool])({ message: 'Start' });
      
      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left.code).toBe('COMPOSITION_ERROR');
        expect(result.left.message).toContain('step 2');
      }
    });
  });
  
  describe('createMonitored', () => {
    it('should track execution metrics', async () => {
      const tool = createTestTool();
      const monitoredExecutor = executor.createMonitored();
      
      // Execute successfully
      await monitoredExecutor.execute(tool, { message: 'test1' });
      await monitoredExecutor.execute(tool, { message: 'test2' });
      
      // Execute with failure
      await monitoredExecutor.execute(tool, { wrongField: 'invalid' });
      
      const metrics = monitoredExecutor.getMetrics();
      
      expect(metrics.totalExecutions).toBe(3);
      expect(metrics.successfulExecutions).toBe(2);
      expect(metrics.failedExecutions).toBe(1);
      expect(metrics.averageExecutionTime).toBeGreaterThan(0);
      expect(metrics.executionTimes).toHaveLength(2);
    });
  });
  
  describe('helpers', () => {
    it('should convert Either to ToolResponse', () => {
      const successResult = right({
        response: { success: true, data: { test: 'data' } },
        executionTimeMs: 100,
        context: {} as any
      });
      
      const successResponse = eitherToToolResponse(successResult);
      expect(successResponse.success).toBe(true);
      expect(successResponse.data).toEqual({ test: 'data' });
      
      const errorResult = left({
        code: 'TEST_ERROR',
        message: 'Test error',
        data: { detail: 'info' }
      });
      
      const errorResponse = eitherToToolResponse(errorResult);
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Test error');
      expect(errorResponse.code).toBe('TEST_ERROR');
    });
    
    it('should create sync tool handler', async () => {
      const handler = createSyncToolHandler(
        (input: { value: number }) => ({
          success: true,
          data: { doubled: input.value * 2 }
        }),
        { inputSchema: {} }
      );
      
      const result = await handler.execute({ value: 5 });
      expect(result.success).toBe(true);
      expect(result.data.doubled).toBe(10);
    });
    
    it('should create async tool handler', async () => {
      const handler = createAsyncToolHandler(
        async (input: { value: number }) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return {
            success: true,
            data: { squared: input.value * input.value }
          };
        },
        { inputSchema: {} }
      );
      
      const result = await handler.execute({ value: 4 });
      expect(result.success).toBe(true);
      expect(result.data.squared).toBe(16);
    });
  });
});