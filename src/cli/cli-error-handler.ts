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
 * A conditional troubleshooting sub-section rendered beneath an error block.
 */
interface ErrorSubsection {
  header: string;
  bullets: string[];
  /** When omitted, the sub-section is always rendered. */
  matches?: (message: string, context: CliErrorContext) => boolean;
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
   * Renders the shared error-block scaffold: a yellow header, a blue intro
   * line, a bullet list, then any conditional sub-sections.
   */
  private static renderErrorBlock(
    header: string,
    intro: string,
    bullets: string[],
    subsections: ErrorSubsection[],
    message: string,
    context: CliErrorContext
  ): void {
    console.error(chalk.yellow(header));
    console.error();
    console.error(chalk.blue(intro));
    for (const bullet of bullets) console.error(`✓ ${bullet}`);
    console.error();
    for (const sub of subsections) {
      if (!sub.matches || sub.matches(message, context)) {
        console.error(chalk.blue(sub.header));
        for (const bullet of sub.bullets) console.error(`✓ ${bullet}`);
      }
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
    this.renderErrorBlock(
      '🌐 Network Connection Issue',
      '💡 Troubleshooting steps:',
      [
        'Check your internet connection',
        'Verify you can access https://v0.dev in a browser',
        'Check if you\'re behind a corporate firewall',
        'Try connecting from a different network'
      ],
      [
        {
          header: '🔍 DNS Resolution Issue:',
          bullets: [
            'Try using a different DNS server (8.8.8.8, 1.1.1.1)',
            'Flush your DNS cache',
            'Check /etc/hosts file for conflicts'
          ],
          matches: (m) => m.includes('DNS') || m.includes('getaddrinfo')
        },
        {
          header: '🔍 Proxy/Firewall Issue:',
          bullets: [
            'Configure proxy settings if behind corporate firewall',
            'Check if ports 80/443 are blocked',
            'Try from a different network to isolate the issue'
          ],
          matches: (m) => m.includes('proxy') || m.includes('ECONNREFUSED')
        }
      ],
      message,
      context
    );
  }

  /**
   * Handles configuration related errors
   */
  private static handleConfigurationError(message: string, context: CliErrorContext): void {
    this.renderErrorBlock(
      '⚙️  Configuration Issue',
      '💡 Configuration help:',
      [
        'Run `npx v0-mcp-server config` to see all options',
        'Use `npx v0-mcp-server --validate` to check settings',
        'Try `npx v0-mcp-server --help` for usage examples'
      ],
      [
        {
          header: '🕐 Timeout Configuration:',
          bullets: [
            'Increase timeout: --timeout 60000 (60 seconds)',
            'Default timeout is 30 seconds'
          ],
          matches: (m) => m.includes('timeout')
        },
        {
          header: '💾 Memory Configuration:',
          bullets: [
            'Increase memory limit: --max-memory 200',
            'Default limit is 100MB'
          ],
          matches: (m) => m.includes('memory')
        }
      ],
      message,
      context
    );
  }

  /**
   * Handles permission related errors
   */
  private static handlePermissionError(message: string, context: CliErrorContext): void {
    this.renderErrorBlock(
      '🔒 Permission Issue',
      '💡 Permission troubleshooting:',
      [
        'Make sure you have permission to run the server',
        'Check if another process is using the same resources',
        'Try running with appropriate permissions'
      ],
      [
        {
          header: '🔍 File Permission Issue:',
          bullets: [
            'Check file/directory permissions',
            'Ensure you can write to the current directory'
          ],
          matches: (m) => m.includes('EACCES')
        },
        {
          header: '🔍 Port Already in Use:',
          bullets: [
            'Another MCP server may already be running',
            'Kill existing processes and try again'
          ],
          matches: (m) => m.includes('EADDRINUSE')
        }
      ],
      message,
      context
    );
  }

  /**
   * Handles v0.dev service related errors
   */
  private static handleV0ServiceError(message: string, context: CliErrorContext): void {
    this.renderErrorBlock(
      '🚀 v0.dev Service Issue',
      '💡 Service troubleshooting:',
      [
        'Check v0.dev service status',
        'Try again in a few minutes',
        'Verify your API quota hasn\'t been exceeded'
      ],
      [
        {
          header: '🔍 Rate Limiting:',
          bullets: [
            'Wait a few minutes before trying again',
            'Check your v0.dev account usage limits',
            'Consider upgrading your v0.dev plan if needed'
          ],
          matches: (m) => m.includes('rate limit') || m.includes('quota')
        },
        {
          header: '🔍 Server Error:',
          bullets: [
            'v0.dev service may be temporarily unavailable',
            'Check https://status.v0.dev for service status',
            'Try again in a few minutes'
          ],
          matches: (m) => m.includes('500') || m.includes('502') || m.includes('503')
        }
      ],
      message,
      context
    );
  }

  /**
   * Handles timeout related errors
   */
  private static handleTimeoutError(message: string, context: CliErrorContext): void {
    this.renderErrorBlock(
      '⏱️  Timeout Issue',
      '💡 Timeout solutions:',
      [
        'Increase timeout: --timeout 60000 (60 seconds)',
        'Check your internet connection speed',
        'Try a simpler component description',
        'Break complex requests into smaller parts'
      ],
      [
        {
          header: '🔍 Startup Timeout:',
          bullets: [
            'Check API key validity',
            'Verify network connectivity to v0.dev'
          ],
          matches: (_m, ctx) => ctx.phase === 'startup'
        }
      ],
      message,
      context
    );
  }

  /**
   * Handles memory related errors
   */
  private static handleMemoryError(message: string, context: CliErrorContext): void {
    this.renderErrorBlock(
      '💾 Memory Issue',
      '💡 Memory solutions:',
      [
        'Increase memory limit: --max-memory 200',
        'Restart the server to clear memory',
        'Process smaller requests',
        'Close other applications to free memory'
      ],
      [
        {
          header: '🔍 Memory Optimization:',
          bullets: [
            'Run with --verbose to monitor memory usage',
            'Consider running on a machine with more RAM'
          ]
        }
      ],
      message,
      context
    );
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
   * Prints the shared bold-blue title followed by a blank line.
   */
  private static printTitle(title: string): void {
    console.log(chalk.bold.blue(title));
    console.log();
  }

  /**
   * Prints a yellow-labelled block: the label, its content lines, then a blank line.
   */
  private static printSection(label: string, lines: string[]): void {
    console.log(chalk.yellow(label));
    for (const line of lines) console.log(line);
    console.log();
  }

  /**
   * Prints a numbered troubleshooting issue (green title + problem + solution).
   */
  private static printIssue(title: string, problem: string, solution: string): void {
    console.log(chalk.green(title));
    console.log(`   ${problem}`);
    console.log(`   ${solution}`);
    console.log();
  }

  /**
   * Shows quick start guide
   */
  static showQuickStart(): void {
    this.printTitle('🚀 Quick Start Guide');
    this.printSection('Step 1: Get your API key', [
      `  Visit: ${chalk.cyan(SETUP_URL)}`,
      '  Sign in and generate a new API key'
    ]);
    this.printSection('Step 2: Start the server', [
      '  npx v0-mcp-server --api-key YOUR_KEY'
    ]);
    this.printSection('Step 3: Use with Claude Code', [
      '  The server will listen for MCP requests automatically',
      '  Core tools: generate, list_chats, get_chat, deploy, rate_limits',
      '  Plus: list_versions, get_version, deploy_logs, init_code, projects, reports'
    ]);
    console.log(chalk.blue('💡 Tip: Run with --verbose for detailed logging'));
  }

  /**
   * Shows troubleshooting guide
   */
  static showTroubleshooting(): void {
    this.printTitle('🔧 Troubleshooting Guide');
    console.log(chalk.yellow('Common Issues:'));
    console.log();

    this.printIssue('1. API Key Problems', '❌ "API key is required"', '✅ Solution: npx v0-mcp-server --api-key YOUR_KEY');
    this.printIssue('2. Network Issues', '❌ "Unable to connect"', '✅ Solution: Check internet connection and firewall settings');
    this.printIssue('3. Configuration Issues', '❌ "Configuration validation failed"', '✅ Solution: Run npx v0-mcp-server --validate');
    this.printIssue('4. Performance Issues', '❌ "Memory limit exceeded" or "Timeout"', '✅ Solution: Increase limits with --max-memory and --timeout');

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
    this.printTitle('📚 Usage Examples');
    this.printSection('Basic Usage:', [
      '  npx v0-mcp-server --api-key v0_your_key_here'
    ]);
    this.printSection('With Environment Variable:', [
      '  export V0_API_KEY=v0_your_key_here',
      '  npx v0-mcp-server'
    ]);
    this.printSection('Development Mode:', [
      '  npx v0-mcp-server --api-key YOUR_KEY --verbose'
    ]);
    this.printSection('Custom Configuration:', [
      '  npx v0-mcp-server \\',
      '    --api-key YOUR_KEY \\',
      '    --timeout 60000 \\',
      '    --max-memory 200 \\',
      '    --verbose'
    ]);
    this.printSection('Validation:', [
      '  npx v0-mcp-server --validate --verbose'
    ]);
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
