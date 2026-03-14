import { describe, it, expect } from '@jest/globals';
import { createV0Tools, formatGenerateResponse } from '../../src/tools/v0-tools.js';

describe('createV0Tools', () => {
  const mockClient = {
    chats: {
      create: async () => ({ id: 'chat-123' }),
      sendMessage: async () => ({ id: 'chat-123' }),
      find: async () => ({ data: [] }),
      getById: async () => ({ id: 'chat-123', latestVersion: { files: [] } }),
      delete: async () => ({})
    },
    rateLimits: {
      find: async () => ({ rateLimits: [] })
    },
    deployments: {
      create: async () => ({ id: 'deploy-123', url: 'https://example.com' })
    }
  };

  it('should create the focused v0 tools', () => {
    const tools = createV0Tools(mockClient);
    const toolNames = tools.map(t => t.toolName);
    
    expect(toolNames).toContain('generate');
    expect(toolNames).toContain('list_chats');
    expect(toolNames).toContain('get_chat');
    expect(toolNames).toContain('delete_chat');
    expect(toolNames).toContain('rate_limits');
    expect(toolNames).toContain('deploy');
    expect(toolNames.length).toBe(6);
  });

  it('should not include v0_ prefix in tool names', () => {
    const tools = createV0Tools(mockClient);
    tools.forEach(tool => {
      expect(tool.toolName).not.toMatch(/^v0_/);
    });
  });

  it('generate tool should have prompt (required) and chatId (optional)', () => {
    const tools = createV0Tools(mockClient);
    const generateTool = tools.find(t => t.toolName === 'generate');
    
    expect(generateTool).toBeDefined();
    const promptParam = generateTool!.parameters.find(p => p.name === 'prompt');
    const chatIdParam = generateTool!.parameters.find(p => p.name === 'chatId');
    
    expect(promptParam?.required).toBe(true);
    expect(chatIdParam?.required).toBe(false);
  });
});

describe('formatGenerateResponse', () => {
  it('should format response with files', () => {
    const response = {
      id: 'chat-123',
      webUrl: 'https://v0.dev/chat/chat-123',
      latestVersion: {
        files: [
          { name: 'component.tsx', content: 'export const X = () => <div>Hi</div>' }
        ]
      }
    };
    
    const formatted = formatGenerateResponse(response);
    
    expect(formatted.success).toBe(true);
    expect(formatted.chatId).toBe('chat-123');
    expect(formatted.files).toHaveLength(1);
    expect(formatted.files[0].path).toBe('component.tsx');
  });

  it('should handle empty response', () => {
    const formatted = formatGenerateResponse(null);
    expect(formatted.success).toBe(false);
  });
});
