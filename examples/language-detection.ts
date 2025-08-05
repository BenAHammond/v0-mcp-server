/**
 * Language Detection Examples
 * 
 * Demonstrates the usage of the language detection module
 */

import {
  detectLanguage,
  getLanguageId,
  getLanguageDisplayName,
  getLanguageColor,
  getLanguageGroup,
  isFrameworkFile,
  getLanguageStats,
  LanguageGroup
} from '../src/transformers/language.js';

console.log('=== Language Detection Examples ===\n');

// Example 1: Basic language detection
console.log('1. Basic Language Detection:');
const files = ['app.tsx', 'styles.scss', 'server.py', 'config.json'];
files.forEach(file => {
  const language = detectLanguage(file);
  console.log(`  ${file}:`);
  console.log(`    - ID: ${language?.id}`);
  console.log(`    - Display: ${language?.displayName}`);
  console.log(`    - Color: ${language?.color}`);
  console.log(`    - Group: ${language?.group}`);
});

// Example 2: Framework detection
console.log('\n2. Framework Detection:');
const frameworkFiles = ['Component.tsx', 'App.vue', 'Page.svelte', 'app.js'];
frameworkFiles.forEach(file => {
  console.log(`  ${file}: ${isFrameworkFile(file) ? 'Framework file' : 'Regular file'}`);
});

// Example 3: Language statistics for a project
console.log('\n3. Project Language Statistics:');
const projectFiles = [
  'src/App.tsx',
  'src/components/Button.tsx',
  'src/components/Card.tsx',
  'src/styles/main.scss',
  'src/styles/variables.scss',
  'src/utils/helpers.ts',
  'src/types/index.ts',
  'src/api/client.ts',
  'server/index.js',
  'server/routes.js',
  'config/webpack.config.js',
  'package.json',
  'tsconfig.json',
  '.env',
  'README.md'
];

const stats = getLanguageStats(projectFiles);
console.log('  Language Distribution:');
Object.entries(stats.languageCounts)
  .sort(([, a], [, b]) => b - a)
  .forEach(([lang, count]) => {
    const percentage = ((count / stats.totalFiles) * 100).toFixed(1);
    console.log(`    - ${lang}: ${count} files (${percentage}%)`);
  });

console.log('\n  Group Distribution:');
Object.entries(stats.groupCounts)
  .sort(([, a], [, b]) => b - a)
  .forEach(([group, count]) => {
    const percentage = ((count / stats.totalFiles) * 100).toFixed(1);
    console.log(`    - ${group}: ${count} files (${percentage}%)`);
  });

console.log(`\n  Predominant Language: ${stats.predominantLanguage}`);
console.log(`  Predominant Group: ${stats.predominantGroup}`);

// Example 4: Special file handling
console.log('\n4. Special File Handling:');
const specialFiles = [
  'Dockerfile',
  'Makefile',
  '.gitignore',
  'requirements.txt',
  'go.mod',
  'Cargo.toml'
];

specialFiles.forEach(file => {
  const id = getLanguageId(file);
  const name = getLanguageDisplayName(file);
  console.log(`  ${file}: ${name} (${id})`);
});

// Example 5: Color-coded file listing
console.log('\n5. Color-Coded File List:');
const mixedFiles = [
  'index.html',
  'app.js',
  'styles.css',
  'backend.py',
  'data.json',
  'script.sh'
];

mixedFiles.forEach(file => {
  const color = getLanguageColor(file) || '#000000';
  const name = getLanguageDisplayName(file);
  console.log(`  ${file}: ${name} (Color: ${color})`);
});

// Example 6: Group-based filtering
console.log('\n6. Files by Category:');
const allFiles = [
  'app.tsx', 'server.py', 'styles.css', 'index.html',
  'config.json', 'README.md', 'script.sh', 'Main.java'
];

const webFiles = allFiles.filter(file => {
  const group = getLanguageGroup(file);
  return group === LanguageGroup.WEB || 
         group === LanguageGroup.STYLE || 
         group === LanguageGroup.MARKUP;
});

const backendFiles = allFiles.filter(file => {
  return getLanguageGroup(file) === LanguageGroup.BACKEND;
});

console.log(`  Web files: ${webFiles.join(', ')}`);
console.log(`  Backend files: ${backendFiles.join(', ')}`);