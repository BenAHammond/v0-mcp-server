/**
 * Unit tests for Input Validator
 */

import { describe, test, expect } from '@jest/globals';
import { InputValidator, validateToolArguments } from '../../src/input-validator.js';

describe('InputValidator', () => {
  describe('validateComponentDescription', () => {
    test('should accept valid component descriptions', () => {
      const validDescriptions = [
        'A simple button component',
        'Create a card with title, description, and image',
        'Dashboard with charts and data visualization',
        'Form with email, password, and submit button',
        'Navigation bar with logo and menu items'
      ];

      validDescriptions.forEach(desc => {
        const result = InputValidator.validateComponentDescription(desc);
        expect(result.valid).toBe(true);
        expect(result.sanitized).toBeDefined();
      });
    });

    test('should reject invalid types', () => {
      const invalidInputs = [123, null, undefined, [], {}];
      
      invalidInputs.forEach(input => {
        const result = InputValidator.validateComponentDescription(input);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be a string');
      });
    });

    test('should reject empty descriptions', () => {
      const emptyInputs = ['', '   ', '\n\t'];
      
      emptyInputs.forEach(input => {
        const result = InputValidator.validateComponentDescription(input);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('cannot be empty');
      });
    });

    test('should reject descriptions that are too long', () => {
      const longDesc = 'A'.repeat(5001);
      const result = InputValidator.validateComponentDescription(longDesc);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should reject descriptions that are too short', () => {
      const result = InputValidator.validateComponentDescription('AB');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too short');
    });

    test('should detect and reject script tags', () => {
      const scriptInput = '<script>alert("XSS")</script>';
      const result = InputValidator.validateComponentDescription(scriptInput);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('unsafe content');
    });

    test('should detect and reject script src tags', () => {
      const scriptSrcInput = 'Create a button <script src="evil.js"></script>';
      const result = InputValidator.validateComponentDescription(scriptSrcInput);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('unsafe content');
    });

    test('should detect and reject javascript protocol', () => {
      const jsProtocolInput = 'javascript:void(0) link component';
      const result = InputValidator.validateComponentDescription(jsProtocolInput);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('unsafe content');
    });

    test('should detect event handler injection attempts', () => {
      const maliciousInput = 'onclick="alert(1)" Button component';
      const result = InputValidator.validateComponentDescription(maliciousInput);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('unsafe content');
    });

    test('should sanitize whitespace', () => {
      const result = InputValidator.validateComponentDescription('  Button   with   spaces  ');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Button with spaces');
    });

    test('should reject input with null bytes', () => {
      const result = InputValidator.validateComponentDescription('Button\0Component');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('unsafe content');
    });
  });

  describe('validateChatId', () => {
    test('should accept valid chat IDs', () => {
      const validIds = [
        'abc12345',
        'a1b2c3d4e5f6g7h8',
        'ABCDEF123456',
        '12345678901234567890123456789012' // 32 chars
      ];

      validIds.forEach(id => {
        const result = InputValidator.validateChatId(id);
        expect(result.valid).toBe(true);
        expect(result.sanitized).toBe(id);
      });
    });

    test('should reject invalid chat ID formats', () => {
      const invalidIds = [
        'abc-123', // contains hyphen
        'abc_123', // contains underscore
        'abc 123', // contains space
        'abc@123', // contains special char
        'abc!@#$', // contains multiple special chars
        'a'.repeat(7), // too short
        'a'.repeat(65) // too long
      ];

      invalidIds.forEach(id => {
        const result = InputValidator.validateChatId(id);
        expect(result.valid).toBe(false);
      });
    });

    test('should reject non-string inputs', () => {
      const result = InputValidator.validateChatId(12345);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a string');
    });

    test('should reject empty chat IDs', () => {
      const result = InputValidator.validateChatId('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    test('should detect path traversal attempts', () => {
      const result = InputValidator.validateChatId('../../../etc/passwd');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateIterationChanges', () => {
    test('should accept valid change descriptions', () => {
      const validChanges = [
        'Make the button larger',
        'Change the color to blue',
        'Add hover effects and transitions',
        'Remove the border and add shadow'
      ];

      validChanges.forEach(change => {
        const result = InputValidator.validateIterationChanges(change);
        expect(result.valid).toBe(true);
        expect(result.sanitized).toBeDefined();
      });
    });

    test('should reject changes that are too long', () => {
      const longChanges = 'A'.repeat(2001);
      const result = InputValidator.validateIterationChanges(longChanges);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should detect security issues in changes', () => {
      const maliciousChanges = 'Add button with <script>alert(1)</script>';
      const result = InputValidator.validateIterationChanges(maliciousChanges);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('unsafe content');
    });
  });

  describe('validateComponentOptions', () => {
    test('should accept valid options', () => {
      const validOptions = [
        { framework: 'react' },
        { typescript: true },
        { styling: 'tailwind' },
        { framework: 'vue', typescript: false, styling: 'css' },
        {} // empty options
      ];

      validOptions.forEach(options => {
        const result = InputValidator.validateComponentOptions(options);
        expect(result.valid).toBe(true);
        expect(result.sanitized).toBeDefined();
      });
    });

    test('should reject invalid framework options', () => {
      const result = InputValidator.validateComponentOptions({ framework: 'angular' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid framework');
    });

    test('should reject non-boolean typescript option', () => {
      const result = InputValidator.validateComponentOptions({ typescript: 'yes' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a boolean');
    });

    test('should reject invalid styling options', () => {
      const result = InputValidator.validateComponentOptions({ styling: 'bootstrap' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid styling option');
    });

    test('should warn about unknown options', () => {
      const result = InputValidator.validateComponentOptions({ 
        framework: 'react',
        unknownOption: 'value' 
      });
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Unknown options ignored: unknownOption');
    });

    test('should handle null/undefined options', () => {
      expect(InputValidator.validateComponentOptions(null).valid).toBe(true);
      expect(InputValidator.validateComponentOptions(undefined).valid).toBe(true);
    });

    test('should reject non-object options', () => {
      const result = InputValidator.validateComponentOptions('invalid');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an object');
    });
  });

  describe('validateApiKey', () => {
    test('should accept valid v1 format API keys', () => {
      const validKeys = [
        'v1:abc123:def456',
        'v1:base64string==:anotherbase64string==',
        'v1:AbC123+/=:XyZ789+/='
      ];

      validKeys.forEach(key => {
        const result = InputValidator.validateApiKey(key);
        expect(result.valid).toBe(true);
        expect(result.sanitized).toBe(key);
      });
    });

    test('should accept valid v0 format API keys', () => {
      const validKeys = [
        'v0_abc123',
        'v0_test_key_123',
        'v0_UPPERCASE_KEY'
      ];

      validKeys.forEach(key => {
        const result = InputValidator.validateApiKey(key);
        expect(result.valid).toBe(true);
        expect(result.sanitized).toBe(key);
      });
    });

    test('should reject invalid API key formats', () => {
      const invalidKeys = [
        'invalid',
        'v2:key:format',
        'v1:incomplete',
        'v0-wrong-separator',
        'apikey123'
      ];

      invalidKeys.forEach(key => {
        const result = InputValidator.validateApiKey(key);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('generic validate function', () => {
    test('should validate required fields', () => {
      const result = InputValidator.validate(null, { required: true });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    test('should validate minLength', () => {
      const result = InputValidator.validate('ab', { minLength: 3 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too short');
    });

    test('should validate maxLength', () => {
      const result = InputValidator.validate('abcdef', { maxLength: 5 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should validate pattern', () => {
      const result = InputValidator.validate('abc123', { pattern: /^[a-z]+$/ });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not match');
    });

    test('should validate enum', () => {
      const result = InputValidator.validate('other', { enum: ['one', 'two', 'three'] });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be one of');
    });

    test('should validate with custom function', () => {
      const customValidator = (value: any) => value > 10 ? true : 'Value must be greater than 10';
      const result1 = InputValidator.validate(5, { custom: customValidator });
      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('Value must be greater than 10');

      const result2 = InputValidator.validate(15, { custom: customValidator });
      expect(result2.valid).toBe(true);
    });
  });
});

describe('validateToolArguments', () => {
  test('should validate generate_component arguments', () => {
    const validArgs = {
      description: 'Create a button component',
      options: {
        framework: 'react',
        typescript: true
      }
    };

    const result = validateToolArguments('generate_component', validArgs);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBeDefined();
  });

  test('should validate iterate_component arguments', () => {
    const validArgs = {
      chatId: 'abc12345',
      changes: 'Make the button blue'
    };

    const result = validateToolArguments('iterate_component', validArgs);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBeDefined();
  });

  test('should reject unknown tools', () => {
    const result = validateToolArguments('unknown_tool', {});
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unknown tool');
  });

  test('should provide detailed error messages', () => {
    const invalidArgs = {
      description: '<script>alert(1)</script>',
      options: {
        framework: 'invalid'
      }
    };

    const result = validateToolArguments('generate_component', invalidArgs);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('description:');
    expect(result.error).toContain('options:');
  });
});