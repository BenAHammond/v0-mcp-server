/**
 * v0 SDK operation manifest
 *
 * The single source of truth for the `request` dispatcher and the `search`
 * manifest. Every capability the removed per-tool surface exposed is one entry
 * here: a `resource` + `action` pair with a zod schema for its params and a
 * path to the SDK method it invokes. A handful of operations that assemble a
 * nested payload (chat init/resolve, deploy-with-latest-version) carry their
 * own `invoke` closure instead.
 */

import { z } from 'zod';
import { buildModelConfiguration, compact } from './helpers.js';

/** A single requestable v0 operation. */
export interface V0Operation {
  /** Grouping namespace, e.g. `chats`, `deployments`, `projects`, `reports`. */
  resource: string;
  /** The verb within that resource, e.g. `list`, `get`, `create`. */
  action: string;
  /** Human-readable description shown by `search` and `request` on mismatch. */
  description: string;
  /** Zod schema for the flat params object. */
  params: z.ZodType;
  /** Dot-path to the SDK method, e.g. `chats.find`. */
  sdkPath: string;
  /** Custom invoke for operations that assemble a nested SDK payload. */
  invoke?: (client: any, params: any) => Promise<unknown> | unknown;
}

// Shared schema fragments
const id = z.string().min(1);
const optString = z.string().optional();
const optNumber = z.number().optional();
const optBoolean = z.boolean().optional();
const chatPrivacy = z.enum(['public', 'private', 'team', 'team-edit', 'unlisted']);
const projectPrivacy = z.enum(['private', 'team']);

const initType = z.enum(['files', 'repo', 'registry', 'zip', 'template']);
const taskType = z.enum([
  'confirmed-steps',
  'plan-exit-response',
  'answered-questions',
  'confirmed-permissions',
  'vercel-connect-setup'
]);
const planStatus = z.enum(['approved', 'rejected', 'request-changes']);

/** Every requestable v0 operation, in display order. */
export const V0_OPERATIONS: V0Operation[] = [
  // ---- chats ----
  {
    resource: 'chats',
    action: 'list',
    description: 'List your v0 chats (id, name, updatedAt, webUrl). Use to pick a chatId to continue.',
    params: z.object({ limit: optNumber, offset: optNumber }),
    sdkPath: 'chats.find'
  },
  {
    resource: 'chats',
    action: 'get',
    description: 'Get a chat and the files from its latest version.',
    params: z.object({ chatId: id }),
    sdkPath: 'chats.getById'
  },
  {
    resource: 'chats',
    action: 'delete',
    description: 'Delete a chat. Irreversible.',
    params: z.object({ chatId: id }),
    sdkPath: 'chats.delete'
  },
  {
    resource: 'chats',
    action: 'versions',
    description: 'List the version history of a chat. Use to find a versionId to roll back or inspect.',
    params: z.object({ chatId: id, limit: optNumber, cursor: optString }),
    sdkPath: 'chats.findVersions'
  },
  {
    resource: 'chats',
    action: 'version',
    description: 'Get the files for a specific chat version.',
    params: z.object({ chatId: id, versionId: id, includeDefaultFiles: optBoolean }),
    sdkPath: 'chats.getVersion'
  },
  {
    resource: 'chats',
    action: 'init',
    description:
      'Initialize a chat from existing code instead of a prompt. `type` selects the source: files (inline contents/URLs), repo (git URL + optional branch), registry (npm URL), zip (archive URL), or template (v0 template id).',
    params: z.object({
      type: initType,
      name: optString,
      chatPrivacy: chatPrivacy.optional(),
      projectId: optString,
      files: z.array(z.object({ name: z.string(), content: optString, url: optString, locked: optBoolean })).min(1).optional(),
      repoUrl: optString,
      repoBranch: optString,
      registryUrl: optString,
      zipUrl: optString,
      templateId: optString,
      lockAllFiles: optBoolean
    }),
    sdkPath: 'chats.init',
    invoke: async (client, params) => {
      const base = compact({
        name: params.name,
        chatPrivacy: params.chatPrivacy,
        projectId: params.projectId
      });
      switch (params.type) {
        case 'files':
          return client.chats.init({ ...base, type: 'files', files: params.files });
        case 'repo':
          return client.chats.init(compact({
            ...base,
            type: 'repo',
            repo: { url: params.repoUrl, ...(params.repoBranch ? { branch: params.repoBranch } : {}) },
            lockAllFiles: params.lockAllFiles
          }));
        case 'registry':
          return client.chats.init(compact({
            ...base,
            type: 'registry',
            registry: { url: params.registryUrl },
            lockAllFiles: params.lockAllFiles
          }));
        case 'zip':
          return client.chats.init(compact({
            ...base,
            type: 'zip',
            zip: { url: params.zipUrl },
            lockAllFiles: params.lockAllFiles
          }));
        case 'template':
          return client.chats.init({ ...base, type: 'template', templateId: params.templateId });
        default:
          throw new Error(`Unknown init type: ${params.type}`);
      }
    }
  },
  {
    resource: 'chats',
    action: 'resolve_task',
    description:
      'Answer a pending question from v0\'s autonomous agent. `taskType` selects the response shape: confirmed-steps, plan-exit-response, answered-questions, confirmed-permissions, or vercel-connect-setup.',
    params: z.object({
      chatId: id,
      taskType,
      status: planStatus.optional(),
      content: optString,
      answers: z.array(z.record(z.string(), z.unknown())).optional(),
      permissions: z.array(z.record(z.string(), z.unknown())).optional(),
      userMessage: optString,
      connectedIntegrationNames: z.array(z.string()).optional(),
      connectedMcpPresetNames: z.array(z.string()).optional(),
      appliedScripts: z.array(z.string()).optional(),
      addedEnvVars: z.array(z.string()).optional()
    }),
    sdkPath: 'chats.resolveTask',
    invoke: async (client, params) => {
      let task: Record<string, unknown>;
      switch (params.taskType) {
        case 'confirmed-steps':
          task = compact({
            type: 'confirmed-steps',
            connectedIntegrationNames: params.connectedIntegrationNames,
            connectedMcpPresetNames: params.connectedMcpPresetNames,
            appliedScripts: params.appliedScripts,
            addedEnvVars: params.addedEnvVars
          });
          break;
        case 'plan-exit-response':
          task = { type: 'plan-exit-response', status: params.status, content: params.content };
          break;
        case 'answered-questions':
          task = { type: 'answered-questions', answers: params.answers };
          break;
        case 'confirmed-permissions':
          task = compact({ type: 'confirmed-permissions', permissions: params.permissions, userMessage: params.userMessage });
          break;
        case 'vercel-connect-setup':
          task = { type: 'vercel-connect-setup' };
          break;
        default:
          throw new Error(`Unknown task type: ${params.taskType}`);
      }
      return client.chats.resolveTask(compact({ chatId: params.chatId, task }));
    }
  },

  // ---- deployments ----
  {
    resource: 'deployments',
    action: 'create',
    description: 'Deploy a chat to a live URL. Defaults to the chat\'s latest version when versionId is omitted.',
    params: z.object({ chatId: id, versionId: optString, projectId: optString }),
    sdkPath: 'deployments.create',
    invoke: async (client, params) => {
      let versionId = params.versionId;
      if (!versionId && client?.chats?.getById) {
        const chat = await client.chats.getById({ chatId: params.chatId });
        versionId = chat?.latestVersion?.id;
      }
      if (!versionId) throw new Error('Could not determine versionId for deployment');
      return client.deployments.create(compact({ chatId: params.chatId, versionId, projectId: params.projectId }));
    }
  },
  {
    resource: 'deployments',
    action: 'logs',
    description: 'Get runtime logs (stdout/stderr) for a deployment.',
    params: z.object({ deploymentId: id, since: optNumber }),
    sdkPath: 'deployments.findLogs'
  },
  {
    resource: 'deployments',
    action: 'errors',
    description: 'Get structured error details for a deployment.',
    params: z.object({ deploymentId: id }),
    sdkPath: 'deployments.findErrors'
  },

  // ---- rate_limits ----
  {
    resource: 'rate_limits',
    action: 'get',
    description: 'Check API rate limits and quotas.',
    params: z.object({}),
    sdkPath: 'rateLimits.find'
  },

  // ---- projects ----
  {
    resource: 'projects',
    action: 'list',
    description: 'List all projects (id, name, privacy, webUrl).',
    params: z.object({}),
    sdkPath: 'projects.find'
  },
  {
    resource: 'projects',
    action: 'create',
    description: 'Create a project. Optionally set description, instructions, privacy, and initial env vars.',
    params: z.object({
      name: z.string().min(1),
      description: optString,
      icon: optString,
      instructions: optString,
      privacy: projectPrivacy.optional(),
      vercelProjectId: optString,
      environmentVariables: z.array(z.object({ key: z.string(), value: z.string() })).optional()
    }),
    sdkPath: 'projects.create'
  },
  {
    resource: 'projects',
    action: 'get',
    description: 'Get a project, including its chats.',
    params: z.object({ projectId: id }),
    sdkPath: 'projects.getById'
  },
  {
    resource: 'projects',
    action: 'update',
    description: 'Update a project\'s name, description, instructions, or privacy.',
    params: z.object({
      projectId: id,
      name: optString,
      description: optString,
      instructions: optString,
      privacy: projectPrivacy.optional()
    }),
    sdkPath: 'projects.update'
  },
  {
    resource: 'projects',
    action: 'delete',
    description: 'Delete a project. Optionally also delete all its chats.',
    params: z.object({ projectId: id, deleteAllChats: optBoolean }),
    sdkPath: 'projects.delete'
  },
  {
    resource: 'projects',
    action: 'assign',
    description: 'Move a chat into a project (assign its projectId).',
    params: z.object({ projectId: id, chatId: id }),
    sdkPath: 'projects.assign'
  },

  // ---- env_vars ----
  {
    resource: 'env_vars',
    action: 'list',
    description: 'List a project\'s environment variables. Values are encrypted unless `decrypted` is true.',
    params: z.object({ projectId: id, decrypted: optBoolean }),
    sdkPath: 'projects.findEnvVars'
  },
  {
    resource: 'env_vars',
    action: 'create',
    description: 'Add environment variables to a project. Set `upsert` to overwrite existing keys.',
    params: z.object({
      projectId: id,
      environmentVariables: z.array(z.object({ key: z.string(), value: z.string() })).min(1),
      upsert: optBoolean,
      decrypted: optBoolean
    }),
    sdkPath: 'projects.createEnvVars'
  },
  {
    resource: 'env_vars',
    action: 'update',
    description: 'Update existing environment variables by id (use `env_vars.list` to find ids).',
    params: z.object({
      projectId: id,
      environmentVariables: z.array(z.object({ id: z.string(), value: z.string() })).min(1),
      decrypted: optBoolean
    }),
    sdkPath: 'projects.updateEnvVars'
  },
  {
    resource: 'env_vars',
    action: 'delete',
    description: 'Delete environment variables by id.',
    params: z.object({ projectId: id, environmentVariableIds: z.array(z.string()).min(1) }),
    sdkPath: 'projects.deleteEnvVars'
  },
  {
    resource: 'env_vars',
    action: 'get',
    description: 'Get a single environment variable by id.',
    params: z.object({ projectId: id, environmentVariableId: id, decrypted: optBoolean }),
    sdkPath: 'projects.getEnvVar'
  },

  // ---- reports ----
  {
    resource: 'reports',
    action: 'ai_usage',
    description: 'Get token-level AI usage (input/output/cache tokens per model and request).',
    params: z.object({ start: optString, end: optString, cursor: optString, limit: optNumber }),
    sdkPath: 'reports.getAIUsage'
  },
  {
    resource: 'reports',
    action: 'usage',
    description: 'Get raw usage events (generation, image generation, inline edits) with cost breakdown.',
    params: z.object({
      startDate: optString,
      endDate: optString,
      chatId: optString,
      messageId: optString,
      userId: optString,
      limit: optNumber,
      cursor: optString
    }),
    sdkPath: 'reports.getUsage'
  },
  {
    resource: 'reports',
    action: 'user_activity',
    description: 'Get per-user activity summary (chat/message counts, active days) for a date range.',
    params: z.object({ startDate: optString, endDate: optString }),
    sdkPath: 'reports.getUserActivity'
  }
];

/**
 * Looks up a requestable operation by resource + action.
 *
 * @param resource - The resource namespace (e.g. `chats`).
 * @param action - The action within the resource (e.g. `list`).
 * @returns The matching operation, or `undefined` when none matches.
 */
export function findOperation(resource: string, action: string): V0Operation | undefined {
  return V0_OPERATIONS.find((op) => op.resource === resource && op.action === action);
}

/**
 * Invokes an operation against the SDK client.
 *
 * Uses the operation's custom `invoke` closure when present; otherwise walks the
 * `sdkPath` dot-path to the SDK method and calls it with the given params.
 *
 * @param op - The operation to invoke.
 * @param client - The v0 SDK client instance.
 * @param params - Parsed, flat params for the operation.
 * @returns The SDK method's response (or the closure's return value).
 */
export function invokeOperation(op: V0Operation, client: any, params: any): Promise<unknown> | unknown {
  if (op.invoke) return op.invoke(client, params);
  const dot = op.sdkPath.indexOf('.');
  const namespace = op.sdkPath.slice(0, dot);
  const method = op.sdkPath.slice(dot + 1);
  return client[namespace][method](params);
}

/** A serialized operation, ready for the `search` manifest. */
export interface ManifestEntry {
  resource: string;
  action: string;
  description: string;
  params: Record<string, unknown>;
}

/**
 * Builds the on-demand manifest the `search` tool serves to the LLM.
 *
 * @param filter - Optional resource name to restrict the manifest to.
 * @returns A `{resources, total}` shape grouping operations by resource.
 */
export function buildSearchManifest(filter?: string): {
  resources: Record<string, ManifestEntry[]>;
  total: number;
} {
  const resources: Record<string, ManifestEntry[]> = {};
  for (const op of V0_OPERATIONS) {
    if (filter && op.resource !== filter) continue;
    (resources[op.resource] ??= []).push({
      resource: op.resource,
      action: op.action,
      description: op.description,
      params: z.toJSONSchema(op.params) as Record<string, unknown>
    });
  }
  return { resources, total: V0_OPERATIONS.length };
}

/** The `generate` tool's zod schema (create a chat, or continue one). */
export const generateParamsSchema = z.object({
  prompt: z.string().min(1).describe('What to generate or how to change the UI (e.g. "A login form" or "Make the buttons blue")'),
  chatId: optString.describe('Continue this chat instead of creating a new one. Use search/request to list chats.'),
  projectId: optString.describe('Associate a new chat with this project (ignored when continuing a chat)'),
  system: optString.describe('System-level instructions defining the AI persona and constraints'),
  attachments: z.array(z.object({ url: z.string() })).optional().describe('Image/design spec URLs to seed generation'),
  chatPrivacy: chatPrivacy.optional().describe('Visibility of a new chat'),
  modelId: z.enum(['v0-auto', 'v0-mini', 'v0-pro', 'v0-max', 'v0-max-fast']).optional(),
  thinking: optBoolean.describe('Enable chain-of-thought reasoning'),
  imageGenerations: optBoolean.describe('Generate image assets (true) or placeholders (false)'),
  responseMode: z.enum(['sync', 'async', 'experimental_stream']).optional()
});

/**
 * Invokes `generate`: creates a chat from the prompt, or continues the given
 * chat when `chatId` is present.
 *
 * @param client - The v0 SDK client instance.
 * @param params - Parsed `generate` params (`prompt` plus optional controls).
 * @returns The SDK chat response (create or sendMessage).
 */
export async function invokeGenerate(client: any, params: any): Promise<unknown> {
  return params.chatId ? generateContinue(client, params) : generateCreate(client, params);
}

/**
 * Creates a new chat from a `generate` call.
 *
 * @param client - The v0 SDK client instance.
 * @param params - Parsed `generate` params.
 * @returns The new chat response.
 */
function generateCreate(client: any, params: any): Promise<unknown> {
  return client.chats.create(
    compact({ ...generateShared(params), projectId: params.projectId, chatPrivacy: params.chatPrivacy })
  );
}

/**
 * Sends a follow-up message to an existing chat.
 *
 * @param client - The v0 SDK client instance.
 * @param params - Parsed `generate` params (must include `chatId`).
 * @returns The updated chat response.
 */
function generateContinue(client: any, params: any): Promise<unknown> {
  return client.chats.sendMessage({ chatId: params.chatId, ...generateShared(params) });
}

/**
 * Builds the message/model payload shared by create and continue.
 *
 * @param params - Parsed `generate` params.
 * @returns The `{message, system, attachments, modelConfiguration, responseMode}` payload with `undefined` values stripped.
 */
function generateShared(params: any): Record<string, unknown> {
  return compact({
    message: params.prompt,
    system: params.system,
    attachments: params.attachments,
    modelConfiguration: buildModelConfiguration(params),
    responseMode: params.responseMode
  });
}
