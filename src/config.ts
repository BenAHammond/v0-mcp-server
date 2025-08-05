/**
 * Server Configuration and Validation
 * 
 * Manages server configuration with validation, default values, and metadata
 * per requirements TR-3, QR-2, and C-2.
 */

import { PERFORMANCE_LIMITS } from './types.js';

export interface ServerConfig {
  name: string;
  version: string;
  apiKey: string;
  verbose?: boolean;
  timeout?: number;
  maxMemoryMB?: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Partial<ServerConfig> = {
  name: 'v0-mcp-server',
  version: '1.0.0',
  verbose: false
};

/**
 * Environment variable names for configuration
 */
export const ENV_VARS = {
  API_KEY: 'V0_API_KEY',
  VERBOSE: 'V0_VERBOSE',
  TIMEOUT: 'V0_TIMEOUT',
  MAX_MEMORY: 'V0_MAX_MEMORY'
} as const;

/**
 * Configuration validation results
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  config?: ServerConfig;
}

/**
 * Server configuration manager
 */
export class ConfigManager {
  private config: ServerConfig;

  /**
   * Creates a new ConfigManager instance
   * @param initialConfig - Initial configuration values
   */
  constructor(initialConfig: Partial<ServerConfig> = {}) {
    this.config = this.buildConfig(initialConfig);
    this.validateConfig();
  }

  /**
   * Builds complete configuration from partial config and environment
   * @param partial - Partial configuration
   * @returns Complete configuration
   */
  private buildConfig(partial: Partial<ServerConfig>): ServerConfig {
    // Import env helpers at runtime to avoid circular dependencies
    const getEnvString = (name: string, options?: { defaultValue?: string }) => process.env[name] || options?.defaultValue || '';
    const getEnvBoolean = (name: string) => process.env[name] === 'true';
    const getEnvNumber = (name: string) => process.env[name] ? parseInt(process.env[name], 10) : undefined;
    
    return {
      name: partial.name || DEFAULT_CONFIG.name!,
      version: partial.version || DEFAULT_CONFIG.version!,
      apiKey: partial.apiKey || getEnvString(ENV_VARS.API_KEY, { defaultValue: '' }),
      verbose: partial.verbose ?? getEnvBoolean(ENV_VARS.VERBOSE) ?? DEFAULT_CONFIG.verbose!,
      timeout: partial.timeout ?? getEnvNumber(ENV_VARS.TIMEOUT),
      maxMemoryMB: partial.maxMemoryMB ?? getEnvNumber(ENV_VARS.MAX_MEMORY)
    };
  }

  /**
   * Validates the complete configuration
   * @throws Error if configuration is invalid
   */
  private validateConfig(): void {
    const result = this.validate(this.config);
    
    if (!result.valid) {
      throw new Error(
        `Configuration validation failed:\n${result.errors.join('\n')}`
      );
    }

    // Log warnings if in verbose mode
    if (result.warnings.length > 0 && this.config.verbose) {
      console.error('Configuration warnings:');
      result.warnings.forEach(warning => console.error(`  - ${warning}`));
    }
  }

  /**
   * Gets the validated configuration
   * @returns Server configuration
   */
  getConfig(): ServerConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration with new values
   * @param updates - Configuration updates
   * @returns Updated configuration
   */
  updateConfig(updates: Partial<ServerConfig>): ServerConfig {
    const newConfig = { ...this.config, ...updates };
    const result = this.validate(newConfig);
    
    if (!result.valid) {
      throw new Error(
        `Configuration update failed:\n${result.errors.join('\n')}`
      );
    }

    this.config = newConfig;
    return { ...this.config };
  }

  /**
   * Validates a configuration object
   * @param config - Configuration to validate
   * @returns Validation result
   */
  validate(config: ServerConfig): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!config.name || typeof config.name !== 'string') {
      errors.push('Server name is required and must be a string');
    } else if (config.name.length === 0) {
      errors.push('Server name cannot be empty');
    }

    if (!config.version || typeof config.version !== 'string') {
      errors.push('Server version is required and must be a string');
    } else if (!this.isValidVersion(config.version)) {
      warnings.push(`Version '${config.version}' does not follow semantic versioning`);
    }

    if (!config.apiKey || typeof config.apiKey !== 'string') {
      errors.push('API key is required and must be a string');
    } else if (config.apiKey.length < 10) {
      errors.push('API key appears to be invalid (too short)');
    }

    // Validate optional fields only if provided
    if (config.verbose !== undefined && typeof config.verbose !== 'boolean') {
      errors.push('Verbose setting must be a boolean');
    }

    if (config.timeout !== undefined) {
      if (typeof config.timeout !== 'number' || config.timeout <= 0) {
        errors.push('Timeout must be a positive number');
      }
    }

    if (config.maxMemoryMB !== undefined) {
      if (typeof config.maxMemoryMB !== 'number' || config.maxMemoryMB <= 0) {
        errors.push('Max memory must be a positive number');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      config: errors.length === 0 ? config : undefined
    };
  }

  /**
   * Creates configuration from environment variables
   * @returns Configuration object
   */
  static fromEnvironment(): ConfigManager {
    // Import env helpers at runtime to avoid circular dependencies
    const getEnvString = (name: string, options?: { defaultValue?: string }) => process.env[name] || options?.defaultValue || '';
    const getEnvBoolean = (name: string) => process.env[name] === 'true';
    const getEnvNumber = (name: string) => process.env[name] ? parseInt(process.env[name], 10) : undefined;
    
    const envConfig: Partial<ServerConfig> = {
      apiKey: getEnvString(ENV_VARS.API_KEY),
      verbose: getEnvBoolean(ENV_VARS.VERBOSE),
      timeout: getEnvNumber(ENV_VARS.TIMEOUT),
      maxMemoryMB: getEnvNumber(ENV_VARS.MAX_MEMORY)
    };

    return new ConfigManager(envConfig);
  }

  /**
   * Creates configuration from CLI arguments
   * @param args - CLI arguments
   * @returns Configuration object
   */
  static fromCliArgs(args: {
    apiKey?: string;
    verbose?: boolean;
    timeout?: number;
    maxMemory?: number;
  }): ConfigManager {
    const cliConfig: Partial<ServerConfig> = {
      apiKey: args.apiKey,
      verbose: args.verbose,
      timeout: args.timeout,
      maxMemoryMB: args.maxMemory
    };

    return new ConfigManager(cliConfig);
  }

  /**
   * Loads package.json information for server metadata
   * @returns Package information or defaults
   */
  static async loadPackageInfo(): Promise<{ name: string; version: string }> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const url = await import('url');
      
      const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
      const packagePath = path.join(__dirname, '..', 'package.json');
      
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        return {
          name: packageJson.name || DEFAULT_CONFIG.name!,
          version: packageJson.version || DEFAULT_CONFIG.version!
        };
      }
    } catch (error) {
      // Fallback to defaults if package.json is not available
    }
    
    return {
      name: DEFAULT_CONFIG.name!,
      version: DEFAULT_CONFIG.version!
    };
  }

  /**
   * Gets configuration summary for logging
   * @returns Safe configuration summary (no sensitive data)
   */
  getConfigSummary(): {
    name: string;
    version: string;
    hasApiKey: boolean;
    verbose: boolean;
    timeout: number;
    maxMemoryMB: number;
  } {
    return {
      name: this.config.name,
      version: this.config.version,
      hasApiKey: Boolean(this.config.apiKey),
      verbose: this.config.verbose || false,
      timeout: this.config.timeout || 30000,
      maxMemoryMB: this.config.maxMemoryMB || 100
    };
  }

  /**
   * Checks if current configuration is within recommended limits
   * @returns Compliance check result
   */
  checkCompliance(): {
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check API key format
    if (!this.config.apiKey.startsWith('v1:') && !this.config.apiKey.startsWith('v0_')) {
      issues.push('API key does not follow expected format');
      recommendations.push('Ensure you are using a valid v0.dev API key');
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations
    };
  }


  /**
   * Validates semantic version format
   * @param version - Version string to validate
   * @returns true if valid semantic version
   */
  private isValidVersion(version: string): boolean {
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
    return semverRegex.test(version);
  }
}

/**
 * Utility function to create configuration from multiple sources
 * @param sources - Configuration sources in priority order
 * @returns Merged configuration
 */
export function createConfig(...sources: Partial<ServerConfig>[]): ConfigManager {
  const merged = sources.reduce((acc, source) => ({ ...acc, ...source }), {});
  return new ConfigManager(merged);
}

/**
 * Utility function to validate configuration without creating manager
 * @param config - Configuration to validate
 * @returns Validation result
 */
export function validateConfig(config: ServerConfig): ConfigValidationResult {
  const manager = new ConfigManager();
  return manager.validate(config);
}

/**
 * Gets configuration help text for CLI
 * @returns Help text describing configuration options
 */
export function getConfigHelp(): string {
  return `
Configuration Options:

Environment Variables:
  ${ENV_VARS.API_KEY}       v0.dev API key (required)
  ${ENV_VARS.VERBOSE}       Enable verbose logging (true/false)
  ${ENV_VARS.TIMEOUT}       Tool execution timeout in ms (default: ${DEFAULT_CONFIG.timeout})
  ${ENV_VARS.MAX_MEMORY}    Maximum memory usage in MB (default: ${DEFAULT_CONFIG.maxMemoryMB})

CLI Arguments:
  --api-key              v0.dev API key (overrides environment)
  --verbose              Enable verbose logging
  --timeout              Tool execution timeout in ms
  --max-memory           Maximum memory usage in MB

Examples:
  # Using environment variable
  export V0_API_KEY=your_key_here
  npx v0-mcp-server

  # Using CLI argument
  npx v0-mcp-server --api-key your_key_here --verbose

Get your API key from: https://v0.dev/chat/settings/keys
`;
}