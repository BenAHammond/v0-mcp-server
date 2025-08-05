/**
 * Language Detection Transformer Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  detectLanguage,
  detectLanguageMemoized,
  getLanguageId,
  getLanguageDisplayName,
  supportsHighlighting,
  getLanguageColor,
  getLanguageGroup,
  isFrameworkFile,
  getParentLanguage,
  getSupportedExtensions,
  getSupportedLanguages,
  getLanguagesByGroup,
  searchLanguages,
  isWebFile,
  isBackendFile,
  isConfigFile,
  getLanguageStats,
  LanguageGroup,
  LanguageMetadata
} from '../../src/transformers/language.js';

describe('Language Detection', () => {
  beforeEach(() => {
    // Clear memoization cache between tests
    detectLanguageMemoized.clear();
  });

  describe('detectLanguage', () => {
    it('should detect JavaScript files', () => {
      const result = detectLanguage('app.js');
      expect(result).toMatchObject({
        id: 'javascript',
        displayName: 'JavaScript',
        group: LanguageGroup.WEB,
        supportsHighlighting: true
      });
    });

    it('should detect TypeScript files', () => {
      const result = detectLanguage('app.ts');
      expect(result).toMatchObject({
        id: 'typescript',
        displayName: 'TypeScript',
        group: LanguageGroup.WEB,
        supportsHighlighting: true
      });
    });

    it('should detect React files', () => {
      const jsxResult = detectLanguage('Component.jsx');
      expect(jsxResult).toMatchObject({
        id: 'javascript',
        displayName: 'JavaScript (JSX)',
        isFramework: true,
        parentLanguage: 'javascript'
      });

      const tsxResult = detectLanguage('Component.tsx');
      expect(tsxResult).toMatchObject({
        id: 'typescript',
        displayName: 'TypeScript (TSX)',
        isFramework: true,
        parentLanguage: 'typescript'
      });
    });

    it('should detect style files', () => {
      expect(detectLanguage('styles.css')?.id).toBe('css');
      expect(detectLanguage('styles.scss')?.id).toBe('scss');
      expect(detectLanguage('styles.sass')?.id).toBe('sass');
      expect(detectLanguage('styles.less')?.id).toBe('less');
    });

    it('should detect backend languages', () => {
      expect(detectLanguage('app.py')?.id).toBe('python');
      expect(detectLanguage('Main.java')?.id).toBe('java');
      expect(detectLanguage('server.go')?.id).toBe('go');
      expect(detectLanguage('lib.rs')?.id).toBe('rust');
      expect(detectLanguage('app.rb')?.id).toBe('ruby');
      expect(detectLanguage('index.php')?.id).toBe('php');
    });

    it('should detect configuration files', () => {
      expect(detectLanguage('config.json')?.id).toBe('json');
      expect(detectLanguage('config.yaml')?.id).toBe('yaml');
      expect(detectLanguage('config.yml')?.id).toBe('yaml');
      expect(detectLanguage('config.toml')?.id).toBe('toml');
      expect(detectLanguage('.env')?.id).toBe('bash');
    });

    it('should detect special file names', () => {
      expect(detectLanguage('Dockerfile')?.id).toBe('dockerfile');
      expect(detectLanguage('Makefile')?.id).toBe('makefile');
      expect(detectLanguage('package.json')?.id).toBe('json');
      expect(detectLanguage('tsconfig.json')?.id).toBe('jsonc');
      expect(detectLanguage('.gitignore')?.id).toBe('bash');
    });

    it('should handle files with paths', () => {
      expect(detectLanguage('/src/components/Button.tsx')?.id).toBe('typescript');
      expect(detectLanguage('C:\\Users\\project\\app.py')?.id).toBe('python');
    });

    it('should handle compound extensions', () => {
      expect(detectLanguage('types.d.ts')?.id).toBe('typescript');
      expect(detectLanguage('app.test.ts')?.id).toBe('typescript');
      expect(detectLanguage('app.spec.js')?.id).toBe('javascript');
    });

    it('should return null for unknown extensions', () => {
      expect(detectLanguage('file.unknown')).toBeNull();
      expect(detectLanguage('noextension')).toBeNull();
    });

    it('should be case-insensitive', () => {
      expect(detectLanguage('APP.JS')?.id).toBe('javascript');
      expect(detectLanguage('STYLES.CSS')?.id).toBe('css');
      expect(detectLanguage('DOCKERFILE')?.id).toBe('dockerfile');
    });
  });

  describe('getLanguageId', () => {
    it('should return language ID for known files', () => {
      expect(getLanguageId('app.js')).toBe('javascript');
      expect(getLanguageId('app.ts')).toBe('typescript');
      expect(getLanguageId('styles.css')).toBe('css');
    });

    it('should return "text" for unknown files', () => {
      expect(getLanguageId('unknown.xyz')).toBe('text');
      expect(getLanguageId('')).toBe('text');
    });
  });

  describe('getLanguageDisplayName', () => {
    it('should return display names', () => {
      expect(getLanguageDisplayName('app.js')).toBe('JavaScript');
      expect(getLanguageDisplayName('Component.tsx')).toBe('TypeScript (TSX)');
      expect(getLanguageDisplayName('app.py')).toBe('Python');
    });

    it('should return "Plain Text" for unknown files', () => {
      expect(getLanguageDisplayName('unknown.xyz')).toBe('Plain Text');
    });
  });

  describe('supportsHighlighting', () => {
    it('should return true for supported languages', () => {
      expect(supportsHighlighting('app.js')).toBe(true);
      expect(supportsHighlighting('styles.css')).toBe(true);
      expect(supportsHighlighting('app.py')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(supportsHighlighting('file.txt')).toBe(false);
      expect(supportsHighlighting('unknown.xyz')).toBe(false);
    });
  });

  describe('getLanguageColor', () => {
    it('should return GitHub-style colors', () => {
      expect(getLanguageColor('app.js')).toBe('#f1e05a');
      expect(getLanguageColor('app.ts')).toBe('#2b7489');
      expect(getLanguageColor('app.py')).toBe('#3572A5');
    });

    it('should return null for unknown languages', () => {
      expect(getLanguageColor('unknown.xyz')).toBeNull();
    });
  });

  describe('getLanguageGroup', () => {
    it('should categorize languages correctly', () => {
      expect(getLanguageGroup('app.js')).toBe(LanguageGroup.WEB);
      expect(getLanguageGroup('app.py')).toBe(LanguageGroup.BACKEND);
      expect(getLanguageGroup('styles.css')).toBe(LanguageGroup.STYLE);
      expect(getLanguageGroup('config.json')).toBe(LanguageGroup.CONFIG);
      expect(getLanguageGroup('README.md')).toBe(LanguageGroup.DOCUMENTATION);
    });
  });

  describe('Framework detection', () => {
    it('should identify framework files', () => {
      expect(isFrameworkFile('Component.jsx')).toBe(true);
      expect(isFrameworkFile('Component.tsx')).toBe(true);
      expect(isFrameworkFile('App.vue')).toBe(true);
      expect(isFrameworkFile('App.svelte')).toBe(true);
      expect(isFrameworkFile('app.js')).toBe(false);
    });

    it('should get parent language for framework files', () => {
      expect(getParentLanguage('Component.jsx')).toBe('javascript');
      expect(getParentLanguage('Component.tsx')).toBe('typescript');
      expect(getParentLanguage('App.vue')).toBe('javascript');
      expect(getParentLanguage('app.js')).toBeNull();
    });
  });

  describe('Language queries', () => {
    it('should get supported extensions', () => {
      const extensions = getSupportedExtensions();
      expect(extensions).toContain('js');
      expect(extensions).toContain('ts');
      expect(extensions).toContain('py');
      expect(extensions.length).toBeGreaterThan(50);
    });

    it('should get supported languages', () => {
      const languages = getSupportedLanguages();
      expect(languages).toContain('javascript');
      expect(languages).toContain('typescript');
      expect(languages).toContain('python');
      expect(languages.length).toBeGreaterThan(30);
    });

    it('should get languages by group', () => {
      const webLanguages = getLanguagesByGroup(LanguageGroup.WEB);
      expect(webLanguages.some(l => l.id === 'javascript')).toBe(true);
      expect(webLanguages.some(l => l.id === 'typescript')).toBe(true);

      const backendLanguages = getLanguagesByGroup(LanguageGroup.BACKEND);
      expect(backendLanguages.some(l => l.id === 'python')).toBe(true);
      expect(backendLanguages.some(l => l.id === 'java')).toBe(true);
    });

    it('should search languages', () => {
      const jsResults = searchLanguages('java');
      expect(jsResults.some(l => l.id === 'javascript')).toBe(true);
      expect(jsResults.some(l => l.id === 'java')).toBe(true);

      const typeResults = searchLanguages('type');
      expect(typeResults.some(l => l.id === 'typescript')).toBe(true);

      const pythonResults = searchLanguages('python');
      expect(pythonResults.some(l => l.id === 'python')).toBe(true);
    });
  });

  describe('File type helpers', () => {
    it('should identify web files', () => {
      expect(isWebFile('app.js')).toBe(true);
      expect(isWebFile('Component.tsx')).toBe(true);
      expect(isWebFile('styles.css')).toBe(true);
      expect(isWebFile('index.html')).toBe(true);
      expect(isWebFile('app.py')).toBe(false);
    });

    it('should identify backend files', () => {
      expect(isBackendFile('app.py')).toBe(true);
      expect(isBackendFile('Main.java')).toBe(true);
      expect(isBackendFile('server.go')).toBe(true);
      expect(isBackendFile('app.js')).toBe(false);
    });

    it('should identify config files', () => {
      expect(isConfigFile('config.json')).toBe(true);
      expect(isConfigFile('.env')).toBe(true);
      expect(isConfigFile('docker-compose.yml')).toBe(true);
      expect(isConfigFile('app.js')).toBe(false);
    });
  });

  describe('getLanguageStats', () => {
    it('should calculate language statistics', () => {
      const files = [
        'app.js',
        'utils.js',
        'Component.tsx',
        'types.ts',
        'styles.css',
        'config.json',
        'server.py'
      ];

      const stats = getLanguageStats(files);
      
      expect(stats.totalFiles).toBe(7);
      expect(stats.languageCounts.javascript).toBe(2);
      expect(stats.languageCounts.typescript).toBe(2);
      expect(stats.languageCounts.css).toBe(1);
      expect(stats.languageCounts.json).toBe(1);
      expect(stats.languageCounts.python).toBe(1);
      
      expect(stats.groupCounts[LanguageGroup.WEB]).toBe(4);
      expect(stats.groupCounts[LanguageGroup.STYLE]).toBe(1);
      expect(stats.groupCounts[LanguageGroup.CONFIG]).toBe(1);
      expect(stats.groupCounts[LanguageGroup.BACKEND]).toBe(1);
      
      expect(stats.predominantLanguage).toBe('javascript');
      expect(stats.predominantGroup).toBe(LanguageGroup.WEB);
    });

    it('should handle empty file list', () => {
      const stats = getLanguageStats([]);
      expect(stats.totalFiles).toBe(0);
      expect(stats.languageCounts).toEqual({});
      expect(stats.groupCounts).toEqual({});
      expect(stats.predominantLanguage).toBeNull();
      expect(stats.predominantGroup).toBeNull();
    });
  });

  describe('Memoization', () => {
    it('should cache results', () => {
      const filename = 'test.js';
      
      // First call
      const result1 = detectLanguageMemoized(filename);
      
      // Second call should return cached result
      const result2 = detectLanguageMemoized(filename);
      
      expect(result1).toBe(result2);
      expect(detectLanguageMemoized.size()).toBeGreaterThan(0);
    });

    it('should clear cache', () => {
      detectLanguageMemoized('test.js');
      expect(detectLanguageMemoized.size()).toBeGreaterThan(0);
      
      detectLanguageMemoized.clear();
      expect(detectLanguageMemoized.size()).toBe(0);
    });
  });
});

describe('Edge Cases', () => {
  it('should handle empty strings', () => {
    expect(detectLanguage('')).toBeNull();
    expect(getLanguageId('')).toBe('text');
    expect(getLanguageDisplayName('')).toBe('Plain Text');
  });

  it('should handle files with multiple dots', () => {
    expect(detectLanguage('app.test.spec.js')?.id).toBe('javascript');
    expect(detectLanguage('my.component.module.ts')?.id).toBe('typescript');
  });

  it('should handle hidden files', () => {
    expect(detectLanguage('.eslintrc')?.id).toBe('json');
    expect(detectLanguage('.babelrc')?.id).toBe('json');
    expect(detectLanguage('.env.local')?.id).toBe('bash');
  });

  it('should handle unusual casing in special files', () => {
    expect(detectLanguage('DOCKERFILE')?.id).toBe('dockerfile');
    expect(detectLanguage('MakeFile')?.id).toBe('makefile');
    expect(detectLanguage('Package.JSON')?.id).toBe('json');
  });
});