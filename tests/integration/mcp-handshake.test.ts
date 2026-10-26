/**
 * Deployed-surface checks: a real MCP handshake over stdio against the built
 * artifact (`dist/index.js`), plus API-key format validation through the built
 * CLI (`dist/cli/index.js --validate`).
 *
 * No unit tests here — nothing imports `src/` internals. Every assertion is
 * against the built binary over its real transport.
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn, execSync, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const projectRoot = path.resolve(__dirname, '../..');
const libPath = path.join(projectRoot, 'dist/index.js');
const cliPath = path.join(projectRoot, 'dist/cli/index.js');

// A valid-format key (no network calls are made by initialize / tools/list / the
// failing tool calls used below, so a synthetic key is sufficient).
const VALID_KEY = 'v0_test_key_123456789012345';

interface JsonRpcMessage {
  jsonrpc: string;
  id?: number;
  result?: any;
  error?: any;
  method?: string;
  params?: any;
}

/** Minimal JSON-RPC-over-stdio client for one spawned server process. */
class McpClient {
  private proc: ChildProcessWithoutNullStreams;
  private buffer = '';
  private pending = new Map<number, (msg: JsonRpcMessage) => void>();
  private nextId = 1;

  constructor() {
    this.proc = spawn('node', [libPath], {
      cwd: projectRoot,
      env: { ...process.env, V0_API_KEY: VALID_KEY },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.proc.stdout.on('data', (chunk: Buffer) => this.onData(chunk.toString()));
  }

  private onData(chunk: string): void {
    this.buffer += chunk;
    let newline;
    while ((newline = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (!line) continue;

      let msg: JsonRpcMessage;
      try {
        msg = JSON.parse(line);
      } catch {
        continue; // a non-JSON stdout line is a protocol violation; ignored here so it surfaces via failed assertions below
      }

      if (typeof msg.id === 'number' && this.pending.has(msg.id)) {
        const resolve = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        resolve(msg);
      }
    }
  }

  request(method: string, params?: any): Promise<JsonRpcMessage> {
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }

  notify(method: string, params?: any): void {
    this.proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  }

  close(): void {
    this.proc.kill('SIGTERM');
  }
}

describe('MCP handshake over stdio (dist/index.js)', () => {
  let client: McpClient;

  beforeAll(() => {
    if (!fs.existsSync(libPath)) {
      throw new Error('dist/index.js missing — run `pnpm build` first');
    }
    client = new McpClient();
  });

  afterAll(() => {
    client.close();
  });

  test('initialize responds with server info and tool capability', async () => {
    const res = await client.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'handshake-test', version: '1.0.0' }
    });

    expect(res.error).toBeUndefined();
    expect(res.result.serverInfo.name).toBe('v0-mcp-server');
    expect(res.result.capabilities.tools).toEqual({});
  });

  test('tools/list returns the full registered tool set', async () => {
    client.notify('notifications/initialized');

    const res = await client.request('tools/list');
    const names = res.result.tools.map((t: any) => t.name);

    expect(res.error).toBeUndefined();
    expect(names).toHaveLength(30);
    for (const expected of [
      'generate', 'list_chats', 'get_chat', 'delete_chat', 'rate_limits', 'deploy',
      'deploy_logs', 'deploy_errors', 'list_versions', 'get_version',
      'init_code', 'resolve_task',
      'list_projects', 'create_project', 'list_env_vars',
      'ai_usage', 'usage_events', 'user_activity',
      'logs_summary'
    ]) {
      expect(names).toContain(expected);
    }
  });

  test('tools/call executes a network-free tool successfully', async () => {
    const res = await client.request('tools/call', { name: 'logs_summary', arguments: {} });
    const text = res.result.content[0].text;
    const parsed = JSON.parse(text);

    expect(res.error).toBeUndefined();
    expect(parsed.success).toBe(true);
    expect(parsed.result.environment).toBeDefined();
    expect(parsed.result.environment.apiKeyPresent).toBe(true);
  });

  test('tools/call to an unknown tool reports the failure in the body', async () => {
    const res = await client.request('tools/call', { name: 'no_such_tool', arguments: {} });
    const parsed = JSON.parse(res.result.content[0].text);

    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('not found');
  });

  test('tools/call with a missing required param reports invalid parameters', async () => {
    const res = await client.request('tools/call', { name: 'get_chat', arguments: {} });
    const parsed = JSON.parse(res.result.content[0].text);

    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('Invalid parameters');
  });
});

describe('API key format validation (dist/cli/index.js --validate)', () => {
  const INVALID_FORMAT_MSG = '❌ API key format is invalid';

  beforeAll(() => {
    if (!fs.existsSync(cliPath)) {
      throw new Error('dist/cli/index.js missing — run `pnpm build` first');
    }
  });

  function validate(key: string): string {
    return execSync(`node ${cliPath} --validate --api-key ${key}`, {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 10000
    });
  }

  test('accepts a well-formed v0_ key', () => {
    const out = validate(VALID_KEY);
    expect(out).toContain('✅ API key format is valid');
  });

  test('rejects a key with a wrong prefix', () => {
    const out = validate('wrong_prefix_123456789012345');
    expect(out).toContain(INVALID_FORMAT_MSG);
  });

  test('rejects a key that is too short', () => {
    const out = validate('v0_short');
    expect(out).toContain(INVALID_FORMAT_MSG);
  });

  test('rejects a key that is too long', () => {
    const out = validate('v0_' + 'x'.repeat(300));
    expect(out).toContain(INVALID_FORMAT_MSG);
  });
});
