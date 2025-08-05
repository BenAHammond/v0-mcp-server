/**
 * Test the validation test helpers
 */

import { 
  setupEitherMatchers,
  validationTestData,
  generateRandomString,
  generateRandomEmail,
  generateRandomUrl,
  propertyTestCases,
  createValidationTests,
  testValidationBatch,
  validateErrorMessage,
  createSecurityTests
} from './validation.js';
import { left, right, Either } from '../../src/utils/either.js';

// Setup custom matchers
beforeAll(() => {
  setupEitherMatchers();
});

describe('Validation Test Helpers', () => {
  describe('Custom Either Matchers', () => {
    it('should provide toBeLeft matcher', () => {
      expect(left('error')).toBeLeft();
      expect(right('success')).not.toBeLeft();
    });

    it('should provide toBeRight matcher', () => {
      expect(right('success')).toBeRight();
      expect(left('error')).not.toBeRight();
    });

    it('should provide toBeLeftWith matcher', () => {
      expect(left('specific error')).toBeLeftWith('specific error');
      expect(left({ field: 'test', message: 'error' })).toBeLeftWith({ field: 'test', message: 'error' });
    });

    it('should provide toBeRightWith matcher', () => {
      expect(right('specific value')).toBeRightWith('specific value');
      expect(right({ id: 1, name: 'test' })).toBeRightWith({ id: 1, name: 'test' });
    });
  });

  describe('Test Data Generators', () => {
    it('should provide validation test data', () => {
      expect(validationTestData.strings.valid.length).toBeGreaterThan(0);
      expect(validationTestData.strings.dangerous.length).toBeGreaterThan(0);
      expect(validationTestData.emails.valid.length).toBeGreaterThan(0);
      expect(validationTestData.urls.valid.length).toBeGreaterThan(0);
    });

    it('should generate random strings', () => {
      const str1 = generateRandomString(5, 10);
      const str2 = generateRandomString(5, 10);
      
      expect(str1.length).toBeGreaterThanOrEqual(5);
      expect(str1.length).toBeLessThanOrEqual(10);
      expect(str2.length).toBeGreaterThanOrEqual(5);
      expect(str2.length).toBeLessThanOrEqual(10);
      
      // Should be different (with very high probability)
      expect(str1).not.toBe(str2);
    });

    it('should generate random emails', () => {
      const email = generateRandomEmail();
      expect(email).toMatch(/@/);
      expect(email).toMatch(/\./);
    });

    it('should generate random URLs', () => {
      const url = generateRandomUrl();
      expect(url).toMatch(/^https?:\/\//);
      expect(url).toMatch(/\./);
    });
  });

  describe('Property-based Test Cases', () => {
    it('should generate string length test cases', () => {
      const cases = propertyTestCases.stringLength(5, 20, 20);
      expect(cases.length).toBe(20);
      
      const validCases = cases.filter(c => c.expected === 'right');
      const invalidCases = cases.filter(c => c.expected === 'left');
      
      expect(validCases.length).toBe(10);
      expect(invalidCases.length).toBe(10);
    });

    it('should generate email validation test cases', () => {
      const cases = propertyTestCases.emailValidation(20);
      expect(cases.length).toBe(20);
      
      const validCases = cases.filter(c => c.expected === 'right');
      const invalidCases = cases.filter(c => c.expected === 'left');
      
      expect(validCases.length).toBe(10);
      expect(invalidCases.length).toBe(10);
    });
  });

  describe('Test Suite Helpers', () => {
    // Simple mock validator for testing
    const mockStringValidator = (input: string): Either<string, string> => {
      if (input.length < 3) return left('Too short');
      if (input.length > 10) return left('Too long'); 
      if (input.includes('<script>')) return left('Dangerous content');
      return right(input);
    };

    it('should create validation tests', () => {
      const testCases = {
        valid: ['hello', 'world', 'test'],
        invalid: ['hi', 'x', 'very long string that exceeds limit', '<script>']
      };

      const { validTests, invalidTests } = createValidationTests(mockStringValidator, testCases);
      
      expect(validTests.length).toBe(3);
      expect(invalidTests.length).toBe(4);
      expect(validTests[0].name).toContain('should accept valid input 1');
      expect(invalidTests[0].name).toContain('should reject invalid input 1');
    });

    it('should test validation batches', () => {
      const inputs = ['hello', 'hi', 'very long string', 'world'];
      const expected: ('left' | 'right')[] = ['right', 'left', 'left', 'right'];
      
      expect(() => {
        testValidationBatch(mockStringValidator, inputs, expected);
      }).not.toThrow();
    });

    it('should validate error messages', () => {
      const errorResult = left({ field: 'test', message: 'Test error', code: 'TEST_ERROR' });
      
      expect(() => {
        validateErrorMessage(errorResult, 'test', 'TEST_ERROR');
      }).not.toThrow();
    });

    it('should create security tests', () => {
      const dangerousInputs = ['<script>alert(1)</script>', 'javascript:alert(1)'];
      
      const tests = createSecurityTests(mockStringValidator, dangerousInputs);
      
      expect(tests.length).toBe(2);
      expect(tests[0].name).toContain('should reject dangerous input 1');
      expect(tests[1].name).toContain('should reject dangerous input 2');
    });
  });
});