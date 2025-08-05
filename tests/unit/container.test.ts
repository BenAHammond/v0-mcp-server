import { describe, it, expect, beforeEach } from '@jest/globals';
import { createAppContainer, DIContainer } from '../../src/container';
import { ServerConfig } from '../../src/types/config-types';

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  describe('initialize', () => {
    it('should initialize with default services', () => {
      container.initialize();
      
      expect(container.get('errorHandler')).toBeDefined();
      expect(container.get('performanceManager')).toBeDefined();
      expect(container.get('inputValidator')).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const config: ServerConfig = {
        name: 'test-server',
        version: '1.0.0',
        apiKey: 'test-key',
        verbose: true
      };

      container.initialize({ config });
      
      const errorHandler = container.get('errorHandler');
      expect(errorHandler).toBeDefined();
    });
  });

  describe('service management', () => {
    beforeEach(() => {
      container.initialize();
    });

    it('should retrieve registered services', () => {
      const errorHandler = container.getErrorHandler();
      expect(errorHandler).toBeDefined();
      expect(errorHandler.handleError).toBeDefined();
    });

    it('should retrieve performance manager', () => {
      const perfManager = container.getPerformanceManager();
      expect(perfManager).toBeDefined();
      expect(perfManager.startOperation).toBeDefined();
    });

    it('should retrieve input validator', () => {
      const validator = container.getInputValidator();
      expect(validator).toBeDefined();
      expect(validator.validatePrompt).toBeDefined();
    });

    it('should return same instance for singleton services', () => {
      const handler1 = container.getErrorHandler();
      const handler2 = container.getErrorHandler();
      expect(handler1).toBe(handler2);
    });

    it('should throw error for unknown service', () => {
      expect(() => container.get('unknownService')).toThrow();
    });
  });
});

describe('createAppContainer', () => {
  it('should create and initialize container', () => {
    const container = createAppContainer();
    
    expect(container.getErrorHandler()).toBeDefined();
    expect(container.getPerformanceManager()).toBeDefined();
    expect(container.getInputValidator()).toBeDefined();
  });

  it('should accept configuration', () => {
    const config: ServerConfig = {
      name: 'test-server',
      version: '1.0.0',
      apiKey: 'test-key',
      verbose: false
    };

    const container = createAppContainer({ config });
    expect(container.getErrorHandler()).toBeDefined();
  });
});