/**
 * Focused v0 Tools
 *
 * The core chat lifecycle: generate, list/get/delete chats, rate limits,
 * deploy (plus its logs/errors), and version retrieval. Each tool is only
 * registered when its underlying SDK method is available.
 */

import { DiscoveredMethod } from '../types.js';
import { buildModelConfiguration, compact, requireString } from './helpers.js';

/**
 * Creates the core v0 tool set.
 *
 * @param client - The v0 SDK client
 * @returns Array of tool definitions
 */
export function createV0Tools(client: any): DiscoveredMethod[] {
  const builders = [
    createGenerateTool,
    createListChatsTool,
    createGetChatTool,
    createDeleteChatTool,
    createRateLimitsTool,
    createDeployTool,
    createDeployLogsTool,
    createDeployErrorsTool,
    createListVersionsTool,
    createGetVersionTool
  ];

  const tools: DiscoveredMethod[] = [];
  for (const build of builders) {
    const tool = build(client);
    if (tool) tools.push(tool);
  }

  return tools;
}

/**
 * Builds the `generate` tool (create a chat, or continue one via `sendMessage`).
 */
function createGenerateTool(client: any): DiscoveredMethod | null {
  if (!client?.chats?.create || !client?.chats?.sendMessage) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'generate',
    toolName: 'generate',
    description:
      'Generate or modify UI from a prompt. Pass chatId to continue an existing conversation (e.g. "make buttons blue"), or omit chatId to start a new chat. Optional controls: system (persona/constraints), attachments (image/design URLs), chatPrivacy, model configuration (modelId, thinking, imageGenerations), and responseMode. Returns generated files with path and content.',
    sdkFunction: async (params: any) => {
      const prompt = requireString(params?.prompt, 'prompt');
      const chatId = typeof params?.chatId === 'string' ? params.chatId.trim() : undefined;
      const system = typeof params?.system === 'string' ? params.system.trim() : undefined;
      const responseMode = typeof params?.responseMode === 'string' ? params.responseMode.trim() : undefined;
      const modelConfiguration = buildModelConfiguration(params);

      const shared = compact({
        message: prompt,
        system,
        attachments: params?.attachments,
        modelConfiguration,
        responseMode
      });

      if (chatId) {
        return continueChat(client, chatId, shared);
      }
      return createChat(client, compact({
        ...shared,
        projectId: params?.projectId,
        chatPrivacy: params?.chatPrivacy
      }));
    },
    parameters: [
      {
        name: 'prompt',
        type: 'string',
        required: true,
        description: 'What to generate or how to change the UI (e.g. "A login form" or "Make the buttons blue")'
      },
      {
        name: 'chatId',
        type: 'string',
        required: false,
        description: 'Continue this chat instead of creating a new one. Use list_chats to see available chats.'
      },
      {
        name: 'projectId',
        type: 'string',
        required: false,
        description: 'Associate new chat with this project (ignored when continuing a chat)'
      },
      {
        name: 'system',
        type: 'string',
        required: false,
        description: 'System-level instructions defining the AI persona and constraints (e.g. "Use TypeScript and Tailwind")'
      },
      {
        name: 'attachments',
        type: 'array',
        required: false,
        description: 'Multimodal inputs: array of { url } pointing to images or design specs'
      },
      {
        name: 'chatPrivacy',
        type: 'string',
        required: false,
        description: 'Visibility of the new chat: public, private, team, team-edit, or unlisted'
      },
      {
        name: 'modelId',
        type: 'string',
        required: false,
        description: 'Model to use: v0-auto (default), v0-mini, v0-pro, v0-max, or v0-max-fast'
      },
      {
        name: 'thinking',
        type: 'boolean',
        required: false,
        description: 'Enable chain-of-thought reasoning (slower but better for complex logic)'
      },
      {
        name: 'imageGenerations',
        type: 'boolean',
        required: false,
        description: 'Generate image assets (true) or use placeholders (false)'
      },
      {
        name: 'responseMode',
        type: 'string',
        required: false,
        description: 'How the API returns the result: sync (wait for the full response), async (return a job to poll), or experimental_stream (stream response events)'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.generate'
  };
}

/**
 * Continues an existing chat by sending a message.
 */
async function continueChat(client: any, chatId: string, payload: Record<string, any>): Promise<any> {
  return await client.chats.sendMessage({ chatId, ...payload });
}

/**
 * Creates a new chat with the given prompt and optional project association.
 */
async function createChat(client: any, payload: Record<string, any>): Promise<any> {
  return await client.chats.create(payload);
}

/**
 * Builds the `list_chats` tool (list chats to choose from).
 */
function createListChatsTool(client: any): DiscoveredMethod | null {
  if (!client?.chats?.find) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'list_chats',
    toolName: 'list_chats',
    description: 'List your v0 chats (id, name, updatedAt, webUrl). Use to pick which chatId to pass to generate, or omit chatId to start new.',
    sdkFunction: async (params: { limit?: number; offset?: number }) => {
      const result = await client.chats.find({
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0
      });
      // Shape response for clarity
      const chats = (result?.data || result || []).map((chat: any) => ({
        id: chat.id,
        name: chat.name || '(untitled)',
        updatedAt: chat.updatedAt,
        webUrl: chat.webUrl,
        projectId: chat.projectId || null
      }));
      return { chats, total: chats.length };
    },
    parameters: [
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Max chats to return (default 20)'
      },
      {
        name: 'offset',
        type: 'number',
        required: false,
        description: 'Pagination offset'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.list_chats'
  };
}

/**
 * Builds the `get_chat` tool (chat details + current files).
 */
function createGetChatTool(client: any): DiscoveredMethod | null {
  if (!client?.chats?.getById) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'get_chat',
    toolName: 'get_chat',
    description: 'Get chat details including generated files. Returns chat info and all files from the latest version.',
    sdkFunction: async (params: { chatId: string }) => {
      const chatId = requireString(params?.chatId, 'chatId');

      const chat = await client.chats.getById({ chatId });

      const files = (chat?.latestVersion?.files || []).map((f: any) => ({
        path: f.name,
        content: f.content
      }));

      return {
        id: chat.id,
        name: chat.name || '(untitled)',
        updatedAt: chat.updatedAt,
        webUrl: chat.webUrl,
        projectId: chat.projectId || null,
        files
      };
    },
    parameters: [
      {
        name: 'chatId',
        type: 'string',
        required: true,
        description: 'The chat ID to retrieve'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.get_chat'
  };
}

/**
 * Builds the `delete_chat` tool (delete a chat).
 */
function createDeleteChatTool(client: any): DiscoveredMethod | null {
  if (!client?.chats?.delete) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'delete_chat',
    toolName: 'delete_chat',
    description: 'Delete a chat. Irreversible.',
    sdkFunction: async (params: { chatId: string }) => {
      const chatId = requireString(params?.chatId, 'chatId');

      await client.chats.delete({ chatId });
      return { deleted: true, chatId };
    },
    parameters: [
      {
        name: 'chatId',
        type: 'string',
        required: true,
        description: 'The chat ID to delete'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.delete_chat'
  };
}

/**
 * Builds the `rate_limits` tool (check rate limits).
 */
function createRateLimitsTool(client: any): DiscoveredMethod | null {
  if (!client?.rateLimits?.find) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'rate_limits',
    toolName: 'rate_limits',
    description: 'Check API rate limits and quotas.',
    sdkFunction: async () => {
      return await client.rateLimits.find();
    },
    parameters: [],
    returnType: 'object',
    fullPath: 'v0.rate_limits'
  };
}

/**
 * Builds the `deploy` tool (deploy a chat version to a live URL).
 */
function createDeployTool(client: any): DiscoveredMethod | null {
  if (!client?.deployments?.create) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'deploy',
    toolName: 'deploy',
    description: 'Deploy a chat to get a live URL. Optionally specify versionId, defaults to latest. Returns deployment id and url.',
    sdkFunction: async (params: { chatId: string; versionId?: string; projectId?: string }) => {
      const chatId = requireString(params?.chatId, 'chatId');

      // Get the chat to find versionId if not provided
      let versionId = typeof params?.versionId === 'string' ? params.versionId.trim() : undefined;
      if (!versionId && client?.chats?.getById) {
        const chat = await client.chats.getById({ chatId });
        versionId = chat?.latestVersion?.id;
      }
      if (!versionId) throw new Error('Could not determine versionId for deployment');

      const deployment = await client.deployments.create(compact({
        chatId,
        versionId,
        projectId: params?.projectId
      }));
      return {
        id: deployment.id,
        url: deployment.url || deployment.webUrl,
        status: deployment.status || 'created'
      };
    },
    parameters: [
      {
        name: 'chatId',
        type: 'string',
        required: true,
        description: 'The chat to deploy'
      },
      {
        name: 'versionId',
        type: 'string',
        required: false,
        description: 'Specific version to deploy (defaults to latest)'
      },
      {
        name: 'projectId',
        type: 'string',
        required: false,
        description: 'Project to associate the deployment with (optional)'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.deploy'
  };
}

/**
 * Builds the `deploy_logs` tool (stream stdout/stderr for a deployment).
 */
function createDeployLogsTool(client: any): DiscoveredMethod | null {
  if (!client?.deployments?.findLogs) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'deploy_logs',
    toolName: 'deploy_logs',
    description: 'Get runtime logs (stdout/stderr) for a deployment. Useful for debugging why a deployed chat fails.',
    sdkFunction: async (params: { deploymentId: string; since?: number }) => {
      const deploymentId = requireString(params?.deploymentId, 'deploymentId');
      const result = await client.deployments.findLogs(compact({
        deploymentId,
        since: params?.since
      }));
      return {
        logs: result?.logs || [],
        nextSince: result?.nextSince ?? null
      };
    },
    parameters: [
      {
        name: 'deploymentId',
        type: 'string',
        required: true,
        description: 'The deployment ID to inspect (returned by deploy)'
      },
      {
        name: 'since',
        type: 'number',
        required: false,
        description: 'Only return log entries after this timestamp'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.deploy_logs'
  };
}

/**
 * Builds the `deploy_errors` tool (structured error details for a deployment).
 */
function createDeployErrorsTool(client: any): DiscoveredMethod | null {
  if (!client?.deployments?.findErrors) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'deploy_errors',
    toolName: 'deploy_errors',
    description: 'Get structured error details for a deployment (error type, formatted error text).',
    sdkFunction: async (params: { deploymentId: string }) => {
      const deploymentId = requireString(params?.deploymentId, 'deploymentId');
      return await client.deployments.findErrors({ deploymentId });
    },
    parameters: [
      {
        name: 'deploymentId',
        type: 'string',
        required: true,
        description: 'The deployment ID to inspect'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.deploy_errors'
  };
}

/**
 * Builds the `list_versions` tool (paginated version history for a chat).
 */
function createListVersionsTool(client: any): DiscoveredMethod | null {
  if (!client?.chats?.findVersions) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'list_versions',
    toolName: 'list_versions',
    description: 'List the version history of a chat. Use to find a specific versionId (e.g. to roll back or get an older snapshot).',
    sdkFunction: async (params: { chatId: string; limit?: number; cursor?: string }) => {
      const chatId = requireString(params?.chatId, 'chatId');
      const result = await client.chats.findVersions(compact({
        chatId,
        limit: params?.limit,
        cursor: params?.cursor
      }));
      const versions = (result?.data || []).map((v: any) => ({
        id: v.id,
        status: v.status,
        demoUrl: v.demoUrl || null,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt || null
      }));
      return {
        versions,
        totalCount: result?.meta?.totalCount ?? versions.length,
        hasMore: result?.pagination?.hasMore ?? false,
        nextCursor: result?.pagination?.nextCursor ?? null
      };
    },
    parameters: [
      {
        name: 'chatId',
        type: 'string',
        required: true,
        description: 'The chat whose versions to list'
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Max versions to return'
      },
      {
        name: 'cursor',
        type: 'string',
        required: false,
        description: 'Pagination cursor from a previous response'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.list_versions'
  };
}

/**
 * Builds the `get_version` tool (a specific version's files).
 */
function createGetVersionTool(client: any): DiscoveredMethod | null {
  if (!client?.chats?.getVersion) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'get_version',
    toolName: 'get_version',
    description: 'Get the files for a specific chat version. Use with list_versions to inspect or restore an older snapshot.',
    sdkFunction: async (params: { chatId: string; versionId: string; includeDefaultFiles?: boolean }) => {
      const chatId = requireString(params?.chatId, 'chatId');
      const versionId = requireString(params?.versionId, 'versionId');

      const version = await client.chats.getVersion(compact({
        chatId,
        versionId,
        includeDefaultFiles: params?.includeDefaultFiles
      }));

      return {
        id: version.id,
        status: version.status,
        createdAt: version.createdAt,
        files: (version.files || []).map((f: any) => ({
          path: f.name,
          content: f.content,
          locked: f.locked ?? false
        }))
      };
    },
    parameters: [
      {
        name: 'chatId',
        type: 'string',
        required: true,
        description: 'The chat the version belongs to'
      },
      {
        name: 'versionId',
        type: 'string',
        required: true,
        description: 'The version ID to retrieve'
      },
      {
        name: 'includeDefaultFiles',
        type: 'boolean',
        required: false,
        description: 'Include default framework files alongside user files (default false)'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.get_version'
  };
}

/**
 * Formats the generate response to extract files clearly.
 *
 * @param response - Raw response from the v0 generate call
 * @returns Structured result with chatId, webUrl, files, and a summary message
 */
export function formatGenerateResponse(response: any): any {
  if (!response) {
    return { success: false, error: 'No response from v0' };
  }

  const chatId = response.id || '';
  const webUrl = response.webUrl || '';

  // Extract files from various possible locations
  const rawFiles =
    response.latestVersion?.files ||
    response.version?.files ||
    response.files ||
    response.data?.latestVersion?.files ||
    [];

  const files = rawFiles.map((f: any) => ({
    path: f.name,
    content: f.content
  }));

  return {
    success: true,
    chatId,
    webUrl,
    files,
    message: files.length > 0
      ? `Generated ${files.length} file(s). Use the Write tool to save them to your project.`
      : 'Generation complete. Check webUrl for preview.'
  };
}
