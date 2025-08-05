/**
 * Integration tests for v0 SDK error format handling
 * 
 * Tests that our error categorization system works with realistic
 * error formats that might come from the v0 SDK and HTTP clients.
 */

import { describe, test, expect } from '@jest/globals';
import { categorizeError, transformApiError, ErrorCategory } from '../../src/transformers/error-response.js';
import { extractErrorMessage } from '../../src/utils/error-utils.js';

describe('v0 SDK Error Format Integration', () => {
  describe('HTTP Status Code Error Handling', () => {
    test('should categorize 404 errors correctly', () => {
      const mockV0Error = new Error('Request failed with status code 404');
      (mockV0Error as any).status = 404;
      (mockV0Error as any).response = { status: 404, statusText: 'Not Found' };
      
      const categorized = categorizeError(mockV0Error);
      
      expect(categorized.code).toBe('NOT_FOUND');
      expect(categorized.category).toBe(ErrorCategory.NOT_FOUND);
      expect(categorized.retryable).toBe(false);
      expect(categorized.metadata?.statusCode).toBe(404);
    });

    test('should categorize 404 chat errors specifically', () => {
      const mockV0Error = new Error('Request failed with status code 404');
      (mockV0Error as any).status = 404;
      (mockV0Error as any).response = { 
        status: 404, 
        statusText: 'Not Found',
        data: { message: 'Chat not found' }
      };
      
      const categorized = categorizeError(mockV0Error);
      
      expect(categorized.code).toBe('CHAT_NOT_FOUND');
      expect(categorized.message).toBe('The specified chat was not found');
      expect(categorized.suggestion).toBe('Create a new component instead of iterating');
    });

    test('should categorize 401 errors correctly', () => {
      const mockV0Error = new Error('Request failed with status code 401');
      (mockV0Error as any).status = 401;
      (mockV0Error as any).response = { status: 401, statusText: 'Unauthorized' };
      
      const categorized = categorizeError(mockV0Error);
      
      expect(categorized.code).toBe('INVALID_API_KEY');
      expect(categorized.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(categorized.retryable).toBe(false);
      expect(categorized.suggestion).toContain('v0.dev/chat/settings/keys');
    });

    test('should categorize 429 rate limit errors correctly', () => {
      const mockV0Error = new Error('Request failed with status code 429');
      (mockV0Error as any).status = 429;
      (mockV0Error as any).response = { status: 429, statusText: 'Too Many Requests' };
      
      const categorized = categorizeError(mockV0Error);
      
      expect(categorized.code).toBe('RATE_LIMITED');
      expect(categorized.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(categorized.retryable).toBe(true);
      expect(categorized.metadata?.retryAfter).toBeGreaterThan(0);
    });

    test('should categorize 400 validation errors correctly', () => {
      const mockV0Error = new Error('Request failed with status code 400');
      (mockV0Error as any).status = 400;
      (mockV0Error as any).response = { 
        status: 400, 
        statusText: 'Bad Request',
        data: { message: 'Invalid parameter: chatId is required' }
      };
      
      const categorized = categorizeError(mockV0Error);
      
      expect(categorized.code).toBe('VALIDATION_ERROR');
      expect(categorized.category).toBe(ErrorCategory.VALIDATION);
      expect(categorized.retryable).toBe(false);
    });

    test('should categorize 500 server errors correctly', () => {
      const mockV0Error = new Error('Request failed with status code 500');
      (mockV0Error as any).status = 500;
      (mockV0Error as any).response = { status: 500, statusText: 'Internal Server Error' };
      
      const categorized = categorizeError(mockV0Error);
      
      expect(categorized.code).toBe('V0_SERVER_ERROR');
      expect(categorized.category).toBe(ErrorCategory.SERVER_ERROR);
      expect(categorized.retryable).toBe(true);
    });
  });

  describe('Axios-style Error Handling', () => {
    test('should handle axios error structure', () => {
      const axiosError = {
        message: 'Request failed with status code 404',
        name: 'AxiosError',
        response: {
          status: 404,
          statusText: 'Not Found',
          data: {
            error: 'Chat not found',
            message: 'The specified chat does not exist'
          }
        },
        request: {},
        config: {}
      };
      
      const categorized = categorizeError(axiosError);
      
      expect(categorized.code).toBe('CHAT_NOT_FOUND');
      expect(categorized.category).toBe(ErrorCategory.NOT_FOUND);
    });

    test('should extract message from axios error response data', () => {
      const axiosError = {
        message: 'Request failed with status code 401',
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: {
            message: 'Invalid API key provided'
          }
        }
      };
      
      const message = extractErrorMessage(axiosError);
      expect(message).toBe('Invalid API key provided');
    });
  });

  describe('Pattern-based Fallback Handling', () => {
    test('should handle text-based error messages', () => {
      const textError = 'Request failed with status code 404 - Chat not found';
      
      const categorized = categorizeError(textError);
      
      expect(categorized.code).toBe('CHAT_NOT_FOUND');
      expect(categorized.category).toBe(ErrorCategory.NOT_FOUND);
    });

    test('should handle legacy error patterns', () => {
      const legacyError = new Error('unauthorized access - invalid API key');
      
      const categorized = categorizeError(legacyError);
      
      expect(categorized.code).toBe('INVALID_API_KEY');
      expect(categorized.category).toBe(ErrorCategory.AUTHENTICATION);
    });
  });

  describe('Error Message Extraction', () => {
    test('should extract from nested response structures', () => {
      const complexError = {
        response: {
          data: {
            message: 'Custom error message from API'
          },
          status: 400,
          statusText: 'Bad Request'
        }
      };
      
      const message = extractErrorMessage(complexError);
      expect(message).toBe('Custom error message from API');
    });

    test('should fallback to status code message when no statusText', () => {
      const statusOnlyError = {
        status: 429
        // No statusText provided
      };
      
      const message = extractErrorMessage(statusOnlyError);
      expect(message).toBe('Request failed with status code 429');
    });

    test('should handle statusText fallback', () => {
      const statusTextError = {
        statusText: 'Service Unavailable',
        status: 503
      };
      
      const message = extractErrorMessage(statusTextError);
      expect(message).toBe('Service Unavailable');
    });
  });

  describe('transformApiError Function', () => {
    test('should create proper error for 404 with context', () => {
      const mcpError = transformApiError(404, 'Chat not found', { chatId: 'invalid-id' });
      
      expect(mcpError.code).toBe('CHAT_NOT_FOUND');
      expect(mcpError.data.retryable).toBe(false);
      expect(mcpError.data.statusCode).toBe(404);
    });

    test('should create proper error for 401', () => {
      const mcpError = transformApiError(401, 'Unauthorized');
      
      expect(mcpError.code).toBe('INVALID_API_KEY');
      expect(mcpError.data.retryable).toBe(false);
      expect(mcpError.data.suggestion).toContain('v0.dev/chat/settings/keys');
    });
  });

  describe('Edge Cases', () => {
    test('should handle malformed error objects', () => {
      const malformedError = {
        someRandomProperty: 'random value',
        status: 404
      };
      
      const categorized = categorizeError(malformedError);
      
      expect(categorized.code).toBe('NOT_FOUND');
      expect(categorized.category).toBe(ErrorCategory.NOT_FOUND);
    });

    test('should handle null/undefined errors gracefully', () => {
      const categorizedNull = categorizeError(null);
      const categorizedUndefined = categorizeError(undefined);
      
      expect(categorizedNull.code).toBe('UNKNOWN_ERROR');
      expect(categorizedUndefined.code).toBe('UNKNOWN_ERROR');
    });

    test('should handle non-standard status code formats', () => {
      const statusCodeError = {
        statusCode: 404, // Some libraries use statusCode instead of status
        message: 'Not found'
      };
      
      const categorized = categorizeError(statusCodeError);
      
      expect(categorized.code).toBe('NOT_FOUND');
      expect(categorized.metadata?.statusCode).toBe(404);
    });
  });

  describe('Real-world v0 SDK Scenarios', () => {
    test('should handle invalid chat ID scenario', () => {
      // Simulate what v0 SDK might throw for invalid chat ID format
      const invalidChatError = new Error('Request failed with status code 400');
      (invalidChatError as any).response = {
        status: 400,
        data: {
          error: 'Invalid chat ID format',
          message: 'Chat ID must match pattern: v0_[A-Za-z0-9]+'
        }
      };
      
      const categorized = categorizeError(invalidChatError);
      
      expect(categorized.code).toBe('VALIDATION_ERROR');
      expect(categorized.category).toBe(ErrorCategory.VALIDATION);
      expect(categorized.retryable).toBe(false);
    });

    test('should handle non-existent chat ID scenario', () => {
      // Simulate what v0 SDK might throw for non-existent chat
      const nonExistentChatError = new Error('Request failed with status code 404');
      (nonExistentChatError as any).response = {
        status: 404,
        data: {
          error: 'Chat not found',
          message: 'The specified chat does not exist'
        }
      };
      
      const categorized = categorizeError(nonExistentChatError);
      
      expect(categorized.code).toBe('CHAT_NOT_FOUND');
      expect(categorized.message).toBe('The specified chat was not found');
      expect(categorized.suggestion).toBe('Create a new component instead of iterating');
    });
  });
});