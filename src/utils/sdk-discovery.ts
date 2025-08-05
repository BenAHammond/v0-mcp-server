import { DiscoveredMethod, MethodParameter, SdkNamespace, DiscoveryResult } from '../types.js';

export function introspectSdkClient(client: any): DiscoveryResult {
  const methods: DiscoveredMethod[] = [];
  const errors: string[] = [];

  for (const namespace of Object.values(SdkNamespace)) {
    try {
      const namespaceMethods = discoverNamespaceMethods(client, namespace);
      methods.push(...namespaceMethods);
    } catch (error) {
      errors.push(`Failed to discover ${namespace}: ${error}`);
    }
  }

  const additionalNamespaces = discoverAdditionalNamespaces(client);
  for (const namespace of additionalNamespaces) {
    try {
      const namespaceMethods = discoverNamespaceMethods(client, namespace);
      methods.push(...namespaceMethods);
    } catch (error) {
      errors.push(`Failed to discover ${namespace}: ${error}`);
    }
  }

  return {
    methods,
    totalDiscovered: methods.length,
    namespaces: [...Object.values(SdkNamespace), ...additionalNamespaces],
    errors
  };
}

function discoverNamespaceMethods(client: any, namespace: string): DiscoveredMethod[] {
  const methods: DiscoveredMethod[] = [];
  const namespaceObject = client[namespace];

  if (!namespaceObject || typeof namespaceObject !== 'object') {
    return methods;
  }

  if (namespace === 'integrations') {
    return discoverNestedNamespaceMethods(client, namespace, namespaceObject);
  }

  for (const [methodName, methodFunction] of Object.entries(namespaceObject)) {
    if (typeof methodFunction === 'function') {
      try {
        const discoveredMethod = createDiscoveredMethod(
          namespace,
          methodName,
          methodFunction as Function,
          `client.${namespace}.${methodName}`
        );
        methods.push(discoveredMethod);
      } catch (error) {
        console.warn(`Failed to introspect ${namespace}.${methodName}:`, error);
      }
    }
  }

  return methods;
}

function discoverNestedNamespaceMethods(client: any, namespace: string, namespaceObject: any): DiscoveredMethod[] {
  const methods: DiscoveredMethod[] = [];

  function inspectNestedObject(obj: any, currentPath: string[] = [namespace]) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'function') {
        try {
          const fullPath = currentPath.join('.');
          const methodPath = [...currentPath, key];
          const discoveredMethod = createDiscoveredMethod(
            fullPath,
            key,
            value as Function,
            `client.${methodPath.join('.')}`
          );
          methods.push(discoveredMethod);
        } catch (error) {
          console.warn(`Failed to introspect nested method ${currentPath.join('.')}:`, error);
        }
      } else if (value && typeof value === 'object' && currentPath.length < 3) {
        inspectNestedObject(value, currentPath);
      }
    }
  }

  inspectNestedObject(namespaceObject);
  return methods;
}

function discoverAdditionalNamespaces(client: any): string[] {
  const knownNamespaces = new Set(Object.values(SdkNamespace));
  const additionalNamespaces: string[] = [];

  for (const [key, value] of Object.entries(client)) {
    if (typeof value === 'object' && value !== null && !knownNamespaces.has(key as SdkNamespace)) {
      const hasMethods = Object.values(value).some(prop => typeof prop === 'function');
      if (hasMethods) {
        additionalNamespaces.push(key);
      }
    }
  }

  return additionalNamespaces;
}

function createDiscoveredMethod(
  namespace: string,
  method: string,
  sdkFunction: Function,
  fullPath: string
): DiscoveredMethod {
  return {
    namespace,
    method,
    toolName: generateToolName(namespace, method),
    sdkFunction,
    parameters: extractMethodParameters(sdkFunction),
    returnType: inferReturnType(sdkFunction),
    fullPath
  };
}

export function generateToolName(namespace: string, method: string): string {
  const normalizedNamespace = namespace.replace(/([A-Z])/g, '_$1').toLowerCase();
  const normalizedMethod = method.replace(/([A-Z])/g, '_$1').toLowerCase();
  
  return `${normalizedNamespace}_${normalizedMethod}`.replace(/^_/, '');
}

export function extractMethodParameters(fn: Function): MethodParameter[] {
  try {
    const fnString = fn.toString();
    const paramMatch = fnString.match(/\(([^)]*)\)/);
    
    if (!paramMatch || !paramMatch[1].trim()) {
      return [];
    }

    const paramString = paramMatch[1];
    const parameters: MethodParameter[] = [];

    const paramNames = paramString
      .split(',')
      .map(param => param.trim())
      .filter(param => param.length > 0);

    for (const paramName of paramNames) {
      const cleanName = paramName
        .split('=')[0]
        .split(':')[0]
        .trim()
        .replace(/[{}]/g, '');

      if (cleanName && cleanName !== '...args') {
        parameters.push({
          name: cleanName,
          type: inferParameterType(paramName),
          required: !paramName.includes('=') && !paramName.includes('?'),
          description: `Parameter for ${fn.name || 'method'}`
        });
      }
    }

    return parameters;
  } catch (error) {
    return [{
      name: 'params',
      type: 'object',
      required: false,
      description: 'Method parameters'
    }];
  }
}

function inferParameterType(paramString: string): string {
  if (paramString.includes(': string')) return 'string';
  if (paramString.includes(': number')) return 'number';
  if (paramString.includes(': boolean')) return 'boolean';
  if (paramString.includes('[]') || paramString.includes('Array')) return 'array';
  if (paramString.includes('{') || paramString.includes('object')) return 'object';
  
  return 'object';
}

function inferReturnType(fn: Function): string {
  const fnString = fn.toString();
  
  if (fnString.includes('Promise<') || fnString.includes('async ')) {
    return 'Promise<object>';
  }
  
  return 'object';
}