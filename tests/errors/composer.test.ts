/**
 * Tests for Error Composer
 */

import {
  composeErrorHandlers,
  composePrioritizedHandlers,
  composeMiddleware,
  withRetry,
  when,
  mapError,
  withContext,
  withFallback,
  withLogging,
  withCache,
  createDefaultErrorHandler,
  forErrorType,
  forPattern,
  forHttpStatus,
  timestampMiddleware,
  requestIdMiddleware,
  normalizeErrorMiddleware,
  createStandardErrorPipeline,
  createPrioritizedErrorSystem,
  type ErrorHandlerFn,
  type PrioritizedErrorHandler,
  type ErrorMiddleware
} from '../../src/errors/composer.js';
import { McpError, ErrorContext } from '../../src/types/error-types.js';

describe('Error Composer', () => {
  const mockContext: ErrorContext = {
    operation: 'test',
    toolName: 'test-tool'
  };

  describe('composeErrorHandlers', () => {
    it('should try handlers in sequence until one handles the error', () => {
      const handler1: ErrorHandlerFn = jest.fn(() => null);
      const handler2: ErrorHandlerFn = jest.fn(() => ({
        code: 'HANDLED',
        message: 'Handled by second'
      }));
      const handler3: ErrorHandlerFn = jest.fn(() => ({
        code: 'NOT_REACHED',
        message: 'Should not reach'
      }));

      const composed = composeErrorHandlers(handler1, handler2, handler3);
      const result = composed(new Error('test'), mockContext);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();
      expect(result?.code).toBe('HANDLED');
    });

    it('should return null if no handler handles the error', () => {
      const handler1: ErrorHandlerFn = () => null;
      const handler2: ErrorHandlerFn = () => null;

      const composed = composeErrorHandlers(handler1, handler2);
      const result = composed(new Error('test'), mockContext);

      expect(result).toBeNull();
    });
  });

  describe('composePrioritizedHandlers', () => {
    it('should handle errors by priority order', () => {
      const handlers: PrioritizedErrorHandler[] = [
        {
          priority: 10,
          handler: () => null,
          name: 'low-priority'
        },
        {
          priority: 100,
          handler: () => ({ code: 'HIGH_PRIORITY', message: 'High priority handled' }),
          name: 'high-priority'
        },
        {
          priority: 50,
          handler: () => ({ code: 'MID_PRIORITY', message: 'Mid priority handled' }),
          name: 'mid-priority'
        }
      ];

      const composed = composePrioritizedHandlers(handlers);
      const result = composed(new Error('test'), mockContext);

      expect(result?.code).toBe('HIGH_PRIORITY');
    });
  });

  describe('composeMiddleware', () => {
    it('should apply middleware in correct order', () => {
      const order: string[] = [];

      const middleware1: ErrorMiddleware = (error, context, next) => {
        order.push('middleware1-before');
        const result = next(error, context);
        order.push('middleware1-after');
        return result;
      };

      const middleware2: ErrorMiddleware = (error, context, next) => {
        order.push('middleware2-before');
        const result = next(error, context);
        order.push('middleware2-after');
        return result;
      };

      const finalHandler: ErrorHandlerFn = () => {
        order.push('final');
        return { code: 'FINAL', message: 'Final handler' };
      };

      const composed = composeMiddleware([middleware1, middleware2], finalHandler);
      composed(new Error('test'), mockContext);

      expect(order).toEqual([
        'middleware1-before',
        'middleware2-before',
        'final',
        'middleware2-after',
        'middleware1-after'
      ]);
    });

    it('should allow middleware to short-circuit', () => {
      const middleware: ErrorMiddleware = (error, context, next) => {
        if (error instanceof TypeError) {
          return { code: 'TYPE_ERROR', message: 'Caught by middleware' };
        }
        return next(error, context);
      };

      const finalHandler: ErrorHandlerFn = () => ({
        code: 'FINAL',
        message: 'Final handler'
      });

      const composed = composeMiddleware([middleware], finalHandler);

      const typeResult = composed(new TypeError('test'), mockContext);
      expect(typeResult?.code).toBe('TYPE_ERROR');

      const otherResult = composed(new Error('test'), mockContext);
      expect(otherResult?.code).toBe('FINAL');
    });
  });

  describe('withRetry', () => {
    it('should retry on retryable errors', () => {
      let attempts = 0;
      const handler: ErrorHandlerFn = (error, context) => {
        attempts++;
        if (attempts < 3) {
          return {
            code: 'RETRYABLE',
            message: 'Retry me',
            data: { retryable: true }
          };
        }
        return {
          code: 'SUCCESS',
          message: 'Finally worked'
        };
      };

      const retryHandler = withRetry(handler, {
        maxAttempts: 3,
        delay: 10
      });

      const result = retryHandler(new Error('test'), mockContext);
      expect(attempts).toBe(3);
      expect(result?.code).toBe('SUCCESS');
    });

    it('should not retry non-retryable errors', () => {
      let attempts = 0;
      const handler: ErrorHandlerFn = () => {
        attempts++;
        return {
          code: 'NOT_RETRYABLE',
          message: 'Do not retry',
          data: { retryable: false }
        };
      };

      const retryHandler = withRetry(handler, {
        maxAttempts: 3,
        delay: 10
      });

      const result = retryHandler(new Error('test'), mockContext);
      expect(attempts).toBe(1);
      expect(result?.code).toBe('NOT_RETRYABLE');
    });

    it('should use custom retry logic', () => {
      let attempts = 0;
      const handler: ErrorHandlerFn = () => {
        attempts++;
        return {
          code: 'ERROR',
          message: 'Error',
          data: { retryable: true }
        };
      };

      const retryHandler = withRetry(handler, {
        maxAttempts: 5,
        delay: 10,
        shouldRetry: (error, attempt) => attempt <= 2
      });

      retryHandler(new Error('test'), mockContext);
      expect(attempts).toBe(2);
    });
  });

  describe('when', () => {
    it('should only handle errors matching condition', () => {
      const handler = when(
        (error) => error instanceof TypeError,
        () => ({ code: 'TYPE_ERROR', message: 'Type error handled' })
      );

      const typeResult = handler(new TypeError('test'), mockContext);
      expect(typeResult?.code).toBe('TYPE_ERROR');

      const otherResult = handler(new Error('test'), mockContext);
      expect(otherResult).toBeNull();
    });
  });

  describe('mapError', () => {
    it('should transform error before handling', () => {
      const handler = mapError(
        (error) => {
          if (error instanceof Error) {
            return new Error(`Transformed: ${error.message}`);
          }
          return error;
        },
        (error) => ({
          code: 'TRANSFORMED',
          message: error instanceof Error ? error.message : 'Unknown'
        })
      );

      const result = handler(new Error('original'), mockContext);
      expect(result?.message).toBe('Transformed: original');
    });
  });

  describe('withContext', () => {
    it('should enhance context before handling', () => {
      let capturedContext: ErrorContext | null = null;

      const handler = withContext(
        (context) => ({
          ...context,
          enhanced: true,
          timestamp: new Date('2024-01-01')
        }),
        (error, context) => {
          capturedContext = context;
          return { code: 'ENHANCED', message: 'Enhanced' };
        }
      );

      handler(new Error('test'), mockContext);
      expect(capturedContext).toMatchObject({
        operation: 'test',
        toolName: 'test-tool',
        enhanced: true,
        timestamp: new Date('2024-01-01')
      });
    });
  });

  describe('withFallback', () => {
    it('should use fallback when primary returns null', () => {
      const primary: ErrorHandlerFn = () => null;
      const fallback: ErrorHandlerFn = () => ({
        code: 'FALLBACK',
        message: 'Fallback handled'
      });

      const handler = withFallback(primary, fallback);
      const result = handler(new Error('test'), mockContext);

      expect(result?.code).toBe('FALLBACK');
    });

    it('should not use fallback when primary handles error', () => {
      const primary: ErrorHandlerFn = () => ({
        code: 'PRIMARY',
        message: 'Primary handled'
      });
      const fallback: ErrorHandlerFn = () => ({
        code: 'FALLBACK',
        message: 'Fallback handled'
      });

      const handler = withFallback(primary, fallback);
      const result = handler(new Error('test'), mockContext);

      expect(result?.code).toBe('PRIMARY');
    });
  });

  describe('withLogging', () => {
    it('should log errors and results', () => {
      const logs: any[] = [];
      const logger = (error: unknown, context: ErrorContext, result: McpError | null) => {
        logs.push({ error, context, result });
      };

      const handler = withLogging(
        logger,
        () => ({ code: 'LOGGED', message: 'Logged error' })
      );

      const error = new Error('test');
      const result = handler(error, mockContext);

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        error,
        context: mockContext,
        result: { code: 'LOGGED', message: 'Logged error' }
      });
    });
  });

  describe('withCache', () => {
    it('should cache error responses', () => {
      let handlerCalls = 0;
      const handler = withCache(
        () => {
          handlerCalls++;
          return { code: 'CACHED', message: `Call ${handlerCalls}` };
        },
        (error, context) => `${error}:${context.operation}`
      );

      const error = new Error('test');

      // First call
      const result1 = handler(error, mockContext);
      expect(result1?.message).toBe('Call 1');
      expect(handlerCalls).toBe(1);

      // Second call with same error - should use cache
      const result2 = handler(error, mockContext);
      expect(result2?.message).toBe('Call 1');
      expect(handlerCalls).toBe(1);

      // Different error - should not use cache
      const result3 = handler(new Error('different'), mockContext);
      expect(result3?.message).toBe('Call 2');
      expect(handlerCalls).toBe(2);
    });
  });

  describe('createDefaultErrorHandler', () => {
    it('should handle any error with default response', () => {
      const handler = createDefaultErrorHandler();
      const result = handler(new Error('test error'), mockContext);

      expect(result).toMatchObject({
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        data: {
          originalMessage: 'test error',
          context: 'test'
        }
      });
    });

    it('should handle string errors', () => {
      const handler = createDefaultErrorHandler();
      const result = handler('string error', mockContext);

      expect(result?.data?.originalMessage).toBe('string error');
    });

    it('should handle unknown error types', () => {
      const handler = createDefaultErrorHandler();
      const result = handler({ weird: 'object' }, mockContext);

      expect(result?.data?.originalMessage).toBe('Unknown error');
    });
  });

  describe('forErrorType', () => {
    class CustomError extends Error {
      constructor(message: string, public code: string) {
        super(message);
      }
    }

    it('should handle specific error types', () => {
      const handler = forErrorType(
        CustomError,
        (error) => ({
          code: error.code,
          message: error.message
        })
      );

      const result = handler(new CustomError('custom', 'CUSTOM_CODE'), mockContext);
      expect(result?.code).toBe('CUSTOM_CODE');

      const otherResult = handler(new Error('regular'), mockContext);
      expect(otherResult).toBeNull();
    });
  });

  describe('forPattern', () => {
    it('should handle errors matching pattern', () => {
      const handler = forPattern(
        /API key.*invalid/i,
        'INVALID_API_KEY',
        'Your API key is invalid'
      );

      const result = handler(new Error('API key is invalid'), mockContext);
      expect(result?.code).toBe('INVALID_API_KEY');

      const noMatch = handler(new Error('Something else'), mockContext);
      expect(noMatch).toBeNull();
    });

    it('should extract data from pattern match', () => {
      const handler = forPattern(
        /status.*?(\d+)/i,
        'HTTP_ERROR',
        'HTTP error occurred',
        (match) => ({ statusCode: match ? parseInt(match[1]) : null })
      );

      const result = handler(new Error('Request failed with status 404'), mockContext);
      expect(result?.data?.statusCode).toBe(404);
    });
  });

  describe('forHttpStatus', () => {
    it('should handle HTTP status errors', () => {
      const handler = forHttpStatus(404, 'NOT_FOUND', 'Resource not found');

      const result = handler(new Error('Error: 404 Not Found'), mockContext);
      expect(result?.code).toBe('NOT_FOUND');
      expect(result?.data?.statusCode).toBe(404);
      expect(result?.data?.retryable).toBe(false);

      const serverError = forHttpStatus(500, 'SERVER_ERROR', 'Server error');
      const serverResult = serverError(new Error('500 Internal Server Error'), mockContext);
      expect(serverResult?.data?.retryable).toBe(true);
    });
  });

  describe('middleware functions', () => {
    it('timestampMiddleware should add timestamp', () => {
      let capturedContext: ErrorContext | null = null;
      const next: ErrorHandlerFn = (error, context) => {
        capturedContext = context;
        return null;
      };

      timestampMiddleware(new Error('test'), {}, next);
      expect(capturedContext?.timestamp).toBeInstanceOf(Date);
    });

    it('requestIdMiddleware should add request ID', () => {
      let capturedContext: ErrorContext | null = null;
      const next: ErrorHandlerFn = (error, context) => {
        capturedContext = context;
        return null;
      };

      requestIdMiddleware(new Error('test'), {}, next);
      expect(capturedContext?.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('normalizeErrorMiddleware should convert to Error instance', () => {
      let capturedError: unknown = null;
      const next: ErrorHandlerFn = (error, context) => {
        capturedError = error;
        return null;
      };

      normalizeErrorMiddleware('string error', {}, next);
      expect(capturedError).toBeInstanceOf(Error);
      expect((capturedError as Error).message).toBe('string error');
    });
  });

  describe('createStandardErrorPipeline', () => {
    it('should create pipeline with standard middleware', () => {
      const handler: ErrorHandlerFn = (error, context) => {
        return {
          code: 'HANDLED',
          message: 'Handled',
          data: {
            hasTimestamp: !!context.timestamp,
            hasRequestId: !!context.requestId,
            errorType: error.constructor.name
          }
        };
      };

      const pipeline = createStandardErrorPipeline(handler);
      const result = pipeline('string error', {});

      expect(result?.data?.hasTimestamp).toBe(true);
      expect(result?.data?.hasRequestId).toBe(true);
      expect(result?.data?.errorType).toBe('Error');
    });
  });

  describe('createPrioritizedErrorSystem', () => {
    it('should create system with prioritized handlers and fallback', () => {
      const handlers: PrioritizedErrorHandler[] = [
        {
          priority: 100,
          handler: when(
            (error) => error instanceof TypeError,
            () => ({ code: 'TYPE_ERROR', message: 'Type error' })
          )
        },
        {
          priority: 50,
          handler: when(
            (error) => error instanceof RangeError,
            () => ({ code: 'RANGE_ERROR', message: 'Range error' })
          )
        }
      ];

      const system = createPrioritizedErrorSystem(handlers);

      const typeResult = system(new TypeError('test'), mockContext);
      expect(typeResult?.code).toBe('TYPE_ERROR');

      const rangeResult = system(new RangeError('test'), mockContext);
      expect(rangeResult?.code).toBe('RANGE_ERROR');

      const otherResult = system(new Error('test'), mockContext);
      expect(otherResult?.code).toBe('UNKNOWN_ERROR');
    });
  });
});