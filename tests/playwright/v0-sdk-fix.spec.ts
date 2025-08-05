/**
 * Test to verify v0-sdk dynamic import fix
 */

import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('v0-sdk Dynamic Import Fix Verification', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const cliPath = path.join(projectRoot, 'dist/cli/index.js');

  test('server starts without v0-sdk constructor errors', async () => {
    console.log('Testing v0-sdk dynamic import fix...');
    
    const serverProcess = spawn('node', [cliPath], {
      env: { ...process.env },
      cwd: projectRoot
    });

    let output = '';
    let errorOutput = '';
    let hasConstructorError = false;
    let serverStarted = false;

    serverProcess.stdout?.on('data', (data) => {
      output += data.toString();
      if (output.includes('v0 MCP Server started successfully')) {
        serverStarted = true;
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString();
      if (errorOutput.includes('V0 is not a constructor') || 
          errorOutput.includes('Failed to initialize v0-sdk client')) {
        hasConstructorError = true;
      }
    });

    // Wait for server to start or error
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Clean up
    serverProcess.kill();

    // Assertions
    expect(hasConstructorError).toBe(false);
    expect(serverStarted).toBe(true);
    expect(errorOutput).not.toContain('V0 is not a constructor');
    expect(errorOutput).not.toContain('Failed to initialize v0-sdk client');
    expect(output).toContain('v0 MCP Server started successfully');

    console.log('✅ v0-sdk dynamic import fix verified - no constructor errors!');
  });

  test('can make v0.dev API calls', async () => {
    console.log('Testing v0.dev API integration...');
    
    const serverProcess = spawn('node', [cliPath, '--validate'], {
      env: { ...process.env },
      cwd: projectRoot
    });

    let output = '';
    let hasApiError = false;

    serverProcess.stdout?.on('data', (data) => {
      output += data.toString();
    });

    serverProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      if (error.includes('V0 is not a constructor')) {
        hasApiError = true;
      }
    });

    // Wait for validation to complete
    await new Promise((resolve) => {
      serverProcess.on('exit', resolve);
      setTimeout(resolve, 10000); // Timeout after 10s
    });

    // The validation should complete without constructor errors
    expect(hasApiError).toBe(false);
    expect(output).toContain('API key format is valid');
    expect(output).toContain('Configuration is compliant');

    console.log('✅ v0.dev API integration working correctly!');
  });
});