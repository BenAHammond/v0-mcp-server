import { describe, it, expect } from '@jest/globals';
import { UnifiedCodeFormatter } from '../../src/unified-code-formatter';
import { V0File } from '../../src/types/api-types';

describe('UnifiedCodeFormatter', () => {
  let formatter: UnifiedCodeFormatter;

  beforeEach(() => {
    formatter = new UnifiedCodeFormatter();
  });

  describe('formatResponse', () => {
    const testFiles: V0File[] = [
      {
        path: 'App.tsx',
        content: 'export default function App() { return <div>Hello</div>; }'
      },
      {
        path: 'styles.css',
        content: '.container { padding: 20px; }'
      }
    ];

    it('should format with simple mode', () => {
      const result = formatter.formatResponse(testFiles, { mode: 'simple' });
      
      expect(result.formattedContent).toContain('App.tsx');
      expect(result.formattedContent).toContain('export default function App()');
      expect(result.formattedContent).not.toContain('```');
      expect(result.files).toHaveLength(2);
    });

    it('should format with enhanced mode', () => {
      const result = formatter.formatResponse(testFiles, { mode: 'enhanced' });
      
      expect(result.formattedContent).toContain('```tsx');
      expect(result.formattedContent).toContain('```css');
      expect(result.formattedContent).toContain('File: App.tsx');
      expect(result.files).toHaveLength(2);
    });

    it('should format with rich mode', () => {
      const result = formatter.formatResponse(testFiles, { 
        mode: 'rich',
        useTreeFormat: true,
        useIcons: true
      });
      
      expect(result.formattedContent).toContain('File Structure');
      expect(result.formattedContent).toContain('└──');
      expect(result.files).toHaveLength(2);
    });

    it('should handle empty files array', () => {
      const result = formatter.formatResponse([]);
      
      expect(result.formattedContent).toBe('');
      expect(result.files).toHaveLength(0);
    });

    it('should sort files by type when specified', () => {
      const files: V0File[] = [
        { path: 'styles.css', content: 'css' },
        { path: 'App.tsx', content: 'tsx' },
        { path: 'utils.ts', content: 'ts' }
      ];

      const result = formatter.formatResponse(files, { 
        sortByType: true,
        mode: 'simple'
      });
      
      const lines = result.formattedContent.split('\n');
      const fileOrder = lines
        .filter(line => line.includes('.tsx') || line.includes('.ts') || line.includes('.css'))
        .map(line => line.trim());
      
      expect(fileOrder[0]).toContain('.tsx');
      expect(fileOrder[1]).toContain('.ts');
      expect(fileOrder[2]).toContain('.css');
    });
  });

  describe('formatForClaudeCode', () => {
    const testFiles: V0File[] = [
      {
        path: 'App.tsx',
        content: 'export default function App() { return <div>Hello</div>; }'
      }
    ];

    it('should format for Claude Code with links', () => {
      const result = formatter.formatForClaudeCode(
        testFiles, 
        'chat123', 
        'https://v0.dev/preview/123'
      );
      
      expect(result).toContain('View in v0');
      expect(result).toContain('https://v0.dev/chat/chat123');
      expect(result).toContain('https://v0.dev/preview/123');
      expect(result).toContain('```tsx');
    });

    it('should include all formatting options', () => {
      const result = formatter.formatForClaudeCode(
        testFiles, 
        'chat123', 
        'https://v0.dev/preview/123',
        {
          mode: 'rich',
          useTreeFormat: true,
          useIcons: true,
          includeSummary: true
        }
      );
      
      expect(result).toContain('Component Summary');
      expect(result).toContain('File Structure');
      expect(result).toContain('View in v0');
    });

    it('should handle missing preview URL', () => {
      const result = formatter.formatForClaudeCode(
        testFiles, 
        'chat123', 
        ''
      );
      
      expect(result).toContain('View in v0');
      expect(result).not.toContain('Preview:');
    });
  });

  describe('edge cases', () => {
    it('should handle files with no content', () => {
      const files: V0File[] = [
        { path: 'empty.ts', content: '' }
      ];

      const result = formatter.formatResponse(files);
      expect(result.formattedContent).toContain('empty.ts');
      expect(result.files).toHaveLength(1);
    });

    it('should handle files with special characters in path', () => {
      const files: V0File[] = [
        { path: 'src/components/[id].tsx', content: 'content' }
      ];

      const result = formatter.formatResponse(files);
      expect(result.formattedContent).toContain('[id].tsx');
    });

    it('should handle very long content', () => {
      const longContent = 'x'.repeat(10000);
      const files: V0File[] = [
        { path: 'long.ts', content: longContent }
      ];

      const result = formatter.formatResponse(files);
      expect(result.formattedContent).toContain('long.ts');
      expect(result.formattedContent.length).toBeGreaterThan(10000);
    });
  });
});