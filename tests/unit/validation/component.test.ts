import { describe, it, expect } from '@jest/globals';
import {
  validateComponentDescription,
  validateComponentOptions,
  validateComponentInput,
  createComponentValidationError
} from '../../../src/validation/component.js';
import { isLeft, isRight } from '../../../src/utils/either.js';

describe('Component Validation', () => {
  describe('validateComponentDescription', () => {
    it('should accept valid component descriptions', () => {
      const result = validateComponentDescription('Create a button component');
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.description).toBe('Create a button component');
        expect(result.right.sanitized).toBe('Create a button component');
      }
    });

    it('should reject non-string descriptions', () => {
      const result = validateComponentDescription(123);
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.field).toBe('description');
        expect(result.left.message).toContain('must be a string');
      }
    });

    it('should reject empty descriptions', () => {
      const result = validateComponentDescription('');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.field).toBe('description');
        expect(result.left.message).toContain('cannot be empty');
      }
    });

    it('should reject descriptions that are too short', () => {
      const result = validateComponentDescription('ab');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.field).toBe('description');
        expect(result.left.message).toContain('too short');
      }
    });

    it('should reject descriptions that are too long', () => {
      const longDescription = 'a'.repeat(5001);
      const result = validateComponentDescription(longDescription);
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.field).toBe('description');
        expect(result.left.message).toContain('too long');
      }
    });

    it('should reject descriptions with script tags', () => {
      const result = validateComponentDescription('Create a <script>alert("xss")</script> component');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.field).toBe('description');
        expect(result.left.message).toContain('unsafe content');
      }
    });

    it('should sanitize descriptions with extra whitespace', () => {
      const result = validateComponentDescription('Create  a   button    component');
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.sanitized).toBe('Create a button component');
      }
    });
  });

  describe('validateComponentOptions', () => {
    it('should return defaults for undefined options', () => {
      const result = validateComponentOptions(undefined);
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toEqual({
          framework: 'react',
          typescript: true,
          styling: 'tailwind'
        });
      }
    });

    it('should return defaults for null options', () => {
      const result = validateComponentOptions(null);
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toEqual({
          framework: 'react',
          typescript: true,
          styling: 'tailwind'
        });
      }
    });

    it('should accept valid options', () => {
      const result = validateComponentOptions({
        framework: 'vue',
        typescript: false,
        styling: 'css'
      });
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toEqual({
          framework: 'vue',
          typescript: false,
          styling: 'css'
        });
      }
    });

    it('should apply defaults for missing options', () => {
      const result = validateComponentOptions({
        framework: 'svelte'
      });
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toEqual({
          framework: 'svelte',
          typescript: true,
          styling: 'tailwind'
        });
      }
    });

    it('should reject invalid framework', () => {
      const result = validateComponentOptions({
        framework: 'angular'
      });
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.field).toBe('options.framework');
        expect(result.left.message).toContain('must be one of: react, vue, svelte');
      }
    });

    it('should reject non-boolean typescript option', () => {
      const result = validateComponentOptions({
        typescript: 'yes'
      });
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.field).toBe('options.typescript');
        expect(result.left.message).toContain('must be a boolean');
      }
    });

    it('should reject invalid styling option', () => {
      const result = validateComponentOptions({
        styling: 'sass'
      });
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.field).toBe('options.styling');
        expect(result.left.message).toContain('must be one of: css, tailwind, styled-components');
      }
    });

    it('should ignore unknown options', () => {
      const result = validateComponentOptions({
        framework: 'react',
        unknownOption: 'value'
      });
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toEqual({
          framework: 'react',
          typescript: true,
          styling: 'tailwind'
        });
      }
    });

    it('should reject non-object options', () => {
      const result = validateComponentOptions('invalid');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.field).toBe('options');
        expect(result.left.message).toContain('must be an object');
      }
    });

    it('should reject array options', () => {
      const result = validateComponentOptions([]);
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.field).toBe('options');
        expect(result.left.message).toContain('must be an object');
      }
    });
  });

  describe('validateComponentInput', () => {
    it('should validate complete input successfully', () => {
      const result = validateComponentInput({
        description: 'Create a button component',
        options: {
          framework: 'react',
          typescript: true,
          styling: 'tailwind'
        }
      });
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.description.description).toBe('Create a button component');
        expect(result.right.options.framework).toBe('react');
      }
    });

    it('should work with minimal input', () => {
      const result = validateComponentInput({
        description: 'Create a card component'
      });
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.description.description).toBe('Create a card component');
        expect(result.right.options).toEqual({
          framework: 'react',
          typescript: true,
          styling: 'tailwind'
        });
      }
    });

    it('should reject invalid input type', () => {
      const result = validateComponentInput('invalid');
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.field).toBe('input');
        expect(result.left.message).toContain('must be an object');
      }
    });

    it('should propagate description errors', () => {
      const result = validateComponentInput({
        description: ''
      });
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.field).toBe('description');
      }
    });

    it('should propagate options errors', () => {
      const result = validateComponentInput({
        description: 'Create a button',
        options: {
          framework: 'invalid'
        }
      });
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.field).toBe('options.framework');
      }
    });
  });

  describe('createComponentValidationError', () => {
    it('should create properly formatted validation error', () => {
      const error = createComponentValidationError('description', 'Invalid description');
      expect(error).toEqual({
        field: 'component.description',
        message: 'Invalid description',
        code: 'VALIDATION_ERROR'
      });
    });
  });
});