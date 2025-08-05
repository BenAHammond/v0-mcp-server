/**
 * Error Response Transformer Tests
 */

import { describe, expect, test } from '@jest/globals';
import {
  categorizeError,
  transformError,
  transformErrorEither,
  createFieldValidationError,
  transformApiError,
  enhanceError,
  chainErrorTransform,
  mapErrorToMcp,
  ErrorCategory,
  toMcpError
} from '../../src/transformers/error-response.js';
import { extractErrorMessage } from '../../src/utils/error-utils.js';
import { isLeft, left, right } from '../../src/types/either.js';

describe('Error Response Transformer', () => {
  describe('extractErrorMessage', () => {
    test('extracts message from Error instance', () => {
      const error = new Error('Test error message');
      expect(extractErrorMessage(error)).toBe('Test error message');
    });

    test('returns string errors as-is', () => {
      expect(extractErrorMessage('String error')).toBe('String error');
    });

    test('extracts message from object with message property', () => {
      const error = { message: 'Object error message', code: 'TEST' };
      expect(extractErrorMessage(error)).toBe('Object error message');
    });

    test('returns default for unknown error types', () => {
      expect(extractErrorMessage(null)).toBe('Unknown error occurred');
      expect(extractErrorMessage(undefined)).toBe('Unknown error occurred');
      expect(extractErrorMessage(123)).toBe('Unknown error occurred');
    });
  });

  describe('categorizeError', () => {
    test('categorizes authentication errors', () => {
      const errors = [
        'Invalid API key',
        'Error: unauthorized access',
        'HTTP 401 Unauthorized',
        'Authentication failed'
      ];

      errors.forEach(error => {
        const result = categorizeError(error);
        expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
        expect(result.code).toBe('INVALID_API_KEY');
        expect(result.retryable).toBe(false);
      });
    });

    test('categorizes rate limit errors', () => {
      const errors = [
        'Rate limit exceeded',
        'Error 429: Too many requests',
        'API quota reached',
        'Request throttled'
      ];

      errors.forEach(error => {
        const result = categorizeError(error);
        expect(result.category).toBe(ErrorCategory.RATE_LIMIT);
        expect(result.code).toBe('RATE_LIMITED');
        expect(result.retryable).toBe(true);
        expect(result.metadata?.retryAfter).toBeDefined();
      });
    });

    test('categorizes network errors', () => {
      const connectionErrors = [
        'ECONNREFUSED',
        'ETIMEDOUT',
        'Network timeout',
        'Connection refused'
      ];

      connectionErrors.forEach(error => {
        const result = categorizeError(error);
        expect(result.category).toBe(ErrorCategory.NETWORK);
        expect(result.code).toBe('NETWORK_ERROR');
        expect(result.retryable).toBe(true);
      });

      const dnsErrors = ['getaddrinfo ENOTFOUND', 'DNS resolution failed'];
      dnsErrors.forEach(error => {
        const result = categorizeError(error);
        expect(result.code).toBe('DNS_ERROR');
      });

      const sslErrors = ['SSL certificate error', 'TLS handshake failed'];
      sslErrors.forEach(error => {
        const result = categorizeError(error);
        expect(result.code).toBe('SSL_ERROR');
      });
    });

    test('categorizes validation errors', () => {
      const errors = [
        'Validation failed',
        'Invalid input provided',
        'Field "name" is required',
        'Missing parameter: description',
        new TypeError('Expected string, got number')
      ];

      errors.forEach(error => {
        const result = categorizeError(error);
        expect(result.category).toBe(ErrorCategory.VALIDATION);
        expect([
          'VALIDATION_ERROR',
          'TYPE_ERROR'
        ]).toContain(result.code);
        expect(result.retryable).toBe(false);
      });
    });

    test('categorizes not found errors', () => {
      const errors = [
        'Chat not found',
        'Error 404: Resource not found',
        'Project does not exist'
      ];

      errors.forEach(error => {
        const result = categorizeError(error);
        expect(result.category).toBe(ErrorCategory.NOT_FOUND);
        expect([
          'CHAT_NOT_FOUND',
          'PROJECT_NOT_FOUND',
          'NOT_FOUND'
        ]).toContain(result.code);
        expect(result.retryable).toBe(false);
      });
    });

    test('categorizes server errors', () => {
      const errors = [
        'Error 500: Internal Server Error',
        'Service unavailable (503)',
        'Bad gateway (502)'
      ];

      errors.forEach(error => {
        const result = categorizeError(error);
        expect(result.category).toBe(ErrorCategory.SERVER_ERROR);
        expect(result.code).toBe('V0_SERVER_ERROR');
        expect(result.retryable).toBe(true);
      });
    });

    test('categorizes unknown errors', () => {
      const result = categorizeError('Some random error');
      expect(result.category).toBe(ErrorCategory.UNKNOWN);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.retryable).toBe(true);
    });
  });

  describe('transformError', () => {
    test('transforms error to McpError format', () => {
      const error = new Error('API key invalid');
      const context = { operation: 'generate_component', chatId: '123' };
      
      const result = transformError(error, context);
      
      expect(result).toMatchObject({
        code: 'INVALID_API_KEY',
        message: 'Invalid or missing v0.dev API key',
        data: expect.objectContaining({
          retryable: false,
          category: ErrorCategory.AUTHENTICATION,
          operation: 'generate_component',
          chatId: '123'
        })
      });
    });

    test('includes retry information for rate limits', () => {
      const error = 'Rate limit exceeded. Retry after 30 seconds';
      const result = transformError(error);
      
      expect(result.data?.retryAfter).toBe(30);
      expect(result.data?.suggestion).toContain('30 seconds');
    });
  });

  describe('transformErrorEither', () => {
    test('returns Left with McpError', () => {
      const error = new Error('Network timeout');
      const result = transformErrorEither(error);
      
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toMatchObject({
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to v0.dev API'
        });
      }
    });
  });

  describe('createFieldValidationError', () => {
    test('creates validation error for field', () => {
      const result = createFieldValidationError(
        'description',
        'must be at least 10 characters'
      );
      
      expect(result).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid description: must be at least 10 characters',
        data: expect.objectContaining({
          field: 'description',
          retryable: false,
          category: ErrorCategory.VALIDATION
        })
      });
    });

    test('uses custom suggestion if provided', () => {
      const result = createFieldValidationError(
        'url',
        'invalid format',
        'Use https://example.com format'
      );
      
      expect(result.data?.suggestion).toBe('Use https://example.com format');
    });
  });

  describe('transformApiError', () => {
    test('transforms 401 to authentication error', () => {
      const result = transformApiError(401, 'Unauthorized');
      
      expect(result.code).toBe('INVALID_API_KEY');
      expect(result.data?.statusCode).toBe(401);
    });

    test('transforms 429 to rate limit error', () => {
      const result = transformApiError(429, 'Too Many Requests');
      
      expect(result.code).toBe('RATE_LIMITED');
      expect(result.data?.statusCode).toBe(429);
    });

    test('transforms 404 to not found error', () => {
      const result = transformApiError(404, 'Chat not found');
      
      expect(result.code).toBe('CHAT_NOT_FOUND');
      expect(result.data?.statusCode).toBe(404);
    });

    test('transforms 5xx to server error', () => {
      const result = transformApiError(503, 'Service Unavailable');
      
      expect(result.code).toBe('V0_SERVER_ERROR');
      expect(result.data?.statusCode).toBe(503);
    });
  });

  describe('enhanceError', () => {
    test('adds context to existing error', () => {
      const error = {
        code: 'TEST_ERROR',
        message: 'Test message',
        data: { retryable: false }
      };
      
      const enhanced = enhanceError(error, {
        operation: 'test_op',
        userId: '123'
      });
      
      expect(enhanced.data).toMatchObject({
        retryable: false,
        operation: 'test_op',
        userId: '123',
        timestamp: expect.any(String)
      });
    });
  });

  describe('chainErrorTransform', () => {
    test('transforms Left errors to McpError', () => {
      const error = left(new Error('Validation failed'));
      const result = chainErrorTransform(error, { tool: 'test' });
      
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toMatchObject({
          code: 'VALIDATION_ERROR',
          data: expect.objectContaining({ tool: 'test' })
        });
      }
    });

    test('passes through Right values unchanged', () => {
      const success = right({ data: 'test' });
      const result = chainErrorTransform(success);
      
      expect(isLeft(result)).toBe(false);
      if (!isLeft(result)) {
        expect(result.right).toEqual({ data: 'test' });
      }
    });
  });

  describe('mapErrorToMcp', () => {
    test('creates error mapper function', () => {
      const mapper = mapErrorToMcp({ operation: 'test' });
      const error = left('Network error');
      
      const result = mapper(error);
      
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toMatchObject({
          code: 'NETWORK_ERROR',
          data: expect.objectContaining({ operation: 'test' })
        });
      }
    });
  });

  describe('retry after extraction', () => {
    test('extracts retry after from various formats', () => {
      const testCases = [
        { error: 'Retry after 45 seconds', expected: 45 },
        { error: 'Please wait 120 seconds', expected: 120 },
        { error: 'Retry-After: 90', expected: 90 },
        { error: 'Rate limited', expected: 60 } // default
      ];

      testCases.forEach(({ error, expected }) => {
        const result = categorizeError(error);
        if (result.category === ErrorCategory.RATE_LIMIT) {
          expect(result.metadata?.retryAfter).toBe(expected);
        }
      });
    });
  });

  describe('field extraction', () => {
    test('extracts field names from validation errors', () => {
      const testCases = [
        { error: 'Field "name" is required', expected: 'name' },
        { error: 'Parameter: description missing', expected: 'description' },
        { error: '"chatId" is required', expected: 'chatId' },
        { error: 'Missing projectId', expected: 'projectId' }
      ];

      testCases.forEach(({ error, expected }) => {
        const result = categorizeError(error);
        if (result.category === ErrorCategory.VALIDATION) {
          expect(result.metadata?.field).toBe(expected);
        }
      });
    });
  });
});