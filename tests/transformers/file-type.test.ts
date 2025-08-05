/**
 * File Type Detection Tests
 */

import { describe, expect, test } from '@jest/globals';
import {
  detectFileType,
  FileType,
  getExtensionsForType,
  isFileType,
  getFileTypes,
  groupByFileType,
  sortByFileType,
  getFileTypeMetadata
} from '../../src/transformers/file-type';

describe('detectFileType', () => {
  describe('component files', () => {
    test('detects React components', () => {
      expect(detectFileType('App.tsx')).toBe(FileType.COMPONENT);
      expect(detectFileType('Button.jsx')).toBe(FileType.COMPONENT);
      expect(detectFileType('components/Header.tsx')).toBe(FileType.COMPONENT);
    });

    test('detects Vue components', () => {
      expect(detectFileType('App.vue')).toBe(FileType.COMPONENT);
      expect(detectFileType('components/Button.vue')).toBe(FileType.COMPONENT);
    });

    test('detects Svelte components', () => {
      expect(detectFileType('App.svelte')).toBe(FileType.COMPONENT);
    });
  });

  describe('TypeScript files', () => {
    test('detects TypeScript files', () => {
      expect(detectFileType('index.ts')).toBe(FileType.TYPESCRIPT);
      expect(detectFileType('utils.ts')).toBe(FileType.TYPESCRIPT);
      expect(detectFileType('types.d.ts')).toBe(FileType.TYPESCRIPT);
    });

    test('detects module TypeScript files', () => {
      expect(detectFileType('index.mts')).toBe(FileType.TYPESCRIPT);
      expect(detectFileType('index.cts')).toBe(FileType.TYPESCRIPT);
    });
  });

  describe('JavaScript files', () => {
    test('detects JavaScript files', () => {
      expect(detectFileType('script.js')).toBe(FileType.JAVASCRIPT);
      expect(detectFileType('index.mjs')).toBe(FileType.JAVASCRIPT);
      expect(detectFileType('common.cjs')).toBe(FileType.JAVASCRIPT);
      expect(detectFileType('main.es6')).toBe(FileType.JAVASCRIPT);
    });
  });

  describe('style files', () => {
    test('detects CSS and preprocessor files', () => {
      expect(detectFileType('styles.css')).toBe(FileType.STYLE);
      expect(detectFileType('main.scss')).toBe(FileType.STYLE);
      expect(detectFileType('variables.sass')).toBe(FileType.STYLE);
      expect(detectFileType('theme.less')).toBe(FileType.STYLE);
      expect(detectFileType('app.styl')).toBe(FileType.STYLE);
      expect(detectFileType('global.pcss')).toBe(FileType.STYLE);
    });
  });

  describe('config files', () => {
    test('detects JSON config files', () => {
      expect(detectFileType('package.json')).toBe(FileType.CONFIG);
      expect(detectFileType('tsconfig.json')).toBe(FileType.CONFIG);
      expect(detectFileType('settings.json')).toBe(FileType.CONFIG);
    });

    test('detects YAML config files', () => {
      expect(detectFileType('config.yaml')).toBe(FileType.CONFIG);
      expect(detectFileType('application.yml')).toBe(FileType.CONFIG);
    });

    test('detects environment files', () => {
      expect(detectFileType('.env')).toBe(FileType.CONFIG);
      expect(detectFileType('.env.local')).toBe(FileType.CONFIG);
      expect(detectFileType('.env.production')).toBe(FileType.CONFIG);
    });

    test('detects special config files', () => {
      expect(detectFileType('.eslintrc')).toBe(FileType.CONFIG);
      expect(detectFileType('.prettierrc')).toBe(FileType.CONFIG);
      expect(detectFileType('webpack.config.js')).toBe(FileType.CONFIG);
      expect(detectFileType('vite.config.ts')).toBe(FileType.CONFIG);
    });
  });

  describe('documentation files', () => {
    test('detects markdown files', () => {
      expect(detectFileType('README.md')).toBe(FileType.DOCUMENTATION);
      expect(detectFileType('CHANGELOG.md')).toBe(FileType.DOCUMENTATION);
      expect(detectFileType('docs.mdx')).toBe(FileType.DOCUMENTATION);
    });

    test('detects text files', () => {
      expect(detectFileType('notes.txt')).toBe(FileType.DOCUMENTATION);
      expect(detectFileType('LICENSE')).toBe(FileType.DOCUMENTATION);
    });
  });

  describe('test files', () => {
    test('detects test files by pattern', () => {
      expect(detectFileType('app.test.ts')).toBe(FileType.TEST);
      expect(detectFileType('utils.spec.js')).toBe(FileType.TEST);
      expect(detectFileType('component.test.tsx')).toBe(FileType.TEST);
      expect(detectFileType('__tests__/helper.ts')).toBe(FileType.TEST);
    });
  });

  describe('asset files', () => {
    test('detects image files', () => {
      expect(detectFileType('logo.png')).toBe(FileType.ASSET);
      expect(detectFileType('photo.jpg')).toBe(FileType.ASSET);
      expect(detectFileType('icon.svg')).toBe(FileType.ASSET);
      expect(detectFileType('banner.webp')).toBe(FileType.ASSET);
    });

    test('detects font files', () => {
      expect(detectFileType('font.woff')).toBe(FileType.ASSET);
      expect(detectFileType('font.woff2')).toBe(FileType.ASSET);
      expect(detectFileType('font.ttf')).toBe(FileType.ASSET);
    });
  });

  describe('edge cases', () => {
    test('handles empty filename', () => {
      expect(detectFileType('')).toBe(FileType.TEXT);
    });

    test('handles null/undefined', () => {
      expect(detectFileType(null as any)).toBe(FileType.TEXT);
      expect(detectFileType(undefined as any)).toBe(FileType.TEXT);
    });

    test('handles files without extension', () => {
      expect(detectFileType('Makefile')).toBe(FileType.SCRIPT);
      expect(detectFileType('Dockerfile')).toBe(FileType.SCRIPT);
      expect(detectFileType('somefile')).toBe(FileType.TEXT);
    });

    test('handles compound extensions', () => {
      expect(detectFileType('app.test.ts')).toBe(FileType.TEST);
      expect(detectFileType('styles.module.css')).toBe(FileType.STYLE);
    });
  });
});

describe('getExtensionsForType', () => {
  test('returns extensions for component type', () => {
    const extensions = getExtensionsForType(FileType.COMPONENT);
    expect(extensions).toContain('tsx');
    expect(extensions).toContain('jsx');
    expect(extensions).toContain('vue');
    expect(extensions).toContain('svelte');
  });

  test('returns extensions for style type', () => {
    const extensions = getExtensionsForType(FileType.STYLE);
    expect(extensions).toContain('css');
    expect(extensions).toContain('scss');
    expect(extensions).toContain('less');
  });

  test('returns empty array for unknown type', () => {
    const extensions = getExtensionsForType('unknown' as FileType);
    expect(extensions).toEqual([]);
  });
});

describe('isFileType', () => {
  test('correctly identifies file types', () => {
    expect(isFileType('App.tsx', FileType.COMPONENT)).toBe(true);
    expect(isFileType('App.tsx', FileType.STYLE)).toBe(false);
    expect(isFileType('styles.css', FileType.STYLE)).toBe(true);
    expect(isFileType('config.json', FileType.CONFIG)).toBe(true);
  });
});

describe('getFileTypes', () => {
  test('returns unique file types from array', () => {
    const files = ['App.tsx', 'styles.css', 'Button.tsx', 'theme.scss', 'config.json'];
    const types = getFileTypes(files);
    expect(types).toContain(FileType.COMPONENT);
    expect(types).toContain(FileType.STYLE);
    expect(types).toContain(FileType.CONFIG);
    expect(types).toHaveLength(3);
  });

  test('handles empty array', () => {
    expect(getFileTypes([])).toEqual([]);
  });
});

describe('groupByFileType', () => {
  test('groups files by type correctly', () => {
    const files = [
      'App.tsx',
      'Button.tsx',
      'styles.css',
      'theme.scss',
      'config.json',
      'utils.ts'
    ];
    const groups = groupByFileType(files);
    
    expect(groups[FileType.COMPONENT]).toEqual(['App.tsx', 'Button.tsx']);
    expect(groups[FileType.STYLE]).toEqual(['styles.css', 'theme.scss']);
    expect(groups[FileType.CONFIG]).toEqual(['config.json']);
    expect(groups[FileType.TYPESCRIPT]).toEqual(['utils.ts']);
  });
});

describe('sortByFileType', () => {
  test('sorts files by type priority', () => {
    const files = [
      'config.json',
      'App.tsx',
      'styles.css',
      'utils.ts',
      'README.md'
    ];
    const sorted = sortByFileType(files);
    
    expect(sorted[0]).toBe('App.tsx'); // Component first
    expect(sorted[1]).toBe('utils.ts'); // TypeScript second
    expect(sorted[2]).toBe('styles.css'); // Styles third
    expect(sorted[3]).toBe('config.json'); // Config fourth
    expect(sorted[4]).toBe('README.md'); // Documentation fifth
  });

  test('sorts alphabetically within same type', () => {
    const files = ['Button.tsx', 'App.tsx', 'Header.tsx'];
    const sorted = sortByFileType(files);
    
    expect(sorted).toEqual(['App.tsx', 'Button.tsx', 'Header.tsx']);
  });
});

describe('getFileTypeMetadata', () => {
  test('returns correct metadata for component type', () => {
    const metadata = getFileTypeMetadata(FileType.COMPONENT);
    expect(metadata.type).toBe(FileType.COMPONENT);
    expect(metadata.displayName).toBe('Component');
    expect(metadata.icon).toBe('⚛️');
    expect(metadata.color).toBe('#61DAFB');
  });

  test('returns correct metadata for style type', () => {
    const metadata = getFileTypeMetadata(FileType.STYLE);
    expect(metadata.type).toBe(FileType.STYLE);
    expect(metadata.displayName).toBe('Stylesheet');
    expect(metadata.icon).toBe('🎨');
  });

  test('returns default metadata for unknown type', () => {
    const metadata = getFileTypeMetadata('unknown' as FileType);
    expect(metadata.type).toBe(FileType.TEXT);
    expect(metadata.displayName).toBe('Text');
  });
});

describe('memoization', () => {
  test('caches results for same input', () => {
    // Call multiple times with same input
    const result1 = detectFileType('test.tsx');
    const result2 = detectFileType('test.tsx');
    const result3 = detectFileType('test.tsx');
    
    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
    expect(result1).toBe(FileType.COMPONENT);
  });

  test('returns different results for different inputs', () => {
    const result1 = detectFileType('test.tsx');
    const result2 = detectFileType('test.css');
    
    expect(result1).not.toBe(result2);
    expect(result1).toBe(FileType.COMPONENT);
    expect(result2).toBe(FileType.STYLE);
  });
});