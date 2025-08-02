#!/usr/bin/env node
// CLI entry point
// TODO: Implement using the agentic LLM prompt

import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('v0-mcp')
  .description('v0.dev MCP Server for component generation')
  .version('1.0.0')
  .option('-k, --api-key <key>', 'v0.dev API key')
  .action(() => {
    console.log(chalk.green('v0 MCP CLI - Ready for implementation!'));
  });

program.parse();
