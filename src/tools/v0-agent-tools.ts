/**
 * Agentic v0 Tools
 *
 * Entry points that require richer, structured input than `generate`:
 * `init_code` seeds a chat from your own source, and `resolve_task` lets Claude
 * act as the human-in-the-loop for v0's autonomous agent.
 */

import { DiscoveredMethod } from '../types.js';
import { compact, requireString } from './helpers.js';

/**
 * Creates the agentic v0 tool set.
 *
 * @param client - The v0 SDK client
 * @returns Array of tool definitions
 */
export function createAgentTools(client: any): DiscoveredMethod[] {
  const builders = [createInitCodeTool, createResolveTaskTool];

  const tools: DiscoveredMethod[] = [];
  for (const build of builders) {
    const tool = build(client);
    if (tool) tools.push(tool);
  }

  return tools;
}

/**
 * Builds the `init_code` tool (bring-your-own-code chat initialization).
 */
function createInitCodeTool(client: any): DiscoveredMethod | null {
  if (!client?.chats?.init) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'init_code',
    toolName: 'init_code',
    description:
      'Initialize a chat from existing code instead of a prompt. Choose one source via `type`: "files" (inline file contents or URLs), "repo" (git repo URL + optional branch), "registry" (npm registry URL), "zip" (zip archive URL), or "template" (a v0 template id). Returns a new chat you can then continue with generate.',
    sdkFunction: async (params: any) => {
      const initType = requireString(params?.type, 'type');

      const base = compact({
        name: params?.name,
        chatPrivacy: params?.chatPrivacy,
        projectId: params?.projectId
      });

      switch (initType) {
        case 'files': {
          const files = params?.files;
          if (!Array.isArray(files) || files.length === 0) {
            throw new Error('init_code with type "files" requires a non-empty files array');
          }
          return await client.chats.init({ ...base, type: 'files', files });
        }
        case 'repo': {
          const url = requireString(params?.repoUrl, 'repoUrl');
          const repo: any = { url };
          if (params?.repoBranch) repo.branch = params.repoBranch;
          return await client.chats.init(compact({ ...base, type: 'repo', repo, lockAllFiles: params?.lockAllFiles }));
        }
        case 'registry': {
          const url = requireString(params?.registryUrl, 'registryUrl');
          return await client.chats.init(compact({ ...base, type: 'registry', registry: { url }, lockAllFiles: params?.lockAllFiles }));
        }
        case 'zip': {
          const url = requireString(params?.zipUrl, 'zipUrl');
          return await client.chats.init(compact({ ...base, type: 'zip', zip: { url }, lockAllFiles: params?.lockAllFiles }));
        }
        case 'template': {
          const templateId = requireString(params?.templateId, 'templateId');
          return await client.chats.init({ ...base, type: 'template', templateId });
        }
        default:
          throw new Error(`Unknown init type: ${initType}`);
      }
    },
    parameters: [
      {
        name: 'type',
        type: 'string',
        required: true,
        description: 'Source type: files, repo, registry, zip, or template'
      },
      {
        name: 'name',
        type: 'string',
        required: false,
        description: 'Optional name for the new chat'
      },
      {
        name: 'chatPrivacy',
        type: 'string',
        required: false,
        description: 'Visibility: public, private, team, team-edit, or unlisted'
      },
      {
        name: 'projectId',
        type: 'string',
        required: false,
        description: 'Associate the new chat with this project'
      },
      {
        name: 'files',
        type: 'array',
        required: false,
        description: 'For type "files": array of { name, content } or { name, url } (plus optional locked)'
      },
      {
        name: 'repoUrl',
        type: 'string',
        required: false,
        description: 'For type "repo": git repository URL'
      },
      {
        name: 'repoBranch',
        type: 'string',
        required: false,
        description: 'For type "repo": branch name (optional)'
      },
      {
        name: 'registryUrl',
        type: 'string',
        required: false,
        description: 'For type "registry": npm registry URL'
      },
      {
        name: 'zipUrl',
        type: 'string',
        required: false,
        description: 'For type "zip": zip archive URL'
      },
      {
        name: 'templateId',
        type: 'string',
        required: false,
        description: 'For type "template": v0 template id'
      },
      {
        name: 'lockAllFiles',
        type: 'boolean',
        required: false,
        description: 'For repo/registry/zip: lock all files so they cannot be edited'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.init_code'
  };
}

/**
 * Builds the `resolve_task` tool (respond to v0's autonomous agent).
 */
function createResolveTaskTool(client: any): DiscoveredMethod | null {
  if (!client?.chats?.resolveTask) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'resolve_task',
    toolName: 'resolve_task',
    description:
      'Answer a pending question from v0\'s autonomous agent so it can continue. `taskType` selects the response shape: "confirmed-steps" (confirm applied scripts/env vars/integrations), "plan-exit-response" (approve/reject/request-changes with `status` + `content`), "answered-questions" (answer clarification questions via `answers`), "confirmed-permissions" (allow dynamic tools via `permissions`), or "vercel-connect-setup" (acknowledge Vercel setup). Returns the updated chat.',
    sdkFunction: async (params: any) => {
      const chatId = requireString(params?.chatId, 'chatId');
      const taskType = requireString(params?.taskType, 'taskType');

      let task: any;
      switch (taskType) {
        case 'confirmed-steps':
          task = compact({
            type: 'confirmed-steps',
            connectedIntegrationNames: params?.connectedIntegrationNames,
            connectedMcpPresetNames: params?.connectedMcpPresetNames,
            appliedScripts: params?.appliedScripts,
            addedEnvVars: params?.addedEnvVars
          });
          break;
        case 'plan-exit-response': {
          const status = requireString(params?.status, 'status');
          const content = requireString(params?.content, 'content');
          task = { type: 'plan-exit-response', status, content };
          break;
        }
        case 'answered-questions': {
          const answers = params?.answers;
          if (!Array.isArray(answers)) {
            throw new Error('resolve_task with type "answered-questions" requires an answers array');
          }
          task = { type: 'answered-questions', answers };
          break;
        }
        case 'confirmed-permissions': {
          const permissions = params?.permissions;
          if (!Array.isArray(permissions)) {
            throw new Error('resolve_task with type "confirmed-permissions" requires a permissions array');
          }
          task = compact({
            type: 'confirmed-permissions',
            permissions,
            userMessage: params?.userMessage
          });
          break;
        }
        case 'vercel-connect-setup':
          task = { type: 'vercel-connect-setup' };
          break;
        default:
          throw new Error(`Unknown task type: ${taskType}`);
      }

      return await client.chats.resolveTask(compact({ chatId, task }));
    },
    parameters: [
      {
        name: 'chatId',
        type: 'string',
        required: true,
        description: 'The chat awaiting a task resolution'
      },
      {
        name: 'taskType',
        type: 'string',
        required: true,
        description: 'Task type: confirmed-steps, plan-exit-response, answered-questions, confirmed-permissions, or vercel-connect-setup'
      },
      {
        name: 'status',
        type: 'string',
        required: false,
        description: 'For plan-exit-response: approved, rejected, or request-changes'
      },
      {
        name: 'content',
        type: 'string',
        required: false,
        description: 'For plan-exit-response: feedback text'
      },
      {
        name: 'answers',
        type: 'array',
        required: false,
        description: 'For answered-questions: array of { questionId, questionText, selectedLabels[], customText? }'
      },
      {
        name: 'permissions',
        type: 'array',
        required: false,
        description: 'For confirmed-permissions: array of { type: "ALLOW_DYNAMIC_TOOL_STRICT", toolName, input }'
      },
      {
        name: 'userMessage',
        type: 'string',
        required: false,
        description: 'For confirmed-permissions: optional message to the agent'
      },
      {
        name: 'connectedIntegrationNames',
        type: 'array',
        required: false,
        description: 'For confirmed-steps: integration names to connect'
      },
      {
        name: 'connectedMcpPresetNames',
        type: 'array',
        required: false,
        description: 'For confirmed-steps: MCP preset names to connect'
      },
      {
        name: 'appliedScripts',
        type: 'array',
        required: false,
        description: 'For confirmed-steps: scripts to apply'
      },
      {
        name: 'addedEnvVars',
        type: 'array',
        required: false,
        description: 'For confirmed-steps: env var names to add'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.resolve_task'
  };
}
