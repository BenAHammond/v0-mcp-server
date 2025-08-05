import { describe, it, expect } from '@jest/globals';
import { FileUtils, FormatUtils, ValidationUtils } from '../../src/utils';

describe('FileUtils', () => {
  describe('detectLanguage', () => {
    it('should detect common languages', () => {
      expect(FileUtils.detectLanguage('App.tsx')).toBe('tsx');
      expect(FileUtils.detectLanguage('index.ts')).toBe('typescript');
      expect(FileUtils.detectLanguage('styles.css')).toBe('css');
      expect(FileUtils.detectLanguage('index.html')).toBe('html');
      expect(FileUtils.detectLanguage('config.json')).toBe('json');
      expect(FileUtils.detectLanguage('App.jsx')).toBe('jsx');
      expect(FileUtils.detectLanguage('script.js')).toBe('javascript');
    });

    it('should return plaintext for unknown extensions', () => {
      expect(FileUtils.detectLanguage('readme.txt')).toBe('plaintext');
      expect(FileUtils.detectLanguage('unknown.xyz')).toBe('plaintext');
    });

    it('should handle files without extensions', () => {
      expect(FileUtils.detectLanguage('README')).toBe('plaintext');
      expect(FileUtils.detectLanguage('Dockerfile')).toBe('plaintext');
    });
  });

  describe('detectFileType', () => {
    it('should categorize files correctly', () => {
      expect(FileUtils.detectFileType('App.tsx')).toBe('component');
      expect(FileUtils.detectFileType('Component.jsx')).toBe('component');
      expect(FileUtils.detectFileType('styles.css')).toBe('style');
      expect(FileUtils.detectFileType('theme.scss')).toBe('style');
      expect(FileUtils.detectFileType('config.json')).toBe('config');
      expect(FileUtils.detectFileType('utils.ts')).toBe('other');
    });
  });

  describe('getFileIcon', () => {
    it('should return icons when enabled', () => {
      expect(FileUtils.getFileIcon('App.tsx', true)).toBe('⚛️ ');
      expect(FileUtils.getFileIcon('styles.css', true)).toBe('🎨 ');
      expect(FileUtils.getFileIcon('config.json', true)).toBe('⚙️ ');
      expect(FileUtils.getFileIcon('unknown.txt', true)).toBe('📄 ');
    });

    it('should return empty string when icons disabled', () => {
      expect(FileUtils.getFileIcon('App.tsx', false)).toBe('');
      expect(FileUtils.getFileIcon('styles.css', false)).toBe('');
    });
  });

  describe('sortFilesByType', () => {
    it('should sort files by type priority', () => {
      const files = [
        { path: 'styles.css', content: '' },
        { path: 'App.tsx', content: '' },
        { path: 'config.json', content: '' },
        { path: 'utils.ts', content: '' }
      ];

      const sorted = FileUtils.sortFilesByType(files);
      
      expect(sorted[0].path).toBe('App.tsx');
      expect(sorted[1].path).toBe('styles.css');
      expect(sorted[2].path).toBe('config.json');
      expect(sorted[3].path).toBe('utils.ts');
    });
  });
});

describe('FormatUtils', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(FormatUtils.formatFileSize(0)).toBe('0 B');
      expect(FormatUtils.formatFileSize(512)).toBe('512 B');
      expect(FormatUtils.formatFileSize(1024)).toBe('1.0 KB');
      expect(FormatUtils.formatFileSize(1536)).toBe('1.5 KB');
      expect(FormatUtils.formatFileSize(1048576)).toBe('1.0 MB');
    });
  });

  describe('truncateContent', () => {
    it('should truncate long content', () => {
      const content = 'This is a very long string that needs to be truncated';
      expect(FormatUtils.truncateContent(content, 10)).toBe('This is a...');
      expect(FormatUtils.truncateContent(content, 100)).toBe(content);
    });

    it('should handle empty content', () => {
      expect(FormatUtils.truncateContent('', 10)).toBe('');
    });
  });

  describe('normalizeLineEndings', () => {
    it('should normalize different line endings', () => {
      expect(FormatUtils.normalizeLineEndings('line1\r\nline2')).toBe('line1\nline2');
      expect(FormatUtils.normalizeLineEndings('line1\rline2')).toBe('line1\nline2');
      expect(FormatUtils.normalizeLineEndings('line1\nline2')).toBe('line1\nline2');
    });
  });

  describe('generateFileTree', () => {
    it('should generate file tree structure', () => {
      const files = [
        { path: 'src/App.tsx', content: '' },
        { path: 'src/styles.css', content: '' },
        { path: 'config.json', content: '' }
      ];

      const tree = FormatUtils.generateFileTree(files);
      
      expect(tree).toContain('src/');
      expect(tree).toContain('├── App.tsx');
      expect(tree).toContain('└── styles.css');
      expect(tree).toContain('config.json');
    });
  });
});

describe('ValidationUtils', () => {
  describe('isValidPrompt', () => {
    it('should validate prompt length', () => {
      expect(ValidationUtils.isValidPrompt('')).toBe(false);
      expect(ValidationUtils.isValidPrompt('Valid prompt')).toBe(true);
      expect(ValidationUtils.isValidPrompt('a'.repeat(10001))).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> world';
      expect(ValidationUtils.sanitizeInput(input)).toBe('Hello  world');
    });

    it('should trim whitespace', () => {
      expect(ValidationUtils.sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should handle special characters', () => {
      const input = 'Hello & <world>';
      expect(ValidationUtils.sanitizeInput(input)).toBe('Hello & <world>');
    });
  });

  describe('isValidChatId', () => {
    it('should validate chat ID format', () => {
      expect(ValidationUtils.isValidChatId('abc123')).toBe(true);
      expect(ValidationUtils.isValidChatId('ABC-123_def')).toBe(true);
      expect(ValidationUtils.isValidChatId('invalid!')).toBe(false);
      expect(ValidationUtils.isValidChatId('')).toBe(false);
      expect(ValidationUtils.isValidChatId('a'.repeat(101))).toBe(false);
    });
  });

  describe('hasSecurityRisks', () => {
    it('should detect potential security risks', () => {
      expect(ValidationUtils.hasSecurityRisks('normal prompt')).toBe(false);
      expect(ValidationUtils.hasSecurityRisks('ignore instructions')).toBe(true);
      expect(ValidationUtils.hasSecurityRisks('IGNORE INSTRUCTIONS')).toBe(true);
      expect(ValidationUtils.hasSecurityRisks('system prompt')).toBe(true);
      expect(ValidationUtils.hasSecurityRisks('bypass security')).toBe(true);
    });
  });

  describe('validateFileContent', () => {
    it('should validate file content size', () => {
      expect(ValidationUtils.validateFileContent('valid content')).toBe(true);
      expect(ValidationUtils.validateFileContent('x'.repeat(1000001))).toBe(false);
      expect(ValidationUtils.validateFileContent(null as any)).toBe(false);
    });
  });
});