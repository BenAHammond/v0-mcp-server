/**
 * Console Logger Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createConsoleLogger,
  createSimpleConsoleLogger,
  createDevConsoleLogger,
  createProdConsoleLogger,
  createJsonFormatter,
  createCompactFormatter,
  type ConsoleInterface
} from '../../src/logging/console.js';
import { LogLevel } from '../../src/logging/types.js';

describe('Console Logger', () => {
  let mockConsole: ConsoleInterface;
  let logCalls: Array<{ method: string; args: any[] }>;

  beforeEach(() => {
    logCalls = [];
    mockConsole = {
      log: jest.fn((...args) => logCalls.push({ method: 'log', args })),
      error: jest.fn((...args) => logCalls.push({ method: 'error', args })),
      warn: jest.fn((...args) => logCalls.push({ method: 'warn', args })),
      info: jest.fn((...args) => logCalls.push({ method: 'info', args })),
      debug: jest.fn((...args) => logCalls.push({ method: 'debug', args })),
      trace: jest.fn((...args) => logCalls.push({ method: 'trace', args }))
    };
  });

  describe('createConsoleLogger', () => {
    it('should create a logger with basic configuration', () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.INFO,
        console: mockConsole
      });

      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it('should respect log level filtering', () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.WARN,
        console: mockConsole
      });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(logCalls).toHaveLength(2);
      expect(logCalls[0].method).toBe('warn');
      expect(logCalls[1].method).toBe('error');
    });

    it('should format messages with timestamp and level', () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.INFO,
        console: mockConsole,
        useColors: false
      });

      logger.info('Test message');

      expect(logCalls).toHaveLength(1);
      const message = logCalls[0].args[0];
      expect(message).toContain('[INFO ]');
      expect(message).toContain('Test message');
      expect(message).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should include structured data', () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.INFO,
        console: mockConsole,
        useColors: false
      });

      logger.info('User action', { userId: '123', action: 'login' });

      expect(logCalls).toHaveLength(1);
      const message = logCalls[0].args[0];
      expect(message).toContain('userId');
      expect(message).toContain('123');
      expect(message).toContain('action');
      expect(message).toContain('login');
    });

    it('should format errors with stack traces', () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.ERROR,
        console: mockConsole,
        useColors: false,
        includeStackTrace: true
      });

      const error = new Error('Test error');
      logger.error('Operation failed', error);

      expect(logCalls).toHaveLength(1);
      const message = logCalls[0].args[0];
      expect(message).toContain('Operation failed');
      expect(message).toContain('Error: Test error');
      expect(message).toContain('at '); // Stack trace
    });

    it('should use stderr for errors when configured', () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.INFO,
        console: mockConsole,
        useStderr: true
      });

      logger.info('Info message');
      logger.error('Error message');

      expect(logCalls[0].method).toBe('info');
      expect(logCalls[1].method).toBe('error');
    });
  });

  describe('child loggers', () => {
    it('should create child logger with additional context', () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.INFO,
        console: mockConsole,
        useColors: false
      });

      const childLogger = logger.child({ 
        source: { module: 'auth' },
        correlationId: 'req-123'
      });

      childLogger.info('Login attempt');

      expect(logCalls).toHaveLength(1);
      const message = logCalls[0].args[0];
      expect(message).toContain('req-123');
    });

    it('should add tags with withTags', () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.INFO,
        console: mockConsole,
        useColors: false
      });

      const taggedLogger = logger.withTags('api', 'v2');
      taggedLogger.info('API call');

      expect(logCalls).toHaveLength(1);
      const message = logCalls[0].args[0];
      expect(message).toContain('[api,v2]');
    });

    it('should set correlation ID with withCorrelationId', () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.INFO,
        console: mockConsole,
        useColors: false
      });

      const correlatedLogger = logger.withCorrelationId('trace-456');
      correlatedLogger.info('Processing request');

      expect(logCalls).toHaveLength(1);
      const message = logCalls[0].args[0];
      expect(message).toContain('[trace-456]');
    });
  });

  describe('timing methods', () => {
    it('should measure sync operation duration', () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.DEBUG,
        console: mockConsole
      });

      const result = logger.time('compute', () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toBe(499500);
      expect(logCalls).toHaveLength(1);
      expect(logCalls[0].args[0]).toContain('compute completed');
    });

    it('should measure async operation duration', async () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.DEBUG,
        console: mockConsole
      });

      const result = await logger.timeAsync('fetch', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'data';
      });

      expect(result).toBe('data');
      expect(logCalls).toHaveLength(1);
      expect(logCalls[0].args[0]).toContain('fetch completed');
    });

    it('should log errors in timed operations', () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.DEBUG,
        console: mockConsole
      });

      expect(() => {
        logger.time('failing', () => {
          throw new Error('Operation failed');
        });
      }).toThrow('Operation failed');

      expect(logCalls).toHaveLength(1);
      expect(logCalls[0].method).toBe('error');
      expect(logCalls[0].args[0]).toContain('failing failed');
    });
  });

  describe('formatters', () => {
    it('should use JSON formatter', () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.INFO,
        console: mockConsole,
        formatter: createJsonFormatter()
      });

      logger.info('JSON log', { user: 'test' });

      expect(logCalls).toHaveLength(1);
      const json = JSON.parse(logCalls[0].args[0]);
      expect(json.level).toBe('INFO');
      expect(json.message).toBe('JSON log');
      expect(json.data).toEqual({ user: 'test' });
      expect(json.timestamp).toBeDefined();
    });

    it('should use compact formatter', () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.INFO,
        console: mockConsole,
        formatter: createCompactFormatter(false)
      });

      logger.info('Compact log', { id: 123 });

      expect(logCalls).toHaveLength(1);
      const message = logCalls[0].args[0];
      expect(message).toMatch(/^\d{2}:\d{2}:\d{2} I Compact log {"id":123}$/);
    });
  });

  describe('utility methods', () => {
    it('should check if level is enabled', () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.WARN,
        console: mockConsole
      });

      expect(logger.isLevelEnabled(LogLevel.DEBUG)).toBe(false);
      expect(logger.isLevelEnabled(LogLevel.INFO)).toBe(false);
      expect(logger.isLevelEnabled(LogLevel.WARN)).toBe(true);
      expect(logger.isLevelEnabled(LogLevel.ERROR)).toBe(true);
    });

    it('should handle flush and close', async () => {
      const logger = createConsoleLogger({
        type: 'console',
        level: LogLevel.INFO,
        console: mockConsole
      });

      await expect(logger.flush()).resolves.toBeUndefined();
      await expect(logger.close()).resolves.toBeUndefined();
    });
  });

  describe('preset loggers', () => {
    it('should create simple console logger', () => {
      const logger = createSimpleConsoleLogger(LogLevel.WARN, false);
      expect(logger).toBeDefined();
      expect(logger.isLevelEnabled(LogLevel.WARN)).toBe(true);
    });

    it('should create dev console logger', () => {
      const logger = createDevConsoleLogger();
      expect(logger).toBeDefined();
      expect(logger.isLevelEnabled(LogLevel.TRACE)).toBe(true);
    });

    it('should create prod console logger', () => {
      const logger = createProdConsoleLogger();
      expect(logger).toBeDefined();
      expect(logger.isLevelEnabled(LogLevel.INFO)).toBe(true);
    });
  });
});