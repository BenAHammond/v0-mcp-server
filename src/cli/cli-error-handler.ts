/**
 * CLI Error Handling and Help System
 * 
 * Implements CLI-specific error handling with setup guidance and troubleshooting
 * per requirements US-4 and QR-1.
 */

import chalk from 'chalk';
import { SETUP_URL } from '../types.js';

export interface McpError {
  code: string;
  message: string;
  data?: any;
}
import { getApiKeySetupInstructions } from '../auth.js';
import { getConfigHelp } from '../config.js';

/**
 * CLI error context
 */
export interface CliErrorContext {
  command?: string;
  options?: Record<string, any>;
  phase?: 'startup' | 'validation' | 'execution' | 'shutdown';
  apiKeyProvided?: boolean;
}

/**
 * CLI error handler for user-friendly error messages and guidance
 */
export class CliErrorHandler {
  /**
   * Handles any CLI error and provides user-friendly output
   * @param error - Error to handle
   * @param context - CLI context information
   */
  static handle(error: unknown, context: CliErrorContext = {}): void {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Display the main error
    console.error(chalk.red('❌ Error: ') + message);
    console.error();

    // Provide specific guidance based on error type
    this.provideSpecificGuidance(message, context);
    
    // Show general troubleshooting if no specific guidance was provided
    if (!this.hasSpecificGuidance(message)) {
      this.showGeneralTroubleshooting(context);
    }
  }

  /**
   * Provides specific guidance based on error message patterns
   * @param message - Error message
   * @param context - CLI context
   */
  private static provideSpecificGuidance(message: string, context: CliErrorContext): void {
    // API key related errors
    if (this.isApiKeyError(message)) {
      this.handleApiKeyError(message, context);
      return;
    }

    // Network related errors
    if (this.isNetworkError(message)) {
      this.handleNetworkError(message, context);
      return;
    }

    // Configuration errors
    if (this.isConfigurationError(message)) {
      this.handleConfigurationError(message, context);
      return;
    }

    // Permission errors
    if (this.isPermissionError(message)) {
      this.handlePermissionError(message, context);
      return;
    }

    // v0.dev service errors
    if (this.isV0ServiceError(message)) {
      this.handleV0ServiceError(message, context);
      return;
    }

    // Timeout errors
    if (this.isTimeoutError(message)) {
      this.handleTimeoutError(message, context);
      return;
    }

    // Memory errors
    if (this.isMemoryError(message)) {
      this.handleMemoryError(message, context);
      return;
    }
  }

  /**
   * Handles API key related errors
   */
  private static handleApiKeyError(message: string, context: CliErrorContext): void {
    console.error(chalk.yellow('🔑 API Key Issue Detected'));
    console.error();

    if (!context.apiKeyProvided) {
      console.error(chalk.blue('💡 You need to provide a v0.dev API key:'));
      console.error();
      console.error(chalk.green('Option 1: Command line argument'));
      console.error('  npx v0-mcp-server --api-key YOUR_KEY');
      console.error();
      console.error(chalk.green('Option 2: Environment variable'));
      console.error('  export V0_API_KEY=YOUR_KEY');
      console.error('  npx v0-mcp-server');
      console.error();
    } else {
      console.error(chalk.blue('💡 Your API key appears to be invalid:'));
      console.error();
      console.error('✓ Check that your key starts with "v0_"');
      console.error('✓ Ensure you copied the complete key');
      console.error('✓ Verify the key hasn\'t expired');
      console.error();
    }

    console.error(chalk.cyan(`🔗 Get your API key from: ${SETUP_URL}`));
    console.error();
    console.error(chalk.gray('💡 Tip: Run `npx v0-mcp-server --validate` to test your configuration'));
  }

  /**
   * Handles network related errors
   */
  private static handleNetworkError(message: string, context: CliErrorContext): void {
    console.error(chalk.yellow('🌐 Network Connection Issue'));
    console.error();
    
    console.error(chalk.blue('💡 Troubleshooting steps:'));
    console.error('✓ Check your internet connection');
    console.error('✓ Verify you can access https://v0.dev in a browser');
    console.error('✓ Check if you\'re behind a corporate firewall');
    console.error('✓ Try connecting from a different network');
    console.error();
    
    if (message.includes('DNS') || message.includes('getaddrinfo')) {
      console.error(chalk.blue('🔍 DNS Resolution Issue:'));
      console.error('✓ Try using a different DNS server (8.8.8.8, 1.1.1.1)');
      console.error('✓ Flush your DNS cache');
      console.error('✓ Check /etc/hosts file for conflicts');
    }

    if (message.includes('proxy') || message.includes('ECONNREFUSED')) {
      console.error(chalk.blue('🔍 Proxy/Firewall Issue:'));
      console.error('✓ Configure proxy settings if behind corporate firewall');
      console.error('✓ Check if ports 80/443 are blocked');
      console.error('✓ Try from a different network to isolate the issue');
    }
  }

  /**
   * Handles configuration related errors
   */
  private static handleConfigurationError(message: string, context: CliErrorContext): void {
    console.error(chalk.yellow('⚙️  Configuration Issue'));
    console.error();
    
    console.error(chalk.blue('💡 Configuration help:'));
    console.error('✓ Run `npx v0-mcp-server config` to see all options');
    console.error('✓ Use `npx v0-mcp-server --validate` to check settings');
    console.error('✓ Try `npx v0-mcp-server --help` for usage examples');
    console.error();

    if (message.includes('timeout')) {
      console.error(chalk.blue('🕐 Timeout Configuration:'));
      console.error('✓ Increase timeout: --timeout 60000 (60 seconds)');
      console.error('✓ Default timeout is 30 seconds');
    }

    if (message.includes('memory')) {
      console.error(chalk.blue('💾 Memory Configuration:'));
      console.error('✓ Increase memory limit: --max-memory 200');
      console.error('✓ Default limit is 100MB');
    }
  }

  /**
   * Handles permission related errors
   */
  private static handlePermissionError(message: string, context: CliErrorContext): void {
    console.error(chalk.yellow('🔒 Permission Issue'));
    console.error();
    
    console.error(chalk.blue('💡 Permission troubleshooting:'));
    console.error('✓ Make sure you have permission to run the server');
    console.error('✓ Check if another process is using the same resources');
    console.error('✓ Try running with appropriate permissions');
    console.error();

    if (message.includes('EACCES')) {
      console.error(chalk.blue('🔍 File Permission Issue:'));
      console.error('✓ Check file/directory permissions');
      console.error('✓ Ensure you can write to the current directory');
    }

    if (message.includes('EADDRINUSE')) {
      console.error(chalk.blue('🔍 Port Already in Use:'));
      console.error('✓ Another MCP server may already be running');
      console.error('✓ Kill existing processes and try again');
    }
  }

  /**
   * Handles v0.dev service related errors
   */
  private static handleV0ServiceError(message: string, context: CliErrorContext): void {
    console.error(chalk.yellow('🚀 v0.dev Service Issue'));
    console.error();
    
    console.error(chalk.blue('💡 Service troubleshooting:'));
    console.error('✓ Check v0.dev service status');
    console.error('✓ Try again in a few minutes');
    console.error('✓ Verify your API quota hasn\'t been exceeded');
    console.error();

    if (message.includes('rate limit') || message.includes('quota')) {
      console.error(chalk.blue('🔍 Rate Limiting:'));
      console.error('✓ Wait a few minutes before trying again');
      console.error('✓ Check your v0.dev account usage limits');
      console.error('✓ Consider upgrading your v0.dev plan if needed');
    }

    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      console.error(chalk.blue('🔍 Server Error:'));
      console.error('✓ v0.dev service may be temporarily unavailable');
      console.error('✓ Check https://status.v0.dev for service status');
      console.error('✓ Try again in a few minutes');
    }
  }

  /**
   * Handles timeout related errors
   */
  private static handleTimeoutError(message: string, context: CliErrorContext): void {
    console.error(chalk.yellow('⏱️  Timeout Issue'));
    console.error();
    
    console.error(chalk.blue('💡 Timeout solutions:'));
    console.error('✓ Increase timeout: --timeout 60000 (60 seconds)');
    console.error('✓ Check your internet connection speed');
    console.error('✓ Try a simpler component description');
    console.error('✓ Break complex requests into smaller parts');
    console.error();

    if (context.phase === 'startup') {
      console.error(chalk.blue('🔍 Startup Timeout:'));
      console.error('✓ Check API key validity');
      console.error('✓ Verify network connectivity to v0.dev');
    }
  }

  /**
   * Handles memory related errors
   */
  private static handleMemoryError(message: string, context: CliErrorContext): void {
    console.error(chalk.yellow('💾 Memory Issue'));
    console.error();
    
    console.error(chalk.blue('💡 Memory solutions:'));
    console.error('✓ Increase memory limit: --max-memory 200');
    console.error('✓ Restart the server to clear memory');
    console.error('✓ Process smaller requests');
    console.error('✓ Close other applications to free memory');
    console.error();

    console.error(chalk.blue('🔍 Memory Optimization:'));
    console.error('✓ Run with --verbose to monitor memory usage');
    console.error('✓ Consider running on a machine with more RAM');
  }

  /**
   * Shows general troubleshooting information
   */
  private static showGeneralTroubleshooting(context: CliErrorContext): void {
    console.error(chalk.blue('🔧 General Troubleshooting:'));
    console.error();
    console.error('✓ Run with --verbose for detailed logs');
    console.error('✓ Use --validate to check your configuration');
    console.error('✓ Try restarting the server');
    console.error('✓ Check the latest documentation');
    console.error();
    
    console.error(chalk.blue('📚 Helpful Commands:'));
    console.error('  npx v0-mcp-server --help       Show usage help');
    console.error('  npx v0-mcp-server config       Show configuration options');
    console.error('  npx v0-mcp-server --validate   Test your setup');
    console.error();
    
    console.error(chalk.cyan('🔗 Resources:'));
    console.error(`  API Keys: ${SETUP_URL}`);
    console.error('  Documentation: https://github.com/your-repo/v0-mcp-server');
    console.error('  Issues: https://github.com/your-repo/v0-mcp-server/issues');
  }

  /**
   * Error pattern detection methods
   */
  
  private static isApiKeyError(message: string): boolean {
    return /api[\s_-]?key|unauthorized|invalid.*key|missing.*key/i.test(message);
  }

  private static isNetworkError(message: string): boolean {
    return /network|connect|timeout|dns|econnrefused|enotfound|etimedout/i.test(message);
  }

  private static isConfigurationError(message: string): boolean {
    return /config|invalid.*option|timeout.*\d+|memory.*\d+|validation.*failed/i.test(message);
  }

  private static isPermissionError(message: string): boolean {
    return /permission|eacces|eaddrinuse|access.*denied|forbidden/i.test(message);
  }

  private static isV0ServiceError(message: string): boolean {
    return /v0\.dev|rate.*limit|quota|500|502|503|service.*unavailable/i.test(message);
  }

  private static isTimeoutError(message: string): boolean {
    return /timeout|timed.*out|\d+ms/i.test(message);
  }

  private static isMemoryError(message: string): boolean {
    return /memory|heap|out.*of.*memory|allocation.*failed/i.test(message);
  }

  private static hasSpecificGuidance(message: string): boolean {
    return this.isApiKeyError(message) ||
           this.isNetworkError(message) ||
           this.isConfigurationError(message) ||
           this.isPermissionError(message) ||
           this.isV0ServiceError(message) ||
           this.isTimeoutError(message) ||
           this.isMemoryError(message);
  }
}

/**
 * CLI help system for providing contextual assistance
 */
export class CliHelpSystem {
  /**
   * Shows quick start guide
   */
  static showQuickStart(): void {
    console.log(chalk.bold.blue('🚀 Quick Start Guide'));
    console.log();
    console.log(chalk.yellow('Step 1: Get your API key'));
    console.log(`  Visit: ${chalk.cyan(SETUP_URL)}`);
    console.log('  Sign in and generate a new API key');
    console.log();
    console.log(chalk.yellow('Step 2: Start the server'));
    console.log('  npx v0-mcp-server --api-key YOUR_KEY');
    console.log();
    console.log(chalk.yellow('Step 3: Use with Claude Code'));
    console.log('  The server will listen for MCP requests automatically');
    console.log('  Use the generate_component and iterate_component tools');
    console.log();
    console.log(chalk.blue('💡 Tip: Run with --verbose for detailed logging'));
  }

  /**
   * Shows troubleshooting guide
   */
  static showTroubleshooting(): void {
    console.log(chalk.bold.blue('🔧 Troubleshooting Guide'));
    console.log();
    
    console.log(chalk.yellow('Common Issues:'));
    console.log();
    
    console.log(chalk.green('1. API Key Problems'));
    console.log('   ❌ "API key is required"');
    console.log('   ✅ Solution: npx v0-mcp-server --api-key YOUR_KEY');
    console.log();
    
    console.log(chalk.green('2. Network Issues'));
    console.log('   ❌ "Unable to connect"');
    console.log('   ✅ Solution: Check internet connection and firewall settings');
    console.log();
    
    console.log(chalk.green('3. Configuration Issues'));
    console.log('   ❌ "Configuration validation failed"');
    console.log('   ✅ Solution: Run npx v0-mcp-server --validate');
    console.log();
    
    console.log(chalk.green('4. Performance Issues'));
    console.log('   ❌ "Memory limit exceeded" or "Timeout"');
    console.log('   ✅ Solution: Increase limits with --max-memory and --timeout');
    console.log();
    
    console.log(chalk.blue('🔍 Diagnostic Commands:'));
    console.log('  --validate       Test your configuration');
    console.log('  --verbose        Enable detailed logging');
    console.log('  config           Show configuration options');
    console.log('  help             Show detailed help');
  }

  /**
   * Shows examples for common use cases
   */
  static showExamples(): void {
    console.log(chalk.bold.blue('📚 Usage Examples'));
    console.log();
    
    console.log(chalk.yellow('Basic Usage:'));
    console.log('  npx v0-mcp-server --api-key v0_your_key_here');
    console.log();
    
    console.log(chalk.yellow('With Environment Variable:'));
    console.log('  export V0_API_KEY=v0_your_key_here');
    console.log('  npx v0-mcp-server');
    console.log();
    
    console.log(chalk.yellow('Development Mode:'));
    console.log('  npx v0-mcp-server --api-key YOUR_KEY --verbose');
    console.log();
    
    console.log(chalk.yellow('Custom Configuration:'));
    console.log('  npx v0-mcp-server \\');
    console.log('    --api-key YOUR_KEY \\');
    console.log('    --timeout 60000 \\');
    console.log('    --max-memory 200 \\');
    console.log('    --verbose');
    console.log();
    
    console.log(chalk.yellow('Validation:'));
    console.log('  npx v0-mcp-server --validate --verbose');
  }
}

/**
 * Utility functions for CLI error handling
 */

/**
 * Handles CLI startup errors with appropriate guidance
 * @param error - Startup error
 * @param options - CLI options that were used
 */
export function handleStartupError(error: unknown, options: Record<string, any> = {}): void {
  CliErrorHandler.handle(error, {
    phase: 'startup',
    options,
    apiKeyProvided: Boolean(options.apiKey || process.env.V0_API_KEY)
  });
}

/**
 * Handles CLI validation errors
 * @param error - Validation error
 * @param options - CLI options that were used
 */
export function handleValidationError(error: unknown, options: Record<string, any> = {}): void {
  CliErrorHandler.handle(error, {
    phase: 'validation',
    options,
    apiKeyProvided: Boolean(options.apiKey || process.env.V0_API_KEY)
  });
}

/**
 * Handles CLI execution errors
 * @param error - Execution error
 * @param command - Command that was being executed
 * @param options - CLI options that were used
 */
export function handleExecutionError(
  error: unknown, 
  command: string = 'unknown',
  options: Record<string, any> = {}
): void {
  CliErrorHandler.handle(error, {
    phase: 'execution',
    command,
    options,
    apiKeyProvided: Boolean(options.apiKey || process.env.V0_API_KEY)
  });
}

/**
 * Shows contextual help based on error patterns
 * @param error - Error that occurred
 */
export function showContextualHelp(error: unknown): void {
  const message = error instanceof Error ? error.message : '';
  
  if (message.includes('API key')) {
    console.log();
    console.log(getApiKeySetupInstructions());
  } else if (message.includes('config')) {
    console.log();
    console.log(getConfigHelp());
  } else {
    console.log();
    CliHelpSystem.showQuickStart();
  }
}