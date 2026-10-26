/**
 * Integration tests for MCP Server
 * 
 * Tests the complete CLI functionality and MCP protocol compliance
 * Requires V0_API_KEY environment variable to be set
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';
import { ServerTestHelper } from './server-test-helper.js';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../..', '.env') });

describe('MCP Server Integration Tests', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const cliPath = path.join(projectRoot, 'dist/cli/index.js');
  let serverHelper: ServerTestHelper;
  
  beforeAll(async () => {
    // Check if V0_API_KEY is available
    if (!process.env.V0_API_KEY) {
      throw new Error('V0_API_KEY environment variable is required for integration tests');
    }

    // Ensure the project is built
    if (!fs.existsSync(cliPath)) {
      console.log('Building project for integration tests...');
      execSync('pnpm build', { cwd: projectRoot, stdio: 'inherit' });
    }

    serverHelper = new ServerTestHelper();
    console.log('✅ Integration test setup complete');
  });

  afterAll(async () => {
    if (serverHelper) {
      await serverHelper.stopServer();
    }
  });

  describe('CLI Validation', () => {
    test('should validate configuration successfully', () => {
      const result = execSync(
        `node ${cliPath} --validate --api-key ${process.env.V0_API_KEY}`,
        { 
          cwd: projectRoot,
          encoding: 'utf8',
          timeout: 30000
        }
      );

      expect(result).toContain('✅ API key format is valid');
      expect(result).toContain('✅ API key validation passed');
      expect(result).toContain('✅ Validation complete!');
    });

    test('should show help information', () => {
      const result = execSync(
        `node ${cliPath} --help`,
        { 
          cwd: projectRoot,
          encoding: 'utf8',
          timeout: 10000
        }
      );

      expect(result).toContain('v0.dev MCP Server');
      expect(result).toContain('Usage:');
      expect(result).toContain('--api-key');
      expect(result).toContain('--validate');
    });

    test('should report invalid API key format', () => {
      const result = execSync(
        `node ${cliPath} --validate --api-key invalid_key`,
        {
          cwd: projectRoot,
          encoding: 'utf8',
          timeout: 10000
        }
      );

      expect(result).toContain('❌ API key format is invalid');
    });
  });

  describe('Server Startup', () => {
    test('should start server successfully with valid API key', async () => {
      const result = await serverHelper.startServer({
        apiKey: process.env.V0_API_KEY!,
        timeout: 15000
      });

      if (!result.success) {
        console.log('Server startup failed. Output:', result.output);
        console.log('Error:', result.error);
      }
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('🚀 Starting Simplified v0 MCP Server');
      expect(result.output).toContain('✅ Simplified v0 MCP Server started successfully!');
      expect(result.output).toContain('📡 Listening for MCP requests via stdio');

      await serverHelper.stopServer();
    }, 20000);

    test('should provide verbose output when requested', async () => {
      const result = await serverHelper.startServer({
        apiKey: process.env.V0_API_KEY!,
        verbose: true,
        timeout: 15000
      });

      if (!result.success) {
        console.log('Verbose server startup failed. Output:', result.output);
        console.log('Error:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.output).toContain('🔧 Starting with configuration');
      expect(result.output).toContain('API Key: ✅ Provided');
      expect(result.output).toContain('Verbose: Enabled');

      await serverHelper.stopServer();
    }, 20000);
  });

  describe('Error Handling', () => {
    test('should handle missing API key gracefully', () => {
      try {
        execSync(
          `node ${cliPath}`,
          { 
            cwd: projectRoot,
            encoding: 'utf8',
            timeout: 10000,
            env: { ...process.env, V0_API_KEY: '' }
          }
        );
        expect.fail('Should have failed with missing API key');
      } catch (error: any) {
        const output = (error.stdout || '') + (error.stderr || '');
        expect(output).toContain('❌ API key is required');
        expect(output).toContain('📝 Setup Instructions');
        expect(output).toContain('https://v0.dev/chat/settings/keys');
      }
    });
  });

  describe('Build Verification', () => {
    test('should have all required dist files', () => {
      expect(fs.existsSync(path.join(projectRoot, 'dist/index.js'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, 'dist/cli/index.js'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, 'dist/index.d.ts'))).toBe(true);
    });

    test('should pass TypeScript type checking', () => {
      const result = execSync(
        'pnpm typecheck',
        { 
          cwd: projectRoot,
          encoding: 'utf8',
          timeout: 30000
        }
      );

      // TypeScript should exit cleanly with no output for successful typecheck
      expect(result.trim()).toBe('');
    });

    test('should have valid package.json configuration', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.name).toBe('v0-mcp-server');
      expect(packageJson.type).toBe('module');
      expect(packageJson.bin['v0-mcp']).toBe('dist/cli/index.js');
      expect(packageJson.main).toBe('./dist/index.js');
    });
  });
});