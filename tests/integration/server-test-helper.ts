/**
 * Helper utilities for testing the MCP server
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import kill from 'tree-kill';

export interface ServerTestConfig {
  apiKey: string;
  timeout?: number;
  verbose?: boolean;
}

export class ServerTestHelper {
  private process: ChildProcess | null = null;
  private output: string = '';
  private cliPath: string;

  constructor() {
    const projectRoot = path.resolve(__dirname, '../..');
    this.cliPath = path.join(projectRoot, 'dist/cli/index.js');
  }

  async startServer(config: ServerTestConfig): Promise<{
    success: boolean;
    output: string;
    error?: string;
  }> {
    return new Promise((resolve) => {
      const args = ['--api-key', config.apiKey];
      if (config.verbose) args.push('--verbose');

      this.process = spawn('node', [this.cliPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, V0_API_KEY: config.apiKey }
      });

      this.output = '';
      let hasStarted = false;
      let hasErrored = false;

      // Capture output
      this.process.stdout?.on('data', (data) => {
        this.output += data.toString();
        if (this.output.includes('✅ v0 MCP Server started successfully!')) {
          hasStarted = true;
        }
      });

      this.process.stderr?.on('data', (data) => {
        this.output += data.toString();
        if (this.output.includes('✅ v0 MCP Server started successfully!')) {
          hasStarted = true;
        }
      });

      this.process.on('error', (error) => {
        hasErrored = true;
        resolve({
          success: false,
          output: this.output,
          error: error.message
        });
      });

      this.process.on('exit', (code) => {
        if (!hasStarted && !hasErrored) {
          resolve({
            success: false,
            output: this.output,
            error: `Process exited with code ${code}`
          });
        }
      });

      // Check for successful startup
      setTimeout(() => {
        if (hasStarted) {
          resolve({
            success: true,
            output: this.output
          });
        } else if (!hasErrored) {
          resolve({
            success: false,
            output: this.output,
            error: `Server did not start within timeout period. Output: ${this.output}`
          });
        }
      }, config.timeout || 10000);
    });
  }

  async stopServer(): Promise<void> {
    if (this.process && this.process.pid) {
      return new Promise((resolve) => {
        kill(this.process!.pid!, 'SIGTERM', (err) => {
          this.process = null;
          resolve();
        });
      });
    }
  }

  getOutput(): string {
    return this.output;
  }
}