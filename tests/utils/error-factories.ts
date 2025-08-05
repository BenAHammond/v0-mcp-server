/**
 * Test Factories for Error Testing
 * 
 * Consolidates common error creation patterns to reduce duplication in tests
 * and make error testing more consistent and maintainable.
 */

/**
 * Create a mock HTTP error with status code
 */
export function createHttpError(
  statusCode: number, 
  message?: string,
  responseData?: any
): Error & { status?: number; response?: any } {
  const error = new Error(message || `Request failed with status code ${statusCode}`) as any;
  error.status = statusCode;
  error.response = {
    status: statusCode,
    statusText: getStatusText(statusCode),
    ...(responseData && { data: responseData })
  };
  return error;
}

/**
 * Create an axios-style error
 */
export function createAxiosError(
  statusCode: number,
  message?: string,
  responseData?: any,
  config?: any
): any {
  return {
    message: message || `Request failed with status code ${statusCode}`,
    name: 'AxiosError',
    response: {
      status: statusCode,
      statusText: getStatusText(statusCode),
      data: responseData || {},
      headers: {},
      config: config || {}
    },
    request: {},
    config: config || {},
    isAxiosError: true,
    toJSON: () => ({})
  };
}

/**
 * Create a network error
 */
export function createNetworkError(type: 'timeout' | 'refused' | 'dns' | 'ssl' = 'refused'): Error {
  const messages = {
    timeout: 'ETIMEDOUT',
    refused: 'ECONNREFUSED',
    dns: 'ENOTFOUND',
    ssl: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
  };
  
  const error = new Error(messages[type]);
  (error as any).code = messages[type];
  return error;
}

/**
 * Create a validation error
 */
export function createValidationError(
  field: string,
  message?: string
): Error {
  return new Error(message || `Invalid parameter: ${field} is required`);
}

/**
 * Create a rate limit error
 */
export function createRateLimitError(retryAfter: number = 60): any {
  const error = createHttpError(429, 'Too Many Requests');
  error.response.headers = {
    'retry-after': String(retryAfter)
  };
  return error;
}

/**
 * Create an authentication error
 */
export function createAuthError(type: 'missing' | 'invalid' | 'expired' = 'invalid'): Error {
  const messages = {
    missing: 'API key is required',
    invalid: 'Invalid API key provided',
    expired: 'API key has expired'
  };
  
  return createHttpError(401, messages[type]);
}

/**
 * Create a not found error
 */
export function createNotFoundError(resource: 'chat' | 'project' | 'generic' = 'generic'): any {
  const messages = {
    chat: 'Chat not found',
    project: 'Project not found',
    generic: 'Resource not found'
  };
  
  return createHttpError(404, messages[resource], {
    error: messages[resource],
    message: `The specified ${resource} does not exist`
  });
}

/**
 * Create a server error
 */
export function createServerError(statusCode: 500 | 502 | 503 = 500): Error {
  const messages = {
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };
  
  return createHttpError(statusCode, messages[statusCode]);
}

/**
 * Create a generic error with custom properties
 */
export function createCustomError(properties: Record<string, any>): any {
  const { message = 'Custom error', ...rest } = properties;
  const error = new Error(message) as any;
  Object.assign(error, rest);
  return error;
}

/**
 * Get status text for a status code
 */
function getStatusText(statusCode: number): string {
  const statusTexts: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  
  return statusTexts[statusCode] || 'Unknown Status';
}

/**
 * Create a batch of test errors for comprehensive testing
 */
export function createTestErrorSuite() {
  return {
    // Authentication errors
    authMissing: createAuthError('missing'),
    authInvalid: createAuthError('invalid'),
    authExpired: createAuthError('expired'),
    
    // Rate limit errors
    rateLimit: createRateLimitError(60),
    rateLimitCustom: createRateLimitError(300),
    
    // Network errors
    networkTimeout: createNetworkError('timeout'),
    networkRefused: createNetworkError('refused'),
    networkDns: createNetworkError('dns'),
    networkSsl: createNetworkError('ssl'),
    
    // Validation errors
    validationRequired: createValidationError('description'),
    validationChatId: createValidationError('chatId', 'Invalid chat ID format'),
    
    // Not found errors
    notFoundChat: createNotFoundError('chat'),
    notFoundProject: createNotFoundError('project'),
    notFoundGeneric: createNotFoundError('generic'),
    
    // Server errors
    serverError: createServerError(500),
    badGateway: createServerError(502),
    serviceUnavailable: createServerError(503),
    
    // Edge cases
    nullError: null,
    undefinedError: undefined,
    stringError: 'Simple string error',
    emptyError: new Error(''),
    objectError: { error: 'Object error', code: 'OBJECT_ERROR' }
  };
}

/**
 * Assert error matches expected properties
 */
export function assertErrorMatch(
  actual: any,
  expected: {
    code?: string;
    message?: string | RegExp;
    retryable?: boolean;
    statusCode?: number;
  }
): void {
  if (expected.code !== undefined) {
    expect(actual.code).toBe(expected.code);
  }
  
  if (expected.message !== undefined) {
    if (expected.message instanceof RegExp) {
      expect(actual.message).toMatch(expected.message);
    } else {
      expect(actual.message).toBe(expected.message);
    }
  }
  
  if (expected.retryable !== undefined) {
    expect(actual.data?.retryable ?? actual.retryable).toBe(expected.retryable);
  }
  
  if (expected.statusCode !== undefined) {
    expect(actual.data?.statusCode ?? actual.statusCode).toBe(expected.statusCode);
  }
}