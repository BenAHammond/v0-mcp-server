/**
 * Tests for v0.dev API Error Handler
 */

import { describe, it, expect } from '@jest/globals';
import {
  handleApiError,
  createContext,
  isSDKInitializationError,
  isMethodNotFoundError,
  isApiKeyError,
  isV0RateLimitError,
  isResourceNotFoundError,
  isTransformationError,
  detectMissingResourceType,
  extractSDKMethod,
  getRetryInfo,
  createSDKInitializationError,
  createMethodNotFoundError,
  createResourceNotFoundError,
  createTransformationError,
  createOperationError,
  V0_ERROR_CODES
} from '../../../src/api/v0/error-handler.js';
import { isNetworkError } from '../../../src/constants/error-patterns.js';
import { ErrorCategory } from '../../../src/transformers/error-response.js';

describe('v0.dev API Error Handler', () => {
  describe('Error Detection Functions', () => {
    it('should detect SDK initialization errors', () => {
      expect(isSDKInitializationError(new Error('Failed to initialize v0-sdk'))).toBe(true);
      expect(isSDKInitializationError(new Error('Cannot find module \'v0-sdk\''))).toBe(true);
      expect(isSDKInitializationError(new Error('v0-sdk is not installed'))).toBe(true);
      expect(isSDKInitializationError(new Error('Some other error'))).toBe(false);
    });

    it('should detect method not found errors', () => {
      expect(isMethodNotFoundError(new Error('client.chats.find is not a function'))).toBe(true);
      expect(isMethodNotFoundError(new Error('Cannot read property \'create\' of undefined'))).toBe(true);
      expect(isMethodNotFoundError(new Error('Method does not exist'))).toBe(true);
      expect(isMethodNotFoundError(new Error('Some other error'))).toBe(false);
    });

    it('should detect API key errors', () => {
      expect(isApiKeyError(new Error('Invalid API key'))).toBe(true);
      expect(isApiKeyError(new Error('401 Unauthorized'))).toBe(true);
      expect(isApiKeyError(new Error('Authentication failed'))).toBe(true);
      expect(isApiKeyError(new Error('Invalid credentials provided'))).toBe(true);
      expect(isApiKeyError(new Error('Some other error'))).toBe(false);
    });

    it('should detect rate limit errors', () => {
      expect(isV0RateLimitError(new Error('Rate limit exceeded'))).toBe(true);
      expect(isV0RateLimitError(new Error('429 Too Many Requests'))).toBe(true);
      expect(isV0RateLimitError(new Error('Quota exceeded'))).toBe(true);
      expect(isV0RateLimitError(new Error('Request throttled'))).toBe(true);
      expect(isV0RateLimitError(new Error('Some other error'))).toBe(false);
    });

    it('should detect network errors', () => {
      expect(isNetworkError('ECONNREFUSED')).toBe(true);
      expect(isNetworkError('ETIMEDOUT')).toBe(true);
      expect(isNetworkError('ENOTFOUND')).toBe(true);
      expect(isNetworkError('Network connection refused')).toBe(true);
      expect(isNetworkError('Request timeout')).toBe(true);
      expect(isNetworkError('DNS lookup failed')).toBe(true);
      expect(isNetworkError('Some other error')).toBe(false);
    });

    it('should detect resource not found errors', () => {
      expect(isResourceNotFoundError(new Error('Chat not found'))).toBe(true);
      expect(isResourceNotFoundError(new Error('404 Not Found'))).toBe(true);
      expect(isResourceNotFoundError(new Error('Project does not exist'))).toBe(true);
      expect(isResourceNotFoundError(new Error('No such deployment'))).toBe(true);
      expect(isResourceNotFoundError(new Error('Some other error'))).toBe(false);
    });

    it('should detect transformation errors', () => {
      expect(isTransformationError(new Error('Failed to transform response'))).toBe(true);
      expect(isTransformationError(new Error('Transformation failed'))).toBe(true);
      expect(isTransformationError(new Error('Invalid response format'))).toBe(true);
      expect(isTransformationError(new Error('Some other error'))).toBe(false);
    });
  });

  describe('Resource Type Detection', () => {
    it('should detect missing resource type from error message', () => {
      expect(detectMissingResourceType(new Error('Chat not found'))).toBe('chat');
      expect(detectMissingResourceType(new Error('Invalid chat ID'))).toBe('chat');
      expect(detectMissingResourceType(new Error('Project not found'))).toBe('project');
      expect(detectMissingResourceType(new Error('Invalid project ID'))).toBe('project');
      expect(detectMissingResourceType(new Error('Deployment not found'))).toBe('deployment');
      expect(detectMissingResourceType(new Error('Webhook not found'))).toBe('webhook');
      expect(detectMissingResourceType(new Error('Something not found'))).toBe(null);
    });
  });

  describe('SDK Method Extraction', () => {
    it('should extract SDK method name from error', () => {
      expect(extractSDKMethod(new Error('client.chats.find is not a function'))).toBe('client.chats.find');
      expect(extractSDKMethod(new Error('client.projects.create is not a function'))).toBe('client.projects.create');
      expect(extractSDKMethod(new Error('hooks.delete is not a function'))).toBe('hooks.delete');
      expect(extractSDKMethod(new Error('Cannot read property \'create\' of undefined'))).toBe('create');
      expect(extractSDKMethod(new Error('Cannot read properties of undefined (reading \'find\')'))).toBe('find');
      expect(extractSDKMethod(new Error('Some other error'))).toBe(null);
    });
  });

  describe('Retry Information', () => {
    it('should provide retry info for different error types', () => {
      // Rate limit errors
      const rateLimitRetry = getRetryInfo(new Error('Rate limit exceeded. Retry after 120 seconds'));
      expect(rateLimitRetry.retryable).toBe(true);
      expect(rateLimitRetry.retryAfter).toBe(120);

      // Network errors
      const networkRetry = getRetryInfo(new Error('ECONNREFUSED'));
      expect(networkRetry.retryable).toBe(true);
      expect(networkRetry.retryAfter).toBe(5);

      // API key errors
      const apiKeyRetry = getRetryInfo(new Error('Invalid API key'));
      expect(apiKeyRetry.retryable).toBe(false);
      expect(apiKeyRetry.retryAfter).toBeUndefined();

      // Resource not found errors
      const notFoundRetry = getRetryInfo(new Error('Chat not found'));
      expect(notFoundRetry.retryable).toBe(false);
      expect(notFoundRetry.retryAfter).toBeUndefined();

      // Unknown errors
      const unknownRetry = getRetryInfo(new Error('Unknown error'));
      expect(unknownRetry.retryable).toBe(true);
      expect(unknownRetry.retryAfter).toBe(1);
    });
  });

  describe('Error Creation Functions', () => {
    it('should create SDK initialization error', () => {
      const error = createSDKInitializationError(new Error('Module not found'));
      expect(error.code).toBe(V0_ERROR_CODES.SDK_INITIALIZATION_ERROR);
      expect(error.message).toBe('Failed to initialize v0-sdk client');
      expect(error.data?.retryable).toBe(false);
      expect(error.data?.suggestion).toContain('npm install v0-sdk');
    });

    it('should create method not found error', () => {
      const error = createMethodNotFoundError('chats.find', createContext('listChats'));
      expect(error.code).toBe(V0_ERROR_CODES.METHOD_NOT_FOUND);
      expect(error.message).toContain('chats.find');
      expect(error.data?.retryable).toBe(false);
      expect(error.data?.operation).toBe('listChats');
    });

    it('should create resource not found error', () => {
      const error = createResourceNotFoundError('chat', 'abc123');
      expect(error.code).toBe(V0_ERROR_CODES.CHAT_NOT_FOUND);
      expect(error.message).toContain('chat \'abc123\' not found');
      expect(error.data?.retryable).toBe(false);
      expect(error.data?.resourceType).toBe('chat');
      expect(error.data?.resourceId).toBe('abc123');
    });

    it('should create transformation error', () => {
      const error = createTransformationError('parseChat', new Error('Invalid JSON'));
      expect(error.code).toBe(V0_ERROR_CODES.TRANSFORMATION_ERROR);
      expect(error.message).toContain('parseChat');
      expect(error.data?.retryable).toBe(false);
      expect(error.data?.operation).toBe('parseChat');
    });
  });

  describe('Main Error Handler', () => {
    it('should handle SDK initialization errors', () => {
      const error = handleApiError(
        new Error('Failed to initialize v0-sdk'),
        createContext('createClient')
      );
      expect(error.code).toBe(V0_ERROR_CODES.SDK_INITIALIZATION_ERROR);
    });

    it('should handle method not found errors', () => {
      const error = handleApiError(
        new Error('client.chats.find is not a function'),
        createContext('listChats')
      );
      expect(error.code).toBe(V0_ERROR_CODES.METHOD_NOT_FOUND);
      expect(error.data?.method).toBe('client.chats.find');
    });

    it('should handle resource not found errors', () => {
      const error = handleApiError(
        new Error('Chat not found'),
        createContext('getChat', { chatId: 'xyz789' })
      );
      expect(error.code).toBe(V0_ERROR_CODES.CHAT_NOT_FOUND);
      expect(error.data?.resourceId).toBe('xyz789');
    });

    it('should handle transformation errors', () => {
      const error = handleApiError(
        new Error('Failed to transform response'),
        createContext('transformChat')
      );
      expect(error.code).toBe(V0_ERROR_CODES.TRANSFORMATION_ERROR);
    });

    it('should handle generic errors with proper context', () => {
      const error = handleApiError(
        new Error('Something went wrong'),
        createContext('someOperation', { chatId: 'abc123' })
      );
      expect(error.data?.operation).toBe('someOperation');
      expect(error.data?.chatId).toBe('abc123');
    });
  });

  describe('Operation Error Helper', () => {
    it('should create operation error with context', () => {
      const error = createOperationError(
        'createChat',
        new Error('Network error'),
        { chatId: '123' }
      );
      expect(error.data?.operation).toBe('createChat');
      expect(error.data?.chatId).toBe('123');
    });
  });

  describe('Context Creation', () => {
    it('should create context with operation only', () => {
      const context = createContext('listChats');
      expect(context.operation).toBe('listChats');
      expect(context.chatId).toBeUndefined();
    });

    it('should create context with all parameters', () => {
      const context = createContext('updateDeployment', {
        chatId: 'chat123',
        projectId: 'proj456',
        deploymentId: 'dep789',
        webhookId: 'hook012'
      });
      expect(context.operation).toBe('updateDeployment');
      expect(context.chatId).toBe('chat123');
      expect(context.projectId).toBe('proj456');
      expect(context.deploymentId).toBe('dep789');
      expect(context.webhookId).toBe('hook012');
    });
  });
});