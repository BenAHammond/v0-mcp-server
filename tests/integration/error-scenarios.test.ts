/**
 * Error Scenario Tests for v0 MCP Server
 * 
 * Tests various error conditions and ensures proper error handling
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../..', '.env') });

describe('Error Scenario Tests', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const cliPath = path.join(projectRoot, 'dist/cli/index.js');

  beforeAll(() => {
    // Ensure project is built
    if (!fs.existsSync(cliPath)) {
      throw new Error('Project must be built before running tests');
    }
  });

  describe('Invalid API Key Scenarios', () => {
    test('should handle completely invalid API key format', async () => {
      const server = spawn('node', [cliPath, '--validate', '--api-key', 'invalid'], {
        cwd: projectRoot,
        env: { ...process.env, V0_API_KEY: undefined }
      });

      let output = '';
      server.stdout.on('data', (data) => { output += data.toString(); });
      server.stderr.on('data', (data) => { output += data.toString(); });

      await new Promise((resolve) => {
        server.on('exit', resolve);
        setTimeout(resolve, 5000);
      });

      expect(output).toContain('API key format is invalid');
      expect(output).toContain('Expected format: v1:');
    });

    test('should handle empty API key', async () => {
      // Create env without V0_API_KEY
      const cleanEnv = Object.entries(process.env)
        .filter(([key]) => key !== 'V0_API_KEY')
        .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});

      const server = spawn('node', [cliPath, '--validate'], {
        cwd: projectRoot,
        env: cleanEnv
      });

      let output = '';
      server.stdout.on('data', (data) => { output += data.toString(); });
      server.stderr.on('data', (data) => { output += data.toString(); });

      await new Promise((resolve) => {
        server.on('exit', resolve);
        setTimeout(resolve, 5000);
      });

      expect(output).toContain('API key not provided');
    });

    test('should handle malformed v1: API key', async () => {
      const server = spawn('node', [cliPath, '--validate', '--api-key', 'v1:abc'], {
        cwd: projectRoot,
        env: { ...process.env, V0_API_KEY: undefined }
      });

      let output = '';
      server.stdout.on('data', (data) => { output += data.toString(); });
      server.stderr.on('data', (data) => { output += data.toString(); });

      await new Promise((resolve) => {
        server.on('exit', resolve);
        setTimeout(resolve, 5000);
      });

      expect(output).toContain('Invalid v1 API key format');
      expect(output).toContain('Expected format: v1:xxxxx:xxxxx');
    });
  });

  describe('MCP Protocol Error Scenarios', () => {
    let serverProcess: ChildProcess;

    beforeAll(async () => {
      // Start server for MCP tests
      serverProcess = spawn('node', [cliPath], {
        env: { ...process.env },
        cwd: projectRoot
      });

      // Wait for server to start
      await new Promise((resolve) => {
        serverProcess.stdout?.on('data', (data) => {
          if (data.toString().includes('Listening for MCP requests')) {
            resolve(true);
          }
        });
        setTimeout(resolve, 5000);
      });
    });

    afterAll(() => {
      if (serverProcess) {
        serverProcess.kill();
      }
    });

    test('should handle malformed JSON-RPC request', async () => {
      const responses: string[] = [];
      
      serverProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            responses.push(line.trim());
          }
        }
      });

      // Send malformed JSON
      serverProcess.stdin?.write('{ invalid json }\n');
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      const errorResponse = responses.find(r => r.includes('error'));
      expect(errorResponse).toBeTruthy();
      
      if (errorResponse) {
        const parsed = JSON.parse(errorResponse);
        expect(parsed.error).toBeDefined();
        expect(parsed.error.code).toBe(-32700); // Parse error
      }
    });

    test('should handle invalid method name', async () => {
      const responses: string[] = [];
      
      serverProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            responses.push(line.trim());
          }
        }
      });

      // Send request with invalid method
      const invalidRequest = JSON.stringify({
        jsonrpc: '2.0',
        method: 'invalid/method',
        id: 99
      }) + '\n';

      serverProcess.stdin?.write(invalidRequest);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      const errorResponse = responses.find(r => {
        try {
          const parsed = JSON.parse(r);
          return parsed.id === 99;
        } catch {
          return false;
        }
      });

      expect(errorResponse).toBeTruthy();
      
      if (errorResponse) {
        const parsed = JSON.parse(errorResponse);
        expect(parsed.error).toBeDefined();
        expect(parsed.error.code).toBe(-32601); // Method not found
      }
    });

    test('should handle missing required parameters', async () => {
      const responses: string[] = [];
      
      serverProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            responses.push(line.trim());
          }
        }
      });

      // Send tool call without required arguments
      const invalidRequest = JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'generate_component'
          // Missing required 'arguments' field
        },
        id: 100
      }) + '\n';

      serverProcess.stdin?.write(invalidRequest);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      const errorResponse = responses.find(r => {
        try {
          const parsed = JSON.parse(r);
          return parsed.id === 100;
        } catch {
          return false;
        }
      });

      expect(errorResponse).toBeTruthy();
      
      if (errorResponse) {
        const parsed = JSON.parse(errorResponse);
        expect(parsed.error).toBeDefined();
      }
    });

    test('should handle tool not found error', async () => {
      const responses: string[] = [];
      
      serverProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            responses.push(line.trim());
          }
        }
      });

      // Call non-existent tool
      const request = JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'non_existent_tool',
          arguments: {}
        },
        id: 101
      }) + '\n';

      serverProcess.stdin?.write(request);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = responses.find(r => {
        try {
          const parsed = JSON.parse(r);
          return parsed.id === 101;
        } catch {
          return false;
        }
      });

      expect(response).toBeTruthy();
      
      if (response) {
        const parsed = JSON.parse(response);
        expect(parsed.result?.content?.[0]?.text).toContain("Tool 'non_existent_tool' not found");
        expect(parsed.result?.isError).toBe(true);
      }
    });
  });

  describe('Component Generation Error Scenarios', () => {
    let serverProcess: ChildProcess;

    beforeAll(async () => {
      serverProcess = spawn('node', [cliPath], {
        env: { ...process.env },
        cwd: projectRoot
      });

      await new Promise((resolve) => {
        serverProcess.stdout?.on('data', (data) => {
          if (data.toString().includes('Listening for MCP requests')) {
            resolve(true);
          }
        });
        setTimeout(resolve, 5000);
      });
    });

    afterAll(() => {
      if (serverProcess) {
        serverProcess.kill();
      }
    });

    test('should handle empty component description', async () => {
      const responses: string[] = [];
      
      serverProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            responses.push(line.trim());
          }
        }
      });

      const request = JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'generate_component',
          arguments: {
            description: ''
          }
        },
        id: 200
      }) + '\n';

      serverProcess.stdin?.write(request);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = responses.find(r => {
        try {
          const parsed = JSON.parse(r);
          return parsed.id === 200;
        } catch {
          return false;
        }
      });

      expect(response).toBeTruthy();
      
      if (response) {
        const parsed = JSON.parse(response);
        expect(parsed.result?.content?.[0]?.text).toContain('Error');
        expect(parsed.result?.isError).toBe(true);
      }
    });

    test('should handle extremely long component description', async () => {
      const responses: string[] = [];
      
      serverProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            responses.push(line.trim());
          }
        }
      });

      const longDescription = 'A'.repeat(6000); // Over the 5000 char limit

      const request = JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'generate_component',
          arguments: {
            description: longDescription
          }
        },
        id: 201
      }) + '\n';

      serverProcess.stdin?.write(request);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = responses.find(r => {
        try {
          const parsed = JSON.parse(r);
          return parsed.id === 201;
        } catch {
          return false;
        }
      });

      expect(response).toBeTruthy();
      
      if (response) {
        const parsed = JSON.parse(response);
        expect(parsed.result?.content?.[0]?.text).toContain('Error');
        expect(parsed.result?.isError).toBe(true);
      }
    });

    test('should handle invalid chat ID for iteration', async () => {
      const responses: string[] = [];
      
      serverProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            responses.push(line.trim());
          }
        }
      });

      const request = JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'iterate_component',
          arguments: {
            chatId: 'invalid-chat-id',
            changes: 'Make the button blue'
          }
        },
        id: 202
      }) + '\n';

      serverProcess.stdin?.write(request);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = responses.find(r => {
        try {
          const parsed = JSON.parse(r);
          return parsed.id === 202;
        } catch {
          return false;
        }
      });

      expect(response).toBeTruthy();
      
      if (response) {
        const parsed = JSON.parse(response);
        expect(parsed.result?.content?.[0]?.text).toContain('Error');
        // Should indicate invalid chat ID
      }
    });
  });

  describe('Resource and Performance Error Scenarios', () => {
    test('should handle server shutdown gracefully', async () => {
      const server = spawn('node', [cliPath], {
        env: { ...process.env },
        cwd: projectRoot
      });

      let output = '';
      server.stdout.on('data', (data) => { output += data.toString(); });
      server.stderr.on('data', (data) => { output += data.toString(); });

      // Wait for server to start
      await new Promise((resolve) => {
        const check = setInterval(() => {
          if (output.includes('Listening for MCP requests')) {
            clearInterval(check);
            resolve(true);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(check);
          resolve(false);
        }, 5000);
      });

      // Send SIGTERM
      server.kill('SIGTERM');

      // Wait for graceful shutdown
      await new Promise((resolve) => {
        server.on('exit', resolve);
        setTimeout(resolve, 3000);
      });

      expect(output).toContain('Received SIGTERM signal');
      expect(output).toContain('shutting down gracefully');
    });

    test('should handle multiple simultaneous requests', async () => {
      const serverProcess = spawn('node', [cliPath], {
        env: { ...process.env },
        cwd: projectRoot
      });

      // Wait for server to start
      await new Promise((resolve) => {
        serverProcess.stdout?.on('data', (data) => {
          if (data.toString().includes('Listening for MCP requests')) {
            resolve(true);
          }
        });
        setTimeout(resolve, 5000);
      });

      const responses: string[] = [];
      
      serverProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            responses.push(line.trim());
          }
        }
      });

      // Send multiple requests at once
      for (let i = 300; i < 305; i++) {
        const request = JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: i
        }) + '\n';
        serverProcess.stdin?.write(request);
      }

      // Wait for responses
      await new Promise(resolve => setTimeout(resolve, 2000));

      serverProcess.kill();

      // Should have received responses for all requests
      const responseIds = responses.map(r => {
        try {
          return JSON.parse(r).id;
        } catch {
          return null;
        }
      }).filter(id => id !== null);

      expect(responseIds.length).toBeGreaterThanOrEqual(5);
    });
  });
});