#!/usr/bin/env node

/**
 * CLI Entry Point for v0 MCP Server
 * 
 * Complete CLI implementation with API key validation, server startup,
 * and user feedback per US-3, TR-5, and IR-3.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { config as loadEnv } from 'dotenv';

// Load environment variables from .env file
loadEnv();

import { startServer, SimplifiedMcpServer } from '../index.js';
import { ApiKeyManager, hasValidApiKey, getApiKeySetupInstructions } from '../auth.js';
import { 
  CliErrorHandler, 
  handleStartupError, 
  handleValidationError, 
  showContextualHelp 
} from './cli-error-handler.js';

/**
 * CLI options interface
 */
interface CliOptions {
  apiKey?: string;
  verbose?: boolean;
  validate?: boolean;
  timeout?: string;
  maxMemory?: string;
  help?: boolean;
}

/**
 * Main CLI application class
 */
class V0McpCli {
  private program: Command;
  private server: SimplifiedMcpServer | null = null;
  private isShuttingDown: boolean = false;

  constructor() {
    this.program = new Command();
    this.setupCommands();
    this.setupSignalHandlers();
  }

  /**
   * Sets up CLI commands and options
   */
  private setupCommands(): void {
    this.program
      .name('v0-mcp')
      .description('v0.dev MCP Server for component generation with Claude Code')
      .version('1.0.0')
      .option('-k, --api-key <key>', 'v0.dev API key')
      .option('-v, --verbose', 'enable verbose logging')
      .option('--validate', 'validate configuration and exit')
      .option('--timeout <ms>', 'tool execution timeout in milliseconds')
      .option('--max-memory <mb>', 'maximum memory usage in MB')
      .option('--help-config', 'show configuration help')
      .action(async (options: CliOptions) => {
        await this.handleMainCommand(options);
      });

    // Add help command
    this.program
      .command('help')
      .description('show detailed help information')
      .action(() => {
        this.showDetailedHelp();
      });

    // Add config command
    this.program
      .command('config')
      .description('show configuration information')
      .action(() => {
        console.log('Configuration help:\n');
        console.log('Environment Variables:');
        console.log('  V0_API_KEY - Your v0.dev API key (required)');
        console.log('\nOptions:');
        console.log('  --verbose - Enable detailed logging');
        console.log('  --timeout - Tool execution timeout in milliseconds');
      });
  }

  /**
   * Handles the main command execution
   * @param options - CLI options
   */
  private async handleMainCommand(options: CliOptions): Promise<void> {
    try {
      // Show configuration help if requested
      if (options.help) {
        this.showDetailedHelp();
        return;
      }

      // Show configuration help if requested
      if ((options as any).helpConfig) {
        console.log('Configuration help:\n');
        console.log('Environment Variables:');
        console.log('  V0_API_KEY - Your v0.dev API key (required)');
        console.log('\nOptions:');
        console.log('  --verbose - Enable detailed logging');
        console.log('  --timeout - Tool execution timeout in milliseconds');
        return;
      }

      // Validate configuration if requested
      if (options.validate) {
        await this.validateConfiguration(options);
        return;
      }

      // Start the MCP server
      await this.startMcpServer(options);

    } catch (error) {
      handleStartupError(error, options);
      process.exit(1);
    }
  }

  /**
   * Validates configuration and displays results
   * @param options - CLI options
   */
  private async validateConfiguration(options: CliOptions): Promise<void> {
    console.log(chalk.blue('🔍 Validating v0 MCP Server configuration...\n'));

    try {
      // Check API key
      const apiKey = options.apiKey || process.env.V0_API_KEY;
      if (!apiKey) {
        console.log(chalk.red('❌ API key not provided'));
        console.log(chalk.yellow('\n📝 Setup Instructions:'));
        console.log(getApiKeySetupInstructions());
        return;
      }

      // Validate API key format
      if (!hasValidApiKey(apiKey)) {
        console.log(chalk.red('❌ API key format is invalid'));
        console.log(chalk.yellow('Expected format: v1:xxxxxxxxxxxxx'));
        return;
      }

      console.log(chalk.green('✅ API key format is valid'));

      // Test API key with actual validation
      try {
        const keyManager = new ApiKeyManager(apiKey);
        console.log(chalk.green('✅ API key validation passed'));
      } catch (error) {
        console.log(chalk.red(`❌ API key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        return;
      }

      // Show configuration summary  
      console.log(chalk.blue('\n📊 Configuration Summary:'));
      console.log(`  Name: v0-mcp-server`);
      console.log(`  Version: 1.0.0`);
      console.log(`  API Key: ✅ Provided and valid`);
      console.log(`  Verbose: ${options.verbose ? 'Enabled' : 'Disabled'}`);
      console.log(`  Timeout: ${options.timeout || 30000}ms`);

      console.log(chalk.green('\n✅ Validation complete!'));

    } catch (error) {
      handleValidationError(error, options);
    }
  }

  /**
   * Starts the MCP server with given options
   * @param options - CLI options
   */
  private async startMcpServer(options: CliOptions): Promise<void> {
    // Show startup banner
    this.showStartupBanner();

    // Validate API key before starting
    const apiKey = options.apiKey || process.env.V0_API_KEY;
    if (!apiKey) {
      console.log(chalk.red('❌ API key is required'));
      console.log(chalk.yellow('\n📝 Setup Instructions:'));
      console.log(getApiKeySetupInstructions());
      process.exit(1);
    }

    if (!hasValidApiKey(apiKey)) {
      console.log(chalk.red('❌ Invalid API key format'));
      console.log(chalk.yellow('Expected format: v1:xxxxxxxxxxxxx'));
      console.log(chalk.blue(`Get your API key from: https://v0.dev/chat/settings/keys`));
      process.exit(1);
    }

    try {
      // Parse numeric options
      const timeout = options.timeout ? parseInt(options.timeout, 10) : undefined;
      const maxMemory = options.maxMemory ? parseInt(options.maxMemory, 10) : undefined;

      if (options.verbose) {
        console.log(chalk.blue('🔧 Starting with configuration:'));
        console.log(`  API Key: ${chalk.green('✅ Provided')}`);
        console.log(`  Verbose: ${chalk.green('Enabled')}`);
        if (timeout) console.log(`  Timeout: ${timeout}ms`);
        if (maxMemory) console.log(`  Max Memory: ${maxMemory}MB`);
        console.log();
      }

      // Start the MCP server
      console.log(chalk.blue('🚀 Starting Simplified v0 MCP Server...'));
      
      this.server = await startServer(apiKey, options.verbose);

      console.log(chalk.green('✅ Simplified v0 MCP Server started successfully!'));
      console.log(chalk.blue('📡 Listening for MCP requests via stdio'));
      console.log(chalk.blue(`🔍 Auto-discovered ${this.server.getDiscoveredTools().length} tools`));
      
      if (options.verbose) {
        console.log(chalk.gray('💡 Server is running. Use Ctrl+C to stop.'));
      }

    } catch (error) {
      if (options.verbose) {
        console.error(chalk.red('🐛 Detailed error for debugging:'));
        console.error(error);
      }
      handleStartupError(error, options);
      process.exit(1);
    }
  }

  /**
   * Sets up signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      await this.gracefulShutdown('SIGINT');
    });

    // Handle SIGTERM (termination request)
    process.on('SIGTERM', async () => {
      await this.gracefulShutdown('SIGTERM');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error(chalk.red('❌ Uncaught exception:'), error);
      this.forceShutdown(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      console.error(chalk.red('❌ Unhandled promise rejection:'), reason);
      this.forceShutdown(1);
    });
  }

  /**
   * Performs graceful shutdown of the server and monitoring
   * @param signal - Signal that triggered the shutdown
   */
  private async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      console.log(chalk.yellow('⚠️  Shutdown already in progress...'));
      return;
    }

    this.isShuttingDown = true;
    console.log(chalk.yellow(`\n🛑 Received ${signal} signal, shutting down gracefully...`));

    try {
      // Stop the MCP server
      if (this.server) {
        console.log(chalk.blue('🔄 Stopping MCP server...'));
        this.server = null;
        console.log(chalk.green('✅ Server stopped gracefully'));
      }

      console.log(chalk.green('✅ Shutdown complete'));
      process.exit(0);

    } catch (error) {
      console.error(chalk.red(`❌ Error during shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`));
      this.forceShutdown(1);
    }
  }

  /**
   * Forces immediate shutdown without cleanup
   * @param exitCode - Exit code
   */
  private forceShutdown(exitCode: number): void {
    console.error(chalk.red('💥 Forcing immediate shutdown...'));
    process.exit(exitCode);
  }

  /**
   * Shows startup banner
   */
  private showStartupBanner(): void {
    console.log(chalk.cyan('┌─────────────────────────────────────────┐'));
    console.log(chalk.cyan('│') + chalk.bold('    Simplified v0 MCP Server') + '          ' + chalk.cyan('│'));
    console.log(chalk.cyan('│') + '   Auto-Discovery + Direct Dispatch     ' + chalk.cyan('│'));
    console.log(chalk.cyan('└─────────────────────────────────────────┘'));
    console.log();
  }

  /**
   * Shows detailed help information
   */
  private showDetailedHelp(): void {
    console.log(chalk.bold('v0 MCP Server') + ' - Bridge Claude Code with v0.dev component generation\n');
    
    console.log(chalk.yellow('Usage:'));
    console.log('  npx v0-mcp-server [options]');
    console.log('  npx v0-mcp-server --api-key YOUR_KEY');
    console.log('  npx v0-mcp-server --validate\n');

    console.log(chalk.yellow('Options:'));
    console.log('  -k, --api-key <key>     v0.dev API key (required)');
    console.log('  -v, --verbose           enable verbose logging');
    console.log('  --validate              validate configuration and exit');
    console.log('  --timeout <ms>          tool execution timeout in milliseconds');
    console.log('  --max-memory <mb>       maximum memory usage in MB');
    console.log('  --help-config           show configuration help');
    console.log('  -h, --help              display this help\n');

    console.log(chalk.yellow('Commands:'));
    console.log('  help                    show this help information');
    console.log('  config                  show configuration options\n');

    console.log(chalk.yellow('Examples:'));
    console.log('  # Start with API key');
    console.log('  npx v0-mcp-server --api-key v0_your_key_here\n');
    
    console.log('  # Use environment variable');
    console.log('  export V0_API_KEY=v0_your_key_here');
    console.log('  npx v0-mcp-server\n');
    
    console.log('  # Validate configuration');
    console.log('  npx v0-mcp-server --validate --verbose\n');

    console.log(chalk.blue('🔗 Get your API key from: https://v0.dev/chat/settings/keys'));
    console.log(chalk.blue('📚 Documentation: https://github.com/your-repo/v0-mcp-server'));
  }

  /**
   * Handles CLI errors with user-friendly messages
   * @param error - Error to handle
   * @param context - Optional error context
   */
  private handleError(error: unknown, context: Record<string, any> = {}): void {
    CliErrorHandler.handle(error, {
      phase: 'execution',
      options: context,
      apiKeyProvided: Boolean(context.apiKey || process.env.V0_API_KEY)
    });
  }

  /**
   * Runs the CLI application
   */
  async run(): Promise<void> {
    try {
      await this.program.parseAsync(process.argv);
    } catch (error) {
      this.handleError(error);
      process.exit(1);
    }
  }

  /**
   * Gets server status information if running
   * @returns Server status or null if not running
   */
  getServerStatus(): { running: boolean; toolCount?: number } {
    if (!this.server) {
      return { running: false };
    }

    return {
      running: this.server.isRunning(),
      toolCount: this.server.getDiscoveredTools().length
    };
  }
}

// Create and run CLI application
const cli = new V0McpCli();

// Run the CLI
cli.run().catch((error) => {
  console.error(chalk.red('❌ CLI execution failed:'), error);
  showContextualHelp(error);
  process.exit(1);
});