/**
 * The v0 tool surface: exactly three tools.
 *
 * - `generate` — the flagship. Create a chat from a prompt, or continue one.
 * - `request` — a generic `{resource, action, params}` dispatcher over the SDK.
 * - `search` — serves the on-demand manifest of resource/action/params pairs.
 *
 * Everything else the old 26-tool surface exposed is reachable through
 * `request`/`search`; no schema reaches the consuming LLM until it asks for one.
 */

import { z } from 'zod';
import {
  buildSearchManifest,
  findOperation,
  generateParamsSchema,
  invokeGenerate,
  invokeOperation
} from './v0-manifest.js';

/** A tool the server registers and dispatches. */
export interface McpTool {
  name: string;
  description: string;
  /** JSON Schema for the tool's arguments (served by `tools/list`). */
  inputSchema: Record<string, unknown>;
  /** Runs the tool against the SDK client with already-parsed arguments. */
  execute: (client: any, params: any) => Promise<unknown> | unknown;
}

/** Converts a zod schema to the JSON Schema an MCP client expects. */
function toInputSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

const requestParamsSchema = z.object({
  resource: z.string().min(1).describe('Resource to act on: chats, deployments, projects, env_vars, rate_limits, or reports'),
  action: z.string().min(1).describe('Action within the resource, e.g. list, get, create, delete'),
  params: z.record(z.string(), z.unknown()).optional().describe('Action parameters — run `search` for the exact shape')
});

const searchParamsSchema = z.object({
  resource: z.string().optional().describe('Optional resource to filter the manifest to')
});

/**
 * Builds the three registered v0 tools.
 */
export function createV0Tools(): McpTool[] {
  return [
    {
      name: 'generate',
      description:
        'Generate or modify a React UI from a prompt. Pass `chatId` to continue an existing chat (e.g. "make the buttons blue"), or omit it to start a new chat. Returns generated files as {path, content}. Optional controls: system, attachments, chatPrivacy, modelId, thinking, imageGenerations, responseMode.',
      inputSchema: toInputSchema(generateParamsSchema),
      execute: (client, params) => invokeGenerate(client, generateParamsSchema.parse(params))
    },
    {
      name: 'request',
      description:
        'Call any other v0 capability by resource and action. Run `search` first to discover available resources, actions, and their params. Examples: {resource:"chats", action:"list"} lists chats; {resource:"deployments", action:"create", params:{chatId}} deploys a chat.',
      inputSchema: toInputSchema(requestParamsSchema),
      execute: async (client, raw) => {
        const { resource, action, params } = requestParamsSchema.parse(raw);
        const op = findOperation(resource, action);
        if (!op) {
          throw new Error(`Unknown operation "${resource}.${action}". Run "search" to list available resources and actions.`);
        }
        return invokeOperation(op, client, op.params.parse(params ?? {}));
      }
    },
    {
      name: 'search',
      description:
        'Discover the v0 request surface: every resource, its actions, and each action\'s params. Pass an optional `resource` to filter to one resource.',
      inputSchema: toInputSchema(searchParamsSchema),
      execute: (_client, params) => buildSearchManifest(params.resource)
    }
  ];
}
