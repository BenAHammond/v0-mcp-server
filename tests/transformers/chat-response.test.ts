/**
 * Tests for Chat Response Transformer
 */

import { describe, it, expect } from '@jest/globals';
import {
  transformResponse,
  toComponentResponse,
  extractMetadata,
  extractChatId,
  extractFileContent,
  hasValidComponentFiles,
  V0ChatData,
  TransformationError
} from '../../src/transformers/chat-response.js';
import { isLeft, isRight } from '../../src/types/either.js';

describe('Chat Response Transformer', () => {
  describe('transformResponse', () => {
    it('should transform valid chat data with latestVersion files', () => {
      const chatData: V0ChatData = {
        id: 'test-chat-123',
        demo: 'https://v0.dev/demo/123',
        latestVersion: {
          files: [
            {
              name: 'Button.tsx',
              content: 'export const Button = () => <button>Click me</button>',
              object: 'file'
            },
            {
              name: 'styles.css',
              content: '.button { color: blue; }'
            }
          ]
        }
      };

      const result = transformResponse(chatData);
      
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.chatId).toBe('test-chat-123');
        expect(result.right.previewUrl).toBe('https://v0.dev/demo/123');
        expect(result.right.files).toHaveLength(2);
        expect(result.right.files[0].name).toBe('Button.tsx');
        expect(result.right.files[0].type).toBe('component');
        expect(result.right.files[0].language).toBe('typescript');
      }
    });

    it('should transform valid chat data with root level files', () => {
      const chatData: V0ChatData = {
        id: 'test-chat-456',
        previewUrl: 'https://v0.dev/preview/456',
        files: [
          {
            source: 'export default function App() { return <div>Hello</div> }',
            lang: 'tsx',
            meta: {
              file: 'App.tsx'
            }
          }
        ]
      };

      const result = transformResponse(chatData);
      
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.chatId).toBe('test-chat-456');
        expect(result.right.previewUrl).toBe('https://v0.dev/preview/456');
        expect(result.right.files).toHaveLength(1);
        expect(result.right.files[0].name).toBe('App.tsx');
        expect(result.right.files[0].content).toContain('Hello');
      }
    });

    it('should handle missing chat ID', () => {
      const chatData = {
        demo: 'https://v0.dev/demo/123',
        files: []
      };

      const result = transformResponse(chatData);
      
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('MISSING_CHAT_ID');
      }
    });

    it('should handle invalid chat data', () => {
      const result = transformResponse(null);
      
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('INVALID_CHAT_DATA');
      }
    });

    it('should handle missing files', () => {
      const chatData: V0ChatData = {
        id: 'test-chat-789',
        previewUrl: 'https://v0.dev/preview/789'
      };

      const result = transformResponse(chatData);
      
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('NO_FILES_FOUND');
      }
    });

    it('should use fallback URLs in correct order', () => {
      const testCases = [
        {
          data: { id: '1', demo: 'demo-url', previewUrl: 'preview-url', webUrl: 'web-url' },
          expected: 'demo-url'
        },
        {
          data: { id: '2', previewUrl: 'preview-url', webUrl: 'web-url' },
          expected: 'preview-url'
        },
        {
          data: { id: '3', webUrl: 'web-url' },
          expected: 'web-url'
        },
        {
          data: { id: '4', latestVersion: { demoUrl: 'latest-demo' }, webUrl: 'web-url' },
          expected: 'latest-demo'
        }
      ];

      for (const testCase of testCases) {
        const chatData: V0ChatData = {
          ...testCase.data,
          files: [{ source: 'test', lang: 'js', meta: { file: 'test.js' } }]
        };
        
        const result = transformResponse(chatData);
        if (isRight(result)) {
          expect(result.right.previewUrl).toBe(testCase.expected);
        }
      }
    });
  });

  describe('toComponentResponse', () => {
    it('should convert V0ChatResponse to ComponentResponse', () => {
      const chatResponse = {
        chatId: 'test-123',
        previewUrl: 'https://v0.dev/preview/123',
        files: [
          {
            name: 'Component.tsx',
            content: 'const Component = () => <div>Test</div>',
            type: 'component',
            language: 'typescript'
          }
        ]
      };

      const result = toComponentResponse(chatResponse);

      expect(result.success).toBe(true);
      expect(result.chatId).toBe('test-123');
      expect(result.previewUrl).toBe('https://v0.dev/preview/123');
      expect(result.files).toHaveLength(1);
      expect(result.files[0].size).toBeGreaterThan(0);
      expect(result.files[0].lines).toBe(1);
      expect(result.message).toContain('1 file(s) successfully');
      expect(result.formattedContent).toContain('## Component.tsx');
      expect(result.formattedContent).toContain('```typescript');
    });
  });

  describe('extractMetadata', () => {
    it('should extract metadata from valid chat data', () => {
      const chatData: V0ChatData = {
        id: 'test-123',
        demo: 'https://v0.dev/demo/123',
        latestVersion: {
          files: [
            { name: 'App.tsx', content: 'export default function App() {}' },
            { name: 'styles.css', content: 'body { margin: 0; }' }
          ]
        }
      };

      const metadata = extractMetadata(chatData);

      expect(metadata.hasPreview).toBe(true);
      expect(metadata.fileCount).toBe(2);
      expect(metadata.totalSize).toBeGreaterThan(0);
      expect(metadata.fileTypes).toContain('component');
      expect(metadata.fileTypes).toContain('style');
    });

    it('should handle chat data without files', () => {
      const chatData: V0ChatData = {
        id: 'test-456'
      };

      const metadata = extractMetadata(chatData);

      expect(metadata.hasPreview).toBe(false);
      expect(metadata.fileCount).toBe(0);
      expect(metadata.totalSize).toBe(0);
      expect(metadata.fileTypes).toEqual([]);
    });
  });

  describe('extractChatId', () => {
    it('should extract chat ID from valid data', () => {
      const result = extractChatId({ id: 'chat-123' });
      
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe('chat-123');
      }
    });

    it('should return error for invalid data', () => {
      const result = extractChatId({ notId: 'chat-123' });
      
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('MISSING_CHAT_ID');
      }
    });
  });

  describe('extractFileContent', () => {
    it('should extract file content by name', () => {
      const chatData: V0ChatData = {
        id: 'test-123',
        latestVersion: {
          files: [
            { name: 'App.tsx', content: 'const App = () => <div>App</div>' },
            { name: 'Button.tsx', content: 'const Button = () => <button>Click</button>' }
          ]
        }
      };

      const result = extractFileContent(chatData, 'Button.tsx');
      
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toContain('Click');
      }
    });

    it('should return error for non-existent file', () => {
      const chatData: V0ChatData = {
        id: 'test-123',
        latestVersion: {
          files: [
            { name: 'App.tsx', content: 'const App = () => <div>App</div>' }
          ]
        }
      };

      const result = extractFileContent(chatData, 'NotFound.tsx');
      
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.code).toBe('INVALID_FILE_FORMAT');
        expect(result.left.message).toContain('NotFound.tsx');
      }
    });
  });

  describe('hasValidComponentFiles', () => {
    it('should return true for chat with component files', () => {
      const chatData: V0ChatData = {
        id: 'test-123',
        latestVersion: {
          files: [
            { name: 'App.tsx', content: 'const App = () => <div>App</div>' },
            { name: 'styles.css', content: 'body { margin: 0; }' }
          ]
        }
      };

      expect(hasValidComponentFiles(chatData)).toBe(true);
    });

    it('should return false for chat without component files', () => {
      const chatData: V0ChatData = {
        id: 'test-123',
        latestVersion: {
          files: [
            { name: 'styles.css', content: 'body { margin: 0; }' },
            { name: 'config.json', content: '{}' }
          ]
        }
      };

      expect(hasValidComponentFiles(chatData)).toBe(false);
    });

    it('should return false for chat without files', () => {
      const chatData: V0ChatData = {
        id: 'test-123'
      };

      expect(hasValidComponentFiles(chatData)).toBe(false);
    });
  });
});