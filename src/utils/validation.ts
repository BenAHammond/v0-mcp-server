/**
 * Pure validation functions using Either type for functional error handling
 * Replaces static methods from InputValidator with pure, composable functions
 */

import { Either } from '../types.js';

export const left = <L, R>(value: L): Either<L, R> => ({ _tag: 'Left', left: value });
export const right = <L, R>(value: R): Either<L, R> => ({ _tag: 'Right', right: value });

/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Validates that a value is not null, undefined, or empty string
 * @param fieldName - Name of the field being validated (for error messages)
 * @param value - Value to validate
 * @returns Either<ValidationError, T>
 */
export const validateRequired = <T>(
  fieldName: string,
  value: T | null | undefined
): Either<ValidationError, T> => {
  if (value === null || value === undefined) {
    return left({
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'REQUIRED'
    });
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return left({
      field: fieldName,
      message: `${fieldName} cannot be empty`,
      code: 'EMPTY_STRING'
    });
  }

  return right(value);
};

/**
 * Validates string length constraints
 * @param fieldName - Name of the field being validated
 * @param minLength - Minimum allowed length (optional)
 * @param maxLength - Maximum allowed length (optional)
 * @param value - String value to validate
 * @returns Either<ValidationError, string>
 */
export const validateStringLength = (
  fieldName: string,
  minLength: number | undefined,
  maxLength: number | undefined,
  value: string
): Either<ValidationError, string> => {
  if (typeof value !== 'string') {
    return left({
      field: fieldName,
      message: `${fieldName} must be a string`,
      code: 'INVALID_TYPE'
    });
  }

  const length = value.length;

  if (minLength !== undefined && length < minLength) {
    return left({
      field: fieldName,
      message: `${fieldName} is too short (minimum ${minLength} characters)`,
      code: 'TOO_SHORT'
    });
  }

  if (maxLength !== undefined && length > maxLength) {
    return left({
      field: fieldName,
      message: `${fieldName} is too long (maximum ${maxLength} characters)`,
      code: 'TOO_LONG'
    });
  }

  return right(value);
};

/**
 * Validates email format using a comprehensive regex pattern
 * @param fieldName - Name of the field being validated
 * @param value - Email string to validate
 * @returns Either<ValidationError, string>
 */
export const validateEmail = (
  fieldName: string,
  value: string
): Either<ValidationError, string> => {
  if (typeof value !== 'string') {
    return left({
      field: fieldName,
      message: `${fieldName} must be a string`,
      code: 'INVALID_TYPE'
    });
  }

  // Comprehensive email regex pattern
  // Matches standard email formats while preventing common security issues
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailPattern.test(value)) {
    return left({
      field: fieldName,
      message: `${fieldName} must be a valid email address`,
      code: 'INVALID_EMAIL'
    });
  }

  // Additional security checks
  if (value.length > 254) {
    return left({
      field: fieldName,
      message: `${fieldName} is too long for an email address`,
      code: 'EMAIL_TOO_LONG'
    });
  }

  // Check for dangerous patterns that might slip through the regex
  if (value.includes('..') || value.startsWith('.') || value.endsWith('.')) {
    return left({
      field: fieldName,
      message: `${fieldName} contains invalid character sequences`,
      code: 'INVALID_EMAIL_FORMAT'
    });
  }

  return right(value.toLowerCase());
};

/**
 * Validates URL format and protocol
 * @param fieldName - Name of the field being validated
 * @param value - URL string to validate
 * @param allowedProtocols - Array of allowed protocols (defaults to ['http:', 'https:'])
 * @returns Either<ValidationError, string>
 */
export const validateUrl = (
  fieldName: string,
  value: string,
  allowedProtocols: string[] = ['http:', 'https:']
): Either<ValidationError, string> => {
  if (typeof value !== 'string') {
    return left({
      field: fieldName,
      message: `${fieldName} must be a string`,
      code: 'INVALID_TYPE'
    });
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch (error) {
    return left({
      field: fieldName,
      message: `${fieldName} must be a valid URL`,
      code: 'INVALID_URL'
    });
  }

  // Validate protocol
  if (!allowedProtocols.includes(url.protocol)) {
    return left({
      field: fieldName,
      message: `${fieldName} must use one of the following protocols: ${allowedProtocols.join(', ')}`,
      code: 'INVALID_PROTOCOL'
    });
  }

  // Security checks
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '0.0.0.0') {
    return left({
      field: fieldName,
      message: `${fieldName} cannot point to localhost`,
      code: 'LOCALHOST_URL'
    });
  }

  // Check for IP addresses (basic check)
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipPattern.test(url.hostname)) {
    return left({
      field: fieldName,
      message: `${fieldName} cannot use IP addresses`,
      code: 'IP_ADDRESS_URL'
    });
  }

  // Check for suspicious patterns
  if (url.username || url.password) {
    return left({
      field: fieldName,
      message: `${fieldName} cannot contain credentials`,
      code: 'URL_WITH_CREDENTIALS'
    });
  }

  return right(url.toString());
};

/**
 * Validates a value against a regex pattern
 * @param fieldName - Name of the field being validated
 * @param pattern - Regular expression pattern
 * @param value - String value to validate
 * @param errorMessage - Custom error message (optional)
 * @returns Either<ValidationError, string>
 */
export const validatePattern = (
  fieldName: string,
  pattern: RegExp,
  value: string,
  errorMessage?: string
): Either<ValidationError, string> => {
  if (typeof value !== 'string') {
    return left({
      field: fieldName,
      message: `${fieldName} must be a string`,
      code: 'INVALID_TYPE'
    });
  }

  if (!pattern.test(value)) {
    return left({
      field: fieldName,
      message: errorMessage || `${fieldName} does not match the required format`,
      code: 'PATTERN_MISMATCH'
    });
  }

  return right(value);
};

/**
 * Validates that a value is one of the allowed enum values
 * @param fieldName - Name of the field being validated
 * @param allowedValues - Array of allowed values
 * @param value - Value to validate
 * @returns Either<ValidationError, T>
 */
export const validateEnum = <T>(
  fieldName: string,
  allowedValues: readonly T[],
  value: unknown
): Either<ValidationError, T> => {
  if (!allowedValues.includes(value as T)) {
    return left({
      field: fieldName,
      message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      code: 'INVALID_ENUM_VALUE'
    });
  }

  return right(value as T);
};

/**
 * Validates that a value is a positive number
 * @param fieldName - Name of the field being validated
 * @param value - Value to validate
 * @param allowZero - Whether zero is considered valid (defaults to false)
 * @returns Either<ValidationError, number>
 */
export const validatePositiveNumber = (
  fieldName: string,
  value: unknown,
  allowZero: boolean = false
): Either<ValidationError, number> => {
  if (typeof value !== 'number' || isNaN(value)) {
    return left({
      field: fieldName,
      message: `${fieldName} must be a number`,
      code: 'INVALID_TYPE'
    });
  }

  if (!allowZero && value <= 0) {
    return left({
      field: fieldName,
      message: `${fieldName} must be greater than zero`,
      code: 'NOT_POSITIVE'
    });
  }

  if (allowZero && value < 0) {
    return left({
      field: fieldName,
      message: `${fieldName} must be non-negative`,
      code: 'NEGATIVE_NUMBER'
    });
  }

  return right(value);
};

/**
 * Validates that a value is within a numeric range
 * @param fieldName - Name of the field being validated
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @param value - Number to validate
 * @returns Either<ValidationError, number>
 */
export const validateRange = (
  fieldName: string,
  min: number,
  max: number,
  value: unknown
): Either<ValidationError, number> => {
  if (typeof value !== 'number' || isNaN(value)) {
    return left({
      field: fieldName,
      message: `${fieldName} must be a number`,
      code: 'INVALID_TYPE'
    });
  }

  if (value < min || value > max) {
    return left({
      field: fieldName,
      message: `${fieldName} must be between ${min} and ${max}`,
      code: 'OUT_OF_RANGE'
    });
  }

  return right(value);
};

/**
 * Sanitizes a string by removing dangerous patterns and normalizing whitespace
 * This is a pure function that returns a new string
 * @param value - String to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (value: string): string => {
  if (typeof value !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = value.trim();

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
};

/**
 * Detects potential security issues in text
 * Returns an array of detected issues (empty if none found)
 * @param value - Text to check
 * @returns Array of security issue descriptions
 */
export const detectSecurityIssues = (value: string): string[] => {
  if (typeof value !== 'string') {
    return [];
  }

  const issues: string[] = [];

  // Script injection patterns
  if (/<script\b[^>]*>/gi.test(value)) {
    issues.push('Script tags detected');
  }

  if (/on\w+\s*=/gi.test(value)) {
    issues.push('Event handlers detected');
  }

  if (/javascript:/gi.test(value)) {
    issues.push('JavaScript protocol detected');
  }

  // Path traversal patterns
  if (/\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i.test(value)) {
    issues.push('Path traversal attempt detected');
  }

  // Null bytes
  if (/\0|%00/.test(value)) {
    issues.push('Null bytes detected');
  }

  // Command injection patterns
  if (/[;&|`$(){}[\]<>]/.test(value)) {
    issues.push('Potential command injection characters detected');
  }

  // Check for excessive special characters
  const specialCharCount = (value.match(/[^a-zA-Z0-9\s]/g) || []).length;
  const specialCharRatio = specialCharCount / value.length;
  if (specialCharRatio > 0.3 && value.length > 50) {
    issues.push('Excessive special characters detected');
  }

  return issues;
};

/**
 * Validates a string for security issues
 * @param fieldName - Name of the field being validated
 * @param value - String to validate
 * @returns Either<ValidationError, string> - Returns sanitized string if valid
 */
export const validateSecureString = (
  fieldName: string,
  value: string
): Either<ValidationError, string> => {
  const issues = detectSecurityIssues(value);
  
  if (issues.length > 0) {
    return left({
      field: fieldName,
      message: `${fieldName} contains potentially unsafe content: ${issues.join(', ')}`,
      code: 'SECURITY_ISSUE'
    });
  }

  return right(sanitizeString(value));
};