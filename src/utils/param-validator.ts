
import { Either, ToolSchema, ParameterSchema } from '../types.js';

export const left = <L, R>(value: L): Either<L, R> => ({ _tag: 'Left', left: value });
export const right = <L, R>(value: R): Either<L, R> => ({ _tag: 'Right', right: value });

import { 
  validateSecureString, 
  detectSecurityIssues 
} from './validation.js';

export function validateToolParameters(
  toolName: string,
  params: any,
  schema: ToolSchema
): Either<Error, any> {
  try {
    const { properties, required = [] } = schema.inputSchema;
    
    if (Object.keys(properties).length === 0 || required.length === 0) {
      if (!params || Object.keys(params).length === 0) {
        return right({});
      }
    }

    if (!params && required.length > 0) {
      return left(new Error(`${toolName} requires parameters: ${required.join(', ')}`));
    }

    if (params && typeof params !== 'object') {
      if (required.length === 1) {
        params = { [required[0]]: params };
      } else {
        return left(new Error(`${toolName} requires an object with parameters`));
      }
    }

    if (!params) {
      params = {};
    }

    const validatedParams: any = {};
    const errors: string[] = [];

    for (const requiredParam of required) {
      if (!(requiredParam in params)) {
        if (requiredParam === 'params' && Object.keys(params).length > 0) {
            validatedParams[requiredParam] = params;
          continue;
        }
        errors.push(`Missing required parameter: ${requiredParam}`);
      }
    }

    for (const [paramName, paramValue] of Object.entries(params)) {
      const paramSchema = properties[paramName];
      
      if (!paramSchema) {
        if (schema.inputSchema.additionalProperties !== false) {
          validatedParams[paramName] = paramValue;
        }
        continue;
      }

      const paramValidation = validateParameter(paramName, paramValue, paramSchema);
      if (paramValidation._tag === 'Left') {
        errors.push(paramValidation.left.message);
      } else {
        validatedParams[paramName] = paramValidation.right;
      }
    }

    if (errors.length > 0) {
      return left(new Error(`${toolName} parameter validation failed: ${errors.join(', ')}`));
    }

    return right(validatedParams);
  } catch (error) {
    return left(new Error(`${toolName} validation error: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

function validateParameter(
  name: string,
  value: any,
  schema: ParameterSchema
): Either<Error, any> {
  const typeValidation = validateParameterType(name, value, schema.type);
  if (typeValidation._tag === 'Left') {
    return typeValidation;
  }

  switch (schema.type) {
    case 'string':
      return validateStringParameter(name, value, schema);
    case 'number':
      return validateNumberParameter(name, value, schema);
    case 'boolean':
      return validateBooleanParameter(name, value);
    case 'object':
      return validateObjectParameter(name, value);
    case 'array':
      return validateArrayParameter(name, value);
    default:
      return right(value);
  }
}

function validateParameterType(
  name: string,
  value: any,
  expectedType: string
): Either<Error, any> {
  const actualType = Array.isArray(value) ? 'array' : typeof value;
  
  if (expectedType === 'number' && actualType === 'string') {
      const numValue = Number(value);
    if (!isNaN(numValue)) {
      return right(numValue);
    }
  }

  if (expectedType === 'boolean' && actualType === 'string') {
      if (value === 'true') return right(true);
    if (value === 'false') return right(false);
  }

  if (actualType !== expectedType) {
    return left(new Error(`Parameter ${name} must be of type ${expectedType}, got ${actualType}`));
  }

  return right(value);
}

function validateStringParameter(
  name: string,
  value: string,
  schema: ParameterSchema
): Either<Error, string> {
  if (schema.minLength && value.length < schema.minLength) {
    return left(new Error(`Parameter ${name} must be at least ${schema.minLength} characters long`));
  }

  if (schema.maxLength && value.length > schema.maxLength) {
    return left(new Error(`Parameter ${name} must be at most ${schema.maxLength} characters long`));
  }

  if (schema.enum && !schema.enum.includes(value)) {
    return left(new Error(`Parameter ${name} must be one of: ${schema.enum.join(', ')}`));
  }

  if (name === 'description' || name === 'changes') {
    const securityValidation = validateSecureString(name, value);
    if (securityValidation._tag === 'Left') {
      return left(new Error(`Parameter ${name} failed security validation: ${securityValidation.left.message}`));
    }
    value = securityValidation.right;
  }

  if (name.endsWith('Id')) {
    const idValidation = validateIdFormat(value);
    if (idValidation._tag === 'Left') {
      return idValidation;
    }
  }

  return right(value.trim());
}

function validateNumberParameter(
  name: string,
  value: number,
  schema: ParameterSchema
): Either<Error, number> {
  if (!Number.isFinite(value)) {
    return left(new Error(`Parameter ${name} must be a finite number`));
  }

  if (schema.minimum !== undefined && value < schema.minimum) {
    return left(new Error(`Parameter ${name} must be at least ${schema.minimum}`));
  }

  if (schema.maximum !== undefined && value > schema.maximum) {
    return left(new Error(`Parameter ${name} must be at most ${schema.maximum}`));
  }

  return right(value);
}

function validateBooleanParameter(name: string, value: boolean): Either<Error, boolean> {
  return right(value);
}

function validateObjectParameter(name: string, value: any): Either<Error, any> {
  if (value === null) {
    return left(new Error(`Parameter ${name} cannot be null`));
  }

  return right(value);
}

function validateArrayParameter(name: string, value: any[]): Either<Error, any[]> {
  return right(value);
}

function validateIdFormat(id: string): Either<Error, string> {
  if (!id || id.trim().length === 0) {
    return left(new Error('ID cannot be empty'));
  }

  const trimmedId = id.trim();

  if (trimmedId.length < 3) {
    return left(new Error('ID must be at least 3 characters long'));
  }

  if (trimmedId.length > 100) {
    return left(new Error('ID must be at most 100 characters long'));
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedId)) {
    return left(new Error('ID can only contain letters, numbers, hyphens, and underscores'));
  }

  return right(trimmedId);
}

export function validateComponentDescription(description: string): Either<Error, string> {
  if (!description || typeof description !== 'string') {
    return left(new Error('Description must be a non-empty string'));
  }

  const trimmed = description.trim();

  if (trimmed.length < 10) {
    return left(new Error('Description must be at least 10 characters long'));
  }

  if (trimmed.length > 5000) {
    return left(new Error('Description must be at most 5000 characters long'));
  }

  const securityValidation = validateSecureString('description', trimmed);
  if (securityValidation._tag === 'Left') {
    return left(new Error(`Description failed security validation: ${securityValidation.left.message}`));
  }
  
  return right(securityValidation.right);

  return right(trimmed);
}

export function validateChatId(chatId: string): Either<Error, string> {
  if (!chatId || typeof chatId !== 'string') {
    return left(new Error('Chat ID must be a non-empty string'));
  }

  return validateIdFormat(chatId);
}