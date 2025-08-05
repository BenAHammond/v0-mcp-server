/**
 * Validation Test Helpers
 * 
 * Provides reusable test utilities for validation functions, including
 * custom matchers for Either types and property-based testing helpers.
 */

import { Either, isLeft, isRight, left, right } from '../../src/utils/either.js';

// Jest custom matchers for Either types
export interface EitherMatchers<R> {
  toBeLeft(): R;
  toBeRight(): R;
  toBeLeftWith(expected: any): R;
  toBeRightWith(expected: any): R;
}

declare global {
  namespace jest {
    interface Expect extends EitherMatchers<any> {}
    interface Matchers<R> extends EitherMatchers<R> {}
  }
}

// Custom matcher implementations
export const eitherMatchers = {
  toBeLeft(received: Either<any, any>) {
    const pass = isLeft(received);
    return {
      message: () => 
        pass 
          ? `Expected ${JSON.stringify(received)} not to be Left`
          : `Expected ${JSON.stringify(received)} to be Left`,
      pass,
    };
  },

  toBeRight(received: Either<any, any>) {
    const pass = isRight(received);
    return {
      message: () => 
        pass 
          ? `Expected ${JSON.stringify(received)} not to be Right`
          : `Expected ${JSON.stringify(received)} to be Right`,
      pass,
    };
  },

  toBeLeftWith(received: Either<any, any>, expected: any) {
    if (!isLeft(received)) {
      return {
        message: () => `Expected ${JSON.stringify(received)} to be Left with ${JSON.stringify(expected)}`,
        pass: false,
      };
    }
    
    const pass = JSON.stringify(received.left) === JSON.stringify(expected);
    return {
      message: () => 
        pass 
          ? `Expected Left(${JSON.stringify(received.left)}) not to equal ${JSON.stringify(expected)}`
          : `Expected Left(${JSON.stringify(received.left)}) to equal ${JSON.stringify(expected)}`,
      pass,
    };
  },

  toBeRightWith(received: Either<any, any>, expected: any) {
    if (!isRight(received)) {
      return {
        message: () => `Expected ${JSON.stringify(received)} to be Right with ${JSON.stringify(expected)}`,
        pass: false,
      };
    }
    
    const pass = JSON.stringify(received.right) === JSON.stringify(expected);
    return {
      message: () => 
        pass 
          ? `Expected Right(${JSON.stringify(received.right)}) not to equal ${JSON.stringify(expected)}`
          : `Expected Right(${JSON.stringify(received.right)}) to equal ${JSON.stringify(expected)}`,
      pass,
    };
  },
};

// Setup function to add matchers to Jest
export const setupEitherMatchers = () => {
  expect.extend(eitherMatchers);
};

// Validation test data generators
export const validationTestData = {
  // String validation test cases
  strings: {
    valid: [
      'hello',
      'a'.repeat(50),
      'valid string with spaces',
      '123',
      'special-characters_allowed',
    ],
    
    tooShort: [
      '',
      'a',
      'ab',
    ],
    
    tooLong: [
      'a'.repeat(1001),
      'x'.repeat(5000),
    ],
    
    dangerous: [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      'SELECT * FROM users',
      '../../../etc/passwd',
      'rm -rf /',
      '\x00nullbyte',
    ],
  },

  // Email validation test cases
  emails: {
    valid: [
      'user@example.com',
      'test.email+tag@domain.co.uk',
      'valid.email@subdomain.example.org',
      'user123@test-domain.com',
    ],
    
    invalid: [
      'notanemail',
      '@missing-local.com',
      'missing-at-sign.com',
      'spaces in@email.com',
      'user@',
      'user@domain',
    ],
  },

  // URL validation test cases
  urls: {
    valid: [
      'https://example.com',
      'http://test.org/path',
      'https://subdomain.example.com/path?query=value',
      'https://example.com:8080/secure',
    ],
    
    invalid: [
      'not-a-url',
      'ftp://unsupported.com',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'http://localhost:3000', // Might be blocked for security
    ],
  },

  // Component description test cases
  componentDescriptions: {
    valid: [
      'A simple button component',
      'Create a responsive navigation bar with dropdown menus',
      'Build a user profile card with avatar and contact information',
      'Design a modal dialog for confirmation messages',
    ],
    
    tooShort: [
      '',
      'Hi',
      'ok',
    ],
    
    tooLong: [
      'x'.repeat(2001), // Assuming 2000 char limit
    ],
    
    dangerous: [
      'Create a component with <script>alert("xss")</script>',
      'Build something with javascript:alert(1)',
      'Add onclick="malicious()" to the button',
    ],
  },

  // Chat ID test cases
  chatIds: {
    valid: [
      'chat_abc123def456',
      'v0_chat_xyz789',
      '12345678-1234-1234-1234-123456789012', // UUID v4
      'abcd1234efgh5678',
    ],
    
    invalid: [
      '',
      'too-short',
      'invalid characters!',
      'spaces in chat id',
      '../../../malicious',
      '<script>alert(1)</script>',
    ],
  },
};

// Property-based testing helpers
export const generateRandomString = (
  minLength: number = 1,
  maxLength: number = 100,
  charset: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
): string => {
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

export const generateRandomEmail = (): string => {
  const localPart = generateRandomString(3, 20, 'abcdefghijklmnopqrstuvwxyz0123456789');
  const domain = generateRandomString(3, 15, 'abcdefghijklmnopqrstuvwxyz');
  const tld = ['com', 'org', 'net', 'edu'][Math.floor(Math.random() * 4)];
  return `${localPart}@${domain}.${tld}`;
};

export const generateRandomUrl = (): string => {
  const protocol = Math.random() > 0.5 ? 'https' : 'http';
  const domain = generateRandomString(5, 20, 'abcdefghijklmnopqrstuvwxyz');
  const tld = ['com', 'org', 'net'][Math.floor(Math.random() * 3)];
  const path = Math.random() > 0.5 ? `/${generateRandomString(3, 10)}` : '';
  return `${protocol}://${domain}.${tld}${path}`;
};

// Test case generators for property-based testing
export const propertyTestCases = {
  // Generate test cases for string length validation
  stringLength: (
    minLength: number,
    maxLength: number,
    count: number = 100
  ) => {
    const cases = [];
    
    // Valid cases
    for (let i = 0; i < count / 2; i++) {
      const validString = generateRandomString(minLength, maxLength);
      cases.push({
        input: validString,
        expected: 'right',
        description: `valid string of length ${validString.length}`,
      });
    }
    
    // Invalid cases (too short)
    for (let i = 0; i < count / 4; i++) {
      const shortString = generateRandomString(0, Math.max(0, minLength - 1));
      cases.push({
        input: shortString,
        expected: 'left',
        description: `too short string of length ${shortString.length}`,
      });
    }
    
    // Invalid cases (too long)
    for (let i = 0; i < count / 4; i++) {
      const longString = generateRandomString(maxLength + 1, maxLength + 100);
      cases.push({
        input: longString,
        expected: 'left',
        description: `too long string of length ${longString.length}`,
      });
    }
    
    return cases;
  },

  // Generate test cases for email validation
  emailValidation: (count: number = 50) => {
    const cases = [];
    
    // Valid emails
    for (let i = 0; i < count / 2; i++) {
      const validEmail = generateRandomEmail();
      cases.push({
        input: validEmail,
        expected: 'right',
        description: `valid email: ${validEmail}`,
      });
    }
    
    // Invalid emails
    for (let i = 0; i < count / 2; i++) {
      const invalidEmail = generateRandomString(5, 20); // No @ symbol
      cases.push({
        input: invalidEmail,
        expected: 'left',
        description: `invalid email: ${invalidEmail}`,
      });
    }
    
    return cases;
  },

  // Generate test cases for URL validation
  urlValidation: (count: number = 50) => {
    const cases = [];
    
    // Valid URLs
    for (let i = 0; i < count / 2; i++) {
      const validUrl = generateRandomUrl();
      cases.push({
        input: validUrl,
        expected: 'right',
        description: `valid URL: ${validUrl}`,
      });
    }
    
    // Invalid URLs
    for (let i = 0; i < count / 2; i++) {
      const invalidUrl = generateRandomString(10, 30); // No protocol
      cases.push({
        input: invalidUrl,
        expected: 'left',
        description: `invalid URL: ${invalidUrl}`,
      });
    }
    
    return cases;
  },
};

// Test suite helpers - returns test functions instead of creating describe blocks
export const createValidationTests = (
  validator: (input: any) => Either<any, any>,
  testCases: { valid: any[]; invalid: any[] }
) => {
  const validTests = testCases.valid.map((input, index) => ({
    name: `should accept valid input ${index + 1}: ${JSON.stringify(input)}`,
    test: () => {
      const result = validator(input);
      expect(result).toBeRight();
    }
  }));

  const invalidTests = testCases.invalid.map((input, index) => ({
    name: `should reject invalid input ${index + 1}: ${JSON.stringify(input)}`,
    test: () => {
      const result = validator(input);
      expect(result).toBeLeft();
    }
  }));

  return { validTests, invalidTests };
};

// Helper to run validation tests within an existing describe block
export const runValidationTests = (
  validator: (input: any) => Either<any, any>,
  testCases: { valid: any[]; invalid: any[] }
) => {
  const { validTests, invalidTests } = createValidationTests(validator, testCases);
  
  validTests.forEach(({ name, test }) => {
    it(name, test);
  });

  invalidTests.forEach(({ name, test }) => {
    it(name, test);
  });
};

// Batch validation test helper
export const testValidationBatch = <T, E>(
  validator: (input: T) => Either<E, T>,
  inputs: T[],
  expectedResults: ('left' | 'right')[]
) => {
  expect(inputs.length).toBe(expectedResults.length);
  
  inputs.forEach((input, index) => {
    const result = validator(input);
    const expected = expectedResults[index];
    
    if (expected === 'left') {
      expect(result).toBeLeft();
    } else {
      expect(result).toBeRight();
    }
  });
};

// Async validation test helper
export const testAsyncValidation = async <T, E>(
  validator: (input: T) => Promise<Either<E, T>>,
  input: T,
  expected: 'left' | 'right'
) => {
  const result = await validator(input);
  
  if (expected === 'left') {
    expect(result).toBeLeft();
  } else {
    expect(result).toBeRight();
  }
};

// Error message validation helpers
export const validateErrorMessage = (
  result: Either<any, any>,
  expectedField: string,
  expectedCode?: string
) => {
  expect(result).toBeLeft();
  
  if (isLeft(result)) {
    const error = result.left;
    
    if (typeof error === 'object' && error !== null) {
      if ('field' in error) {
        expect(error.field).toBe(expectedField);
      }
      
      if (expectedCode && 'code' in error) {
        expect(error.code).toBe(expectedCode);
      }
      
      if ('message' in error) {
        expect(typeof error.message).toBe('string');
        expect(error.message.length).toBeGreaterThan(0);
      }
    }
  }
};

// Security validation test helpers
export const createSecurityTests = (
  validator: (input: string) => Either<any, any>,
  dangerousInputs: string[] = validationTestData.strings.dangerous
) => {
  return dangerousInputs.map((input, index) => ({
    name: `should reject dangerous input ${index + 1}: ${input.substring(0, 50)}...`,
    test: () => {
      const result = validator(input);
      expect(result).toBeLeft();
      
      if (isLeft(result)) {
        const error = result.left;
        expect(error).toBeDefined();
        
        // Should have some indication it's a security issue
        if (typeof error === 'object' && 'message' in error) {
          const message = error.message.toLowerCase();
          expect(
            message.includes('security') ||
            message.includes('dangerous') ||
            message.includes('invalid') ||
            message.includes('malicious')
          ).toBe(true);
        }
      }
    }
  }));
};

// Helper to run security tests within an existing describe block
export const runSecurityTests = (
  validator: (input: string) => Either<any, any>,
  dangerousInputs: string[] = validationTestData.strings.dangerous
) => {
  const tests = createSecurityTests(validator, dangerousInputs);
  tests.forEach(({ name, test }) => {
    it(name, test);
  });
};

// Export all test data and helpers
export {
  left,
  right,
  isLeft,
  isRight,
};