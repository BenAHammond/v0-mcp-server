import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

/**
 * A hand-rolled MCP client over stdio, for one spawned server process.
 *
 * Deliberately zero runtime dependencies: the harness is a transparent observer of
 * the wire, so it must not carry an SDK's assumptions. It speaks exactly the three
 * methods the flows need — `initialize`, `tools/list`, and `tools/call`.
 */

export interface McpClientOptions {
  /** Absolute path to the built library (`v0-mcp-server/dist/index.js`). */
  libPath: string;
  /** A valid-format v0 API key. */
  apiKey: string;
  /** The directory the server process runs from. */
  cwd: string;
}

interface JsonRpcMessage {
  jsonrpc: string;
  id?: number;
  result?: any;
  error?: any;
  method?: string;
  params?: any;
}

export interface ToolCallResult {
  /** True when the tool answered with an error, false otherwise. */
  isError: boolean;
  /** The concatenated text of the `content` blocks. */
  text: string;
  content: Array<{ type?: string; text?: string }>;
}

export class McpClient {
  private readonly proc: ChildProcessWithoutNullStreams;
  private buffer = "";
  private pending = new Map<number, (msg: JsonRpcMessage) => void>();
  private nextId = 1;

  /** The `initialize` response's `serverInfo`, set once the handshake completes. */
  serverInfo: Record<string, unknown> = {};
  /** The `initialize` response's `capabilities`, set once the handshake completes. */
  capabilities: Record<string, unknown> = {};

  constructor(opts: McpClientOptions) {
    this.proc = spawn("node", [opts.libPath], {
      cwd: opts.cwd,
      env: { ...process.env, V0_API_KEY: opts.apiKey },
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.proc.stdout.on("data", (chunk: Buffer) => this.onData(chunk.toString()));
    // The server logs to stderr (never stdout); swallowed so it stays out of the
    // harness's own output.
    this.proc.stderr.on("data", () => {});
  }

  async initialize(): Promise<void> {
    const res = await this.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "v0-mcp-server-e2e", version: "0.1.0" },
    });
    if (res.error) throw new Error(`initialize failed: ${JSON.stringify(res.error)}`);
    this.serverInfo = (res.result?.serverInfo ?? {}) as Record<string, unknown>;
    this.capabilities = (res.result?.capabilities ?? {}) as Record<string, unknown>;
    this.notify("notifications/initialized");
  }

  async listTools(): Promise<Array<{ name: string }>> {
    const res = await this.request("tools/list", {});
    if (res.error) throw new Error(`tools/list failed: ${JSON.stringify(res.error)}`);
    const result = (res.result ?? {}) as { tools?: Array<{ name: string }> };
    return result.tools ?? [];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolCallResult> {
    const res = await this.request("tools/call", { name, arguments: args });
    const result = (res.result ?? {}) as {
      isError?: boolean;
      content?: Array<{ type?: string; text?: string }>;
    };
    const content = result.content ?? [];
    return {
      isError: result.isError === true,
      text: content.map((c) => c.text ?? "").join(""),
      content,
    };
  }

  close(): void {
    this.proc.kill("SIGTERM");
  }

  private onData(chunk: string): void {
    this.buffer += chunk;
    let newline: number;
    while ((newline = this.buffer.indexOf("\n")) >= 0) {
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (!line) continue;

      let msg: JsonRpcMessage;
      try {
        msg = JSON.parse(line);
      } catch {
        continue; // a non-JSON stdout line is a protocol violation; ignored here so it surfaces via a failed assertion below
      }

      if (typeof msg.id === "number" && this.pending.has(msg.id)) {
        const resolve = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        resolve(msg);
      }
    }
  }

  private request(method: string, params?: unknown): Promise<JsonRpcMessage> {
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  }

  private notify(method: string, params?: unknown): void {
    this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
  }
}
