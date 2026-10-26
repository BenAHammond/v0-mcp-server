/**
 * Project & Environment Variable v0 Tools
 *
 * Organization hygiene: list/create/get/update/delete projects, assign chats to
 * projects, and manage a project's environment variables (secrets).
 */

import { DiscoveredMethod } from '../types.js';
import { compact, requireString } from './helpers.js';

/**
 * Creates the project and env-var v0 tool set.
 *
 * @param client - The v0 SDK client
 * @returns Array of tool definitions
 */
export function createProjectTools(client: any): DiscoveredMethod[] {
  const builders = [
    createListProjectsTool,
    createCreateProjectTool,
    createGetProjectTool,
    createUpdateProjectTool,
    createDeleteProjectTool,
    createAssignProjectTool,
    createListEnvVarsTool,
    createCreateEnvVarsTool,
    createUpdateEnvVarsTool,
    createDeleteEnvVarsTool,
    createGetEnvVarTool
  ];

  const tools: DiscoveredMethod[] = [];
  for (const build of builders) {
    const tool = build(client);
    if (tool) tools.push(tool);
  }

  return tools;
}

/**
 * Shapes a project detail into a concise object (drops nested chat bodies).
 */
function shapeProject(project: any): any {
  if (!project) return project;
  return {
    id: project.id,
    name: project.name,
    privacy: project.privacy,
    webUrl: project.webUrl,
    description: project.description || null,
    instructions: project.instructions || null,
    vercelProjectId: project.vercelProjectId || null,
    createdAt: project.createdAt
  };
}

/**
 * Builds the `list_projects` tool.
 */
function createListProjectsTool(client: any): DiscoveredMethod | null {
  if (!client?.projects?.find) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'list_projects',
    toolName: 'list_projects',
    description: 'List all projects (id, name, privacy, webUrl). Use to find a projectId for organize_chats or env var management.',
    sdkFunction: async () => {
      const result = await client.projects.find();
      const projects = (result?.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        privacy: p.privacy,
        webUrl: p.webUrl,
        createdAt: p.createdAt
      }));
      return { projects, total: projects.length };
    },
    parameters: [],
    returnType: 'object',
    fullPath: 'v0.list_projects'
  };
}

/**
 * Builds the `create_project` tool.
 */
function createCreateProjectTool(client: any): DiscoveredMethod | null {
  if (!client?.projects?.create) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'create_project',
    toolName: 'create_project',
    description: 'Create a new project. Optionally set description, instructions, privacy, and initial environment variables.',
    sdkFunction: async (params: any) => {
      const name = requireString(params?.name, 'name');
      const project = await client.projects.create(compact({
        name,
        description: params?.description,
        icon: params?.icon,
        instructions: params?.instructions,
        privacy: params?.projectPrivacy,
        vercelProjectId: params?.vercelProjectId,
        environmentVariables: params?.environmentVariables
      }));
      return shapeProject(project);
    },
    parameters: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: 'Project name'
      },
      {
        name: 'description',
        type: 'string',
        required: false,
        description: 'Optional description'
      },
      {
        name: 'instructions',
        type: 'string',
        required: false,
        description: 'Optional project-level instructions applied to all chats'
      },
      {
        name: 'projectPrivacy',
        type: 'string',
        required: false,
        description: 'Visibility: private or team'
      },
      {
        name: 'vercelProjectId',
        type: 'string',
        required: false,
        description: 'Link to an existing Vercel project'
      },
      {
        name: 'environmentVariables',
        type: 'array',
        required: false,
        description: 'Initial env vars: array of { key, value }'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.create_project'
  };
}

/**
 * Builds the `get_project` tool.
 */
function createGetProjectTool(client: any): DiscoveredMethod | null {
  if (!client?.projects?.getById) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'get_project',
    toolName: 'get_project',
    description: 'Get project details including its chats (id + name).',
    sdkFunction: async (params: { projectId: string }) => {
      const projectId = requireString(params?.projectId, 'projectId');
      const project = await client.projects.getById({ projectId });
      return {
        ...shapeProject(project),
        chats: (project?.chats || []).map((c: any) => ({ id: c.id, name: c.name || '(untitled)' }))
      };
    },
    parameters: [
      {
        name: 'projectId',
        type: 'string',
        required: true,
        description: 'The project ID to retrieve'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.get_project'
  };
}

/**
 * Builds the `update_project` tool.
 */
function createUpdateProjectTool(client: any): DiscoveredMethod | null {
  if (!client?.projects?.update) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'update_project',
    toolName: 'update_project',
    description: 'Update a project\'s name, description, instructions, or privacy.',
    sdkFunction: async (params: any) => {
      const projectId = requireString(params?.projectId, 'projectId');
      const project = await client.projects.update(compact({
        projectId,
        name: params?.name,
        description: params?.description,
        instructions: params?.instructions,
        privacy: params?.projectPrivacy
      }));
      return shapeProject(project);
    },
    parameters: [
      {
        name: 'projectId',
        type: 'string',
        required: true,
        description: 'The project ID to update'
      },
      {
        name: 'name',
        type: 'string',
        required: false,
        description: 'New project name'
      },
      {
        name: 'description',
        type: 'string',
        required: false,
        description: 'New description'
      },
      {
        name: 'instructions',
        type: 'string',
        required: false,
        description: 'New project-level instructions'
      },
      {
        name: 'projectPrivacy',
        type: 'string',
        required: false,
        description: 'Visibility: private or team'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.update_project'
  };
}

/**
 * Builds the `delete_project` tool.
 */
function createDeleteProjectTool(client: any): DiscoveredMethod | null {
  if (!client?.projects?.delete) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'delete_project',
    toolName: 'delete_project',
    description: 'Delete a project. Optionally also delete all its chats.',
    sdkFunction: async (params: { projectId: string; deleteAllChats?: boolean }) => {
      const projectId = requireString(params?.projectId, 'projectId');
      await client.projects.delete(compact({
        projectId,
        deleteAllChats: params?.deleteAllChats
      }));
      return { deleted: true, projectId };
    },
    parameters: [
      {
        name: 'projectId',
        type: 'string',
        required: true,
        description: 'The project ID to delete'
      },
      {
        name: 'deleteAllChats',
        type: 'boolean',
        required: false,
        description: 'Also delete all chats in the project (default false)'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.delete_project'
  };
}

/**
 * Builds the `assign_project` tool.
 */
function createAssignProjectTool(client: any): DiscoveredMethod | null {
  if (!client?.projects?.assign) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'assign_project',
    toolName: 'assign_project',
    description: 'Move a chat into a project (assign its projectId).',
    sdkFunction: async (params: { projectId: string; chatId: string }) => {
      const projectId = requireString(params?.projectId, 'projectId');
      const chatId = requireString(params?.chatId, 'chatId');
      await client.projects.assign({ projectId, chatId });
      return { assigned: true, projectId, chatId };
    },
    parameters: [
      {
        name: 'projectId',
        type: 'string',
        required: true,
        description: 'The project to assign the chat to'
      },
      {
        name: 'chatId',
        type: 'string',
        required: true,
        description: 'The chat to assign'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.assign_project'
  };
}

/**
 * Shapes an env-var object into a concise form (key, value, decrypted, id).
 */
function shapeEnvVar(v: any): any {
  return {
    id: v.id,
    key: v.key,
    value: v.value,
    decrypted: v.decrypted ?? false
  };
}

/**
 * Builds the `list_env_vars` tool.
 */
function createListEnvVarsTool(client: any): DiscoveredMethod | null {
  if (!client?.projects?.findEnvVars) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'list_env_vars',
    toolName: 'list_env_vars',
    description: 'List a project\'s environment variables. Values are encrypted unless `decrypted` is true.',
    sdkFunction: async (params: { projectId: string; decrypted?: boolean }) => {
      const projectId = requireString(params?.projectId, 'projectId');
      const result = await client.projects.findEnvVars(compact({
        projectId,
        decrypted: params?.decrypted
      }));
      return { variables: (result?.data || []).map(shapeEnvVar) };
    },
    parameters: [
      {
        name: 'projectId',
        type: 'string',
        required: true,
        description: 'The project whose env vars to list'
      },
      {
        name: 'decrypted',
        type: 'boolean',
        required: false,
        description: 'Return plaintext values (default false, returns encrypted)'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.list_env_vars'
  };
}

/**
 * Builds the `create_env_vars` tool.
 */
function createCreateEnvVarsTool(client: any): DiscoveredMethod | null {
  if (!client?.projects?.createEnvVars) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'create_env_vars',
    toolName: 'create_env_vars',
    description: 'Add environment variables to a project by key. Set `upsert` to overwrite existing keys.',
    sdkFunction: async (params: any) => {
      const projectId = requireString(params?.projectId, 'projectId');
      const environmentVariables = params?.environmentVariables;
      if (!Array.isArray(environmentVariables) || environmentVariables.length === 0) {
        throw new Error('create_env_vars requires a non-empty environmentVariables array of { key, value }');
      }
      const result = await client.projects.createEnvVars(compact({
        projectId,
        environmentVariables,
        upsert: params?.upsert,
        decrypted: params?.decrypted
      }));
      return { variables: (result?.data || []).map(shapeEnvVar) };
    },
    parameters: [
      {
        name: 'projectId',
        type: 'string',
        required: true,
        description: 'The project to add env vars to'
      },
      {
        name: 'environmentVariables',
        type: 'array',
        required: true,
        description: 'Array of { key, value } to add'
      },
      {
        name: 'upsert',
        type: 'boolean',
        required: false,
        description: 'Overwrite existing keys (default false)'
      },
      {
        name: 'decrypted',
        type: 'boolean',
        required: false,
        description: 'Return plaintext values in the response'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.create_env_vars'
  };
}

/**
 * Builds the `update_env_vars` tool.
 */
function createUpdateEnvVarsTool(client: any): DiscoveredMethod | null {
  if (!client?.projects?.updateEnvVars) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'update_env_vars',
    toolName: 'update_env_vars',
    description: 'Update existing environment variables by id (use list_env_vars to find ids).',
    sdkFunction: async (params: any) => {
      const projectId = requireString(params?.projectId, 'projectId');
      const environmentVariables = params?.environmentVariables;
      if (!Array.isArray(environmentVariables) || environmentVariables.length === 0) {
        throw new Error('update_env_vars requires a non-empty environmentVariables array of { id, value }');
      }
      const result = await client.projects.updateEnvVars(compact({
        projectId,
        environmentVariables,
        decrypted: params?.decrypted
      }));
      return { variables: (result?.data || []).map(shapeEnvVar) };
    },
    parameters: [
      {
        name: 'projectId',
        type: 'string',
        required: true,
        description: 'The project whose env vars to update'
      },
      {
        name: 'environmentVariables',
        type: 'array',
        required: true,
        description: 'Array of { id, value } to update'
      },
      {
        name: 'decrypted',
        type: 'boolean',
        required: false,
        description: 'Return plaintext values in the response'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.update_env_vars'
  };
}

/**
 * Builds the `delete_env_vars` tool.
 */
function createDeleteEnvVarsTool(client: any): DiscoveredMethod | null {
  if (!client?.projects?.deleteEnvVars) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'delete_env_vars',
    toolName: 'delete_env_vars',
    description: 'Delete environment variables by id (use list_env_vars to find ids).',
    sdkFunction: async (params: { projectId: string; environmentVariableIds: string[] }) => {
      const projectId = requireString(params?.projectId, 'projectId');
      const environmentVariableIds = params?.environmentVariableIds;
      if (!Array.isArray(environmentVariableIds) || environmentVariableIds.length === 0) {
        throw new Error('delete_env_vars requires a non-empty environmentVariableIds array');
      }
      const result = await client.projects.deleteEnvVars({ projectId, environmentVariableIds });
      return { deleted: (result?.data || []).map((d: any) => d.id) };
    },
    parameters: [
      {
        name: 'projectId',
        type: 'string',
        required: true,
        description: 'The project whose env vars to delete'
      },
      {
        name: 'environmentVariableIds',
        type: 'array',
        required: true,
        description: 'Array of env var ids to delete'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.delete_env_vars'
  };
}

/**
 * Builds the `get_env_var` tool.
 */
function createGetEnvVarTool(client: any): DiscoveredMethod | null {
  if (!client?.projects?.getEnvVar) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'get_env_var',
    toolName: 'get_env_var',
    description: 'Get a single environment variable by id. Values are encrypted unless `decrypted` is true.',
    sdkFunction: async (params: { projectId: string; environmentVariableId: string; decrypted?: boolean }) => {
      const projectId = requireString(params?.projectId, 'projectId');
      const environmentVariableId = requireString(params?.environmentVariableId, 'environmentVariableId');
      const result = await client.projects.getEnvVar(compact({
        projectId,
        environmentVariableId,
        decrypted: params?.decrypted
      }));
      return shapeEnvVar(result?.data || result);
    },
    parameters: [
      {
        name: 'projectId',
        type: 'string',
        required: true,
        description: 'The project the env var belongs to'
      },
      {
        name: 'environmentVariableId',
        type: 'string',
        required: true,
        description: 'The env var id to retrieve'
      },
      {
        name: 'decrypted',
        type: 'boolean',
        required: false,
        description: 'Return the plaintext value'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.get_env_var'
  };
}
