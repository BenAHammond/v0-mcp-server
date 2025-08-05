/**
 * Test the mock factories
 */

import {
  createMockV0Client,
  createMockLogger,
  createMockConfig,
  createMockToolRegistry,
  createMockPerformanceManager,
  createMockMemoryMonitor,
  createMockErrorHandler,
  createMockInputValidator,
  createMockDependencies,
  createSuccessScenario,
  createFailureScenario,
  createSlowScenario
} from './factories.js';

describe('Mock Factories', () => {
  describe('V0 Client Mock', () => {
    it('should create a mock V0 client with default settings', () => {
      const client = createMockV0Client();
      
      expect(client.config.apiKey).toBe('test-api-key');
      expect(client.config.timeout).toBe(30000);
      expect(client.client.chats.create).toBeDefined();
      expect(client.client.user.get).toBeDefined();
    });

    it('should create a mock V0 client that fails operations', async () => {
      const client = createMockV0Client({
        shouldFailGenerate: true,
        shouldFailIterate: true
      });

      await expect(client.client.chats.create({ description: 'test' }))
        .rejects.toThrow('Mock generate failure');
      
      await expect(client.client.chats.sendMessage({ chatId: 'test', message: 'test' }))
        .rejects.toThrow('Mock iterate failure');
    });

    it('should simulate delays', async () => {
      const client = createMockV0Client({
        generateDelay: 100,
        iterateDelay: 50
      });

      const start = Date.now();
      await client.client.chats.create({ description: 'test' });
      const duration = Date.now() - start;
      
      expect(duration).toBeGreaterThanOrEqual(90); // Allow some timing variance
    });
  });

  describe('Logger Mock', () => {
    it('should create a mock logger that captures calls', () => {
      const logger = createMockLogger({ captureLogCalls: true });
      
      logger.info('Test message', { data: 'test' });
      logger.error('Error message');
      
      const calls = logger.getCalls();
      expect(calls.length).toBe(2);
      expect(calls[0].level).toBe('info');
      expect(calls[0].message).toBe('Test message');
      expect(calls[1].level).toBe('error');
    });

    it('should create a mock logger that logs to console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const logger = createMockLogger({ shouldLogToConsole: true });
      logger.info('Test console message');
      
      expect(consoleSpy).toHaveBeenCalledWith('[INFO] Test console message', '');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Config Mock', () => {
    it('should create a mock config with defaults', () => {
      const config = createMockConfig();
      
      expect(config.name).toBe('Test v0 MCP Server');
      expect(config.apiKey).toBe('v1:test:mock-api-key-123');
      expect(config.version).toBe('1.0.0-test');
      expect(config.timeout).toBe(30000);
    });

    it('should create a mock config with custom values', () => {
      const config = createMockConfig({
        name: 'Custom Server',
        apiKey: 'custom-key',
        verbose: true,
        customFields: {
          maxMemoryMB: 1024
        }
      });
      
      expect(config.name).toBe('Custom Server');
      expect(config.apiKey).toBe('custom-key');
      expect(config.verbose).toBe(true);
      expect(config.maxMemoryMB).toBe(1024);
    });
  });

  describe('Tool Registry Mock', () => {
    it('should create a mock tool registry with default tools', () => {
      const registry = createMockToolRegistry();
      const tools = registry.listTools();
      
      expect(tools.length).toBe(2);
      expect(tools.find(t => t.name === 'generate_component')).toBeDefined();
      expect(tools.find(t => t.name === 'iterate_component')).toBeDefined();
    });

    it('should execute tools successfully', async () => {
      const registry = createMockToolRegistry();
      
      const result = await registry.executeTool('generate_component', {
        description: 'A test component'
      });
      
      expect(result.content[0].text).toContain('Generated component: A test component');
    });

    it('should simulate tool execution failures', async () => {
      const registry = createMockToolRegistry({ shouldFailExecution: true });
      
      await expect(registry.executeTool('generate_component', { description: 'test' }))
        .rejects.toThrow('Mock tool execution failure');
    });
  });

  describe('Performance Manager Mock', () => {
    it('should create a mock performance manager', async () => {
      const manager = createMockPerformanceManager();
      
      const result = await manager.withTimeout(async () => 'success');
      expect(result).toBe('success');
      
      const { result: measureResult, duration } = await manager.measureTime(async () => 'measured');
      expect(measureResult).toBe('measured');
      expect(typeof duration).toBe('number');
    });

    it('should simulate timeouts', async () => {
      const manager = createMockPerformanceManager({ shouldTimeout: true });
      
      await expect(manager.withTimeout(async () => 'test'))
        .rejects.toThrow('Operation timed out');
    });
  });

  describe('Memory Monitor Mock', () => {
    it('should create a mock memory monitor', () => {
      const monitor = createMockMemoryMonitor();
      
      const usage = monitor.getCurrentUsage();
      expect(usage.rss).toBe(50 * 1024 * 1024);
      expect(usage.heapUsed).toBe(30 * 1024 * 1024);
      
      expect(monitor.isMemoryLimitExceeded()).toBe(false);
    });
  });

  describe('Error Handler Mock', () => {
    it('should create a mock error handler', () => {
      const handler = createMockErrorHandler();
      
      const error = new Error('Test error');
      const result = handler.handleError(error, 'test context');
      
      expect(result.code).toBe('MOCK_ERROR');
      expect(result.message).toBe('Test error');
      expect(result.data.context).toBe('test context');
    });
  });

  describe('Input Validator Mock', () => {
    it('should create a mock input validator', () => {
      const validator = createMockInputValidator();
      
      const validResult = validator.validateComponentDescription('Valid description');
      expect(validResult._tag).toBe('Right');
      
      const invalidResult = validator.validateComponentDescription('Hi');
      expect(invalidResult._tag).toBe('Left');
      
      const dangerousResult = validator.validateComponentDescription('<script>alert(1)</script>');
      expect(dangerousResult._tag).toBe('Left');
    });
  });

  describe('Complete Dependencies Mock', () => {
    it('should create complete mock dependencies', () => {
      const deps = createMockDependencies();
      
      expect(deps.logger).toBeDefined();
      expect(deps.config).toBeDefined();
      expect(deps.v0Client).toBeDefined();
      expect(deps.toolRegistry).toBeDefined();
      expect(deps.performanceManager).toBeDefined();
      expect(deps.memoryMonitor).toBeDefined();
      expect(deps.errorHandler).toBeDefined();
      expect(deps.inputValidator).toBeDefined();
    });
  });

  describe('Scenario Factories', () => {
    it('should create success scenario', () => {
      const deps = createSuccessScenario();
      expect(deps.logger).toBeDefined();
      expect(deps.config.apiKey).toContain('mock-api-key');
    });

    it('should create failure scenario', () => {
      const deps = createFailureScenario();
      expect(deps.v0Client).toBeDefined();
      expect(deps.toolRegistry).toBeDefined();
    });

    it('should create slow scenario', () => {
      const deps = createSlowScenario();
      expect(deps.v0Client).toBeDefined();
      expect(deps.toolRegistry).toBeDefined();
    });
  });
});