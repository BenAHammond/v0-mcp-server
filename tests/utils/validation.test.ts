import { describe, it, expect } from '@jest/globals';
import {
  validateRequired,
  validateStringLength,
  validateEmail,
  validateUrl,
  validatePattern,
  validateEnum,
  validatePositiveNumber,
  validateRange,
  sanitizeString,
  detectSecurityIssues,
  validateSecureString
} from '../../src/utils/validation.js';
import { isLeft, isRight } from '../../src/utils/either.js';

describe('Validation Utils', () => {
  describe('validateRequired', () => {
    it('should return Right for non-empty values', () => {
      const result = validateRequired('field', 'value');
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe('value');
      }
    });

    it('should return Left for null', () => {
      const result = validateRequired('field', null);
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('REQUIRED');
      }
    });

    it('should return Left for undefined', () => {
      const result = validateRequired('field', undefined);
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('REQUIRED');
      }
    });

    it('should return Left for empty string', () => {
      const result = validateRequired('field', '   ');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('EMPTY_STRING');
      }
    });
  });

  describe('validateStringLength', () => {
    it('should return Right for valid string length', () => {
      const result = validateStringLength('field', 3, 10, 'hello');
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe('hello');
      }
    });

    it('should return Left for string too short', () => {
      const result = validateStringLength('field', 5, 10, 'hi');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('TOO_SHORT');
      }
    });

    it('should return Left for string too long', () => {
      const result = validateStringLength('field', 1, 5, 'hello world');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('TOO_LONG');
      }
    });

    it('should work with undefined min/max', () => {
      const result1 = validateStringLength('field', undefined, 10, 'hello');
      expect(isRight(result1)).toBe(true);

      const result2 = validateStringLength('field', 3, undefined, 'hello world');
      expect(isRight(result2)).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should return Right for valid email', () => {
      const result = validateEmail('email', 'test@example.com');
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe('test@example.com');
      }
    });

    it('should return lowercase email', () => {
      const result = validateEmail('email', 'Test@Example.COM');
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe('test@example.com');
      }
    });

    it('should return Left for invalid email format', () => {
      const result = validateEmail('email', 'invalid.email');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('INVALID_EMAIL');
      }
    });

    it('should return Left for email with dangerous patterns', () => {
      const result = validateEmail('email', 'test..@example.com');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('INVALID_EMAIL_FORMAT');
      }
    });
  });

  describe('validateUrl', () => {
    it('should return Right for valid https URL', () => {
      const result = validateUrl('url', 'https://example.com');
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe('https://example.com/');
      }
    });

    it('should return Left for invalid URL', () => {
      const result = validateUrl('url', 'not a url');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('INVALID_URL');
      }
    });

    it('should return Left for localhost URL', () => {
      const result = validateUrl('url', 'http://localhost:3000');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('LOCALHOST_URL');
      }
    });

    it('should return Left for IP address URL', () => {
      const result = validateUrl('url', 'http://192.168.1.1');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('IP_ADDRESS_URL');
      }
    });

    it('should return Left for disallowed protocol', () => {
      const result = validateUrl('url', 'ftp://example.com');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('INVALID_PROTOCOL');
      }
    });
  });

  describe('validateEnum', () => {
    it('should return Right for valid enum value', () => {
      const result = validateEnum('framework', ['react', 'vue', 'svelte'] as const, 'react');
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe('react');
      }
    });

    it('should return Left for invalid enum value', () => {
      const result = validateEnum('framework', ['react', 'vue', 'svelte'] as const, 'angular');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('INVALID_ENUM_VALUE');
      }
    });
  });

  describe('sanitizeString', () => {
    it('should trim and normalize whitespace', () => {
      expect(sanitizeString('  hello   world  ')).toBe('hello world');
    });

    it('should remove null bytes', () => {
      expect(sanitizeString('hello\0world')).toBe('helloworld');
    });

    it('should remove control characters', () => {
      expect(sanitizeString('hello\x00\x01\x02world')).toBe('helloworld');
    });
  });

  describe('detectSecurityIssues', () => {
    it('should detect script tags', () => {
      const issues = detectSecurityIssues('<script>alert("xss")</script>');
      expect(issues).toContain('Script tags detected');
    });

    it('should detect event handlers', () => {
      const issues = detectSecurityIssues('<div onclick="alert()">');
      expect(issues).toContain('Event handlers detected');
    });

    it('should detect path traversal', () => {
      const issues = detectSecurityIssues('../../etc/passwd');
      expect(issues).toContain('Path traversal attempt detected');
    });

    it('should return empty array for safe text', () => {
      const issues = detectSecurityIssues('This is a safe string');
      expect(issues).toHaveLength(0);
    });
  });

  describe('validateSecureString', () => {
    it('should return Right for safe string', () => {
      const result = validateSecureString('field', 'This is a safe string');
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe('This is a safe string');
      }
    });

    it('should return Left for string with security issues', () => {
      const result = validateSecureString('field', '<script>alert("xss")</script>');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('SECURITY_ISSUE');
      }
    });
  });
});