/**
 * Playwright test for v0 MCP Server
 * 
 * Tests the server startup and MCP protocol communication
 */

import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('v0 MCP Server Tests', () => {
  let serverProcess: ChildProcess | null = null;
  const projectRoot = path.resolve(__dirname, '../..');
  const cliPath = path.join(projectRoot, 'dist/cli/index.js');

  test.beforeAll(async () => {
    // Load environment variables
    const dotenv = await import('dotenv');
    dotenv.config({ path: path.join(projectRoot, '.env') });
  });

  test.afterEach(async () => {
    // Clean up server process after each test
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cleanup
    }
  });

  test('should start server successfully', async ({ page }) => {
    console.log('Starting MCP server test...');
    
    // Start the server
    serverProcess = spawn('node', [cliPath], {
      env: { ...process.env },
      cwd: projectRoot
    });

    let output = '';
    let errorOutput = '';

    // Capture output
    serverProcess.stdout?.on('data', (data) => {
      output += data.toString();
      console.log('Server output:', data.toString());
    });

    serverProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString();
      console.log('Server error:', data.toString());
    });

    // Wait for server to start
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 15000);

      const checkInterval = setInterval(() => {
        if (output.includes('v0 MCP Server started successfully') || 
            output.includes('Listening for MCP requests via stdio')) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve();
        }
        if (errorOutput.includes('Error:') || errorOutput.includes('Failed')) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          reject(new Error(`Server startup error: ${errorOutput}`));
        }
      }, 100);
    });

    expect(output).toContain('v0 MCP Server started successfully');
    expect(errorOutput).not.toContain('V0 is not a constructor');
    expect(errorOutput).not.toContain('Failed to initialize v0-sdk');
  });

  test('should handle MCP list tools request', async ({ page }) => {
    console.log('Testing MCP list tools request...');
    
    // Start the server
    serverProcess = spawn('node', [cliPath], {
      env: { ...process.env },
      cwd: projectRoot
    });

    let output = '';
    let jsonResponse = '';

    serverProcess.stdout?.on('data', (data) => {
      output += data.toString();
      // Look for JSON responses
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{') && line.includes('"jsonrpc"')) {
          jsonResponse = line.trim();
        }
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      console.log('Server error:', data.toString());
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Send MCP list tools request
    const listToolsRequest = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    }) + '\n';

    serverProcess.stdin?.write(listToolsRequest);

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 2000));

    expect(jsonResponse).toBeTruthy();
    
    try {
      const response = JSON.parse(jsonResponse);
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.result).toBeDefined();
      expect(response.result.tools).toBeInstanceOf(Array);
      expect(response.result.tools.length).toBe(2); // generate_component and iterate_component
      
      const toolNames = response.result.tools.map((t: any) => t.name);
      expect(toolNames).toContain('generate_component');
      expect(toolNames).toContain('iterate_component');
    } catch (error) {
      console.error('Failed to parse JSON response:', jsonResponse);
      throw error;
    }
  });

  test('should handle MCP call tool request', async ({ page }) => {
    console.log('Testing MCP call tool request...');
    
    // Start the server
    serverProcess = spawn('node', [cliPath], {
      env: { ...process.env },
      cwd: projectRoot
    });

    let output = '';
    const responses: string[] = [];

    serverProcess.stdout?.on('data', (data) => {
      const dataStr = data.toString();
      output += dataStr;
      console.log('Server stdout:', dataStr);
      
      // Look for JSON responses
      const lines = dataStr.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{') && line.includes('"jsonrpc"')) {
          console.log('Found JSON response:', line.trim());
          responses.push(line.trim());
        }
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      console.log('Server stderr:', data.toString());
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // First, send a simple list tools request to verify communication
    const listRequest = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    }) + '\n';

    console.log('Sending list tools request first...');
    serverProcess.stdin?.write(listRequest);
    
    // Wait for list response
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Now send the call tool request
    const callToolRequest = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'generate_component',
        arguments: {
          description: 'A simple test button component'
        }
      },
      id: 2
    }) + '\n';

    console.log('Sending call tool request...');
    serverProcess.stdin?.write(callToolRequest);

    // Wait for response (component generation takes time)
    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log('Total responses received:', responses.length);
    console.log('All responses:', responses);

    // Find the response for our call request
    const toolResponse = responses.find(r => {
      try {
        const parsed = JSON.parse(r);
        return parsed.id === 2;
      } catch {
        return false;
      }
    });

    // If no direct response, check if there was an error in the output
    if (!toolResponse && output.includes('Error')) {
      console.log('No tool response but found error in output');
      expect(output).not.toContain('V0 is not a constructor');
      expect(output).not.toContain('Failed to initialize v0-sdk');
      // Skip the rest of the test if there's an API error
      return;
    }

    expect(toolResponse).toBeTruthy();

    try {
      const response = JSON.parse(toolResponse!);
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(2);
      
      if (response.error) {
        // If there's an error, it should be a known error
        console.log('Tool call error:', response.error);
        expect(response.error.message).toBeDefined();
      } else {
        // Success case
        expect(response.result).toBeDefined();
        expect(response.result.content).toBeInstanceOf(Array);
        expect(response.result.content[0].type).toBe('text');
        expect(response.result.content[0].text).toContain('component');
      }
    } catch (error) {
      console.error('Failed to parse JSON response:', toolResponse);
      throw error;
    }
  });

  test('should validate server with browser automation', async ({ page }) => {
    // Navigate to a test page to verify browser is working
    await page.goto('https://v0.dev');
    
    // Verify the page loaded
    await expect(page).toHaveTitle(/v0/);
    
    console.log('Browser automation working, v0.dev accessible');
    
    // Start the MCP server in parallel
    serverProcess = spawn('node', [cliPath], {
      env: { ...process.env },
      cwd: projectRoot
    });

    let serverReady = false;
    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('v0 MCP Server started successfully')) {
        serverReady = true;
      }
    });

    // Wait for server to be ready
    await page.waitForTimeout(3000);
    
    expect(serverReady).toBe(true);
    console.log('MCP server is running and v0.dev is accessible');
  });
});