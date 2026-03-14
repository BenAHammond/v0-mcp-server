/**
 * Focused v0 Tools
 * 
 * A minimal set of tools for generating and managing v0 chats.
 * Designed for clarity: the LLM gets 5-6 tools that cover the core flows.
 */

import { DiscoveredMethod } from '../types.js';

/**
 * Creates the focused v0 tool set.
 * 
 * @param client - The v0 SDK client
 * @returns Array of tool definitions
 */
export function createV0Tools(client: any): DiscoveredMethod[] {
  const tools: DiscoveredMethod[] = [];

  // 1. generate - Create or continue a chat
  if (client?.chats?.create && client?.chats?.sendMessage) {
    tools.push({
      namespace: 'v0',
      method: 'generate',
      toolName: 'generate',
      sdkFunction: async (params: { prompt: string; chatId?: string; projectId?: string }) => {
        const prompt = params?.prompt?.trim();
        if (!prompt) throw new Error('generate requires a prompt');
        const chatId = params?.chatId?.trim();
        const projectId = params?.projectId?.trim();

        if (chatId) {
          // Continue existing chat
          return await client.chats.sendMessage({ chatId, message: prompt });
        }
        // Create new chat
        const createParams: any = { message: prompt };
        if (projectId) createParams.projectId = projectId;
        return await client.chats.create(createParams);
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
        }
      ],
      returnType: 'object',
      fullPath: 'v0.generate'
    });
  }

  // 2. list_chats - List chats to choose from
  if (client?.chats?.find) {
    tools.push({
      namespace: 'v0',
      method: 'list_chats',
      toolName: 'list_chats',
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
    });
  }

  // 3. get_chat - Get chat details + current files
  if (client?.chats?.getById) {
    tools.push({
      namespace: 'v0',
      method: 'get_chat',
      toolName: 'get_chat',
      sdkFunction: async (params: { chatId: string }) => {
        const chatId = params?.chatId?.trim();
        if (!chatId) throw new Error('get_chat requires chatId');
        
        const chat = await client.chats.getById({ chatId });
        
        // Extract files from latestVersion
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
    });
  }

  // 4. delete_chat - Delete a chat
  if (client?.chats?.delete) {
    tools.push({
      namespace: 'v0',
      method: 'delete_chat',
      toolName: 'delete_chat',
      sdkFunction: async (params: { chatId: string }) => {
        const chatId = params?.chatId?.trim();
        if (!chatId) throw new Error('delete_chat requires chatId');
        
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
    });
  }

  // 5. rate_limits - Check rate limits
  if (client?.rateLimits?.find) {
    tools.push({
      namespace: 'v0',
      method: 'rate_limits',
      toolName: 'rate_limits',
      sdkFunction: async () => {
        const result = await client.rateLimits.find();
        return result;
      },
      parameters: [],
      returnType: 'object',
      fullPath: 'v0.rate_limits'
    });
  }

  // 6. deploy - Deploy a chat version (optional but useful)
  if (client?.deployments?.create) {
    tools.push({
      namespace: 'v0',
      method: 'deploy',
      toolName: 'deploy',
      sdkFunction: async (params: { chatId: string; versionId?: string }) => {
        const chatId = params?.chatId?.trim();
        if (!chatId) throw new Error('deploy requires chatId');
        
        // Get the chat to find versionId if not provided
        let versionId = params?.versionId?.trim();
        if (!versionId && client?.chats?.getById) {
          const chat = await client.chats.getById({ chatId });
          versionId = chat?.latestVersion?.id;
        }
        if (!versionId) throw new Error('Could not determine versionId for deployment');

        const deployment = await client.deployments.create({ chatId, versionId });
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
        }
      ],
      returnType: 'object',
      fullPath: 'v0.deploy'
    });
  }

  return tools;
}

/**
 * Formats the generate response to extract files clearly.
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
