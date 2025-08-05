/**
 * Example: Using the Chat Response Transformer
 * 
 * This example demonstrates how to use the chat response transformer
 * to handle v0.dev API responses in a type-safe way.
 */

import {
  transformResponse,
  toComponentResponse,
  extractMetadata,
  extractFileContent,
  hasValidComponentFiles,
  V0ChatData
} from '../src/transformers/chat-response.js';
import { isLeft, isRight } from '../src/types/either.js';

// Example 1: Transform a complete chat response
function transformCompleteResponse() {
  console.log('=== Example 1: Transform Complete Response ===\n');

  const rawResponse: V0ChatData = {
    id: 'chat-abc123',
    demo: 'https://v0.dev/demo/abc123',
    latestVersion: {
      files: [
        {
          name: 'Button.tsx',
          content: `import React from 'react';

export const Button: React.FC<{ label: string }> = ({ label }) => {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded">
      {label}
    </button>
  );
};`,
          object: 'file'
        },
        {
          name: 'Button.module.css',
          content: `.button {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.25rem;
}`
        }
      ]
    }
  };

  const result = transformResponse(rawResponse);

  if (isRight(result)) {
    console.log('✅ Transformation successful!');
    console.log('Chat ID:', result.right.chatId);
    console.log('Preview URL:', result.right.previewUrl);
    console.log('Files:', result.right.files.length);
    result.right.files.forEach(file => {
      console.log(`  - ${file.name} (${file.type}, ${file.language})`);
    });

    // Convert to ComponentResponse for MCP
    const componentResponse = toComponentResponse(result.right);
    console.log('\nComponent Response:');
    console.log('Message:', componentResponse.message);
    console.log('Formatted content preview:\n', 
      componentResponse.formattedContent?.substring(0, 200) + '...');
  } else {
    console.log('❌ Transformation failed:', result.left.message);
    console.log('Error code:', result.left.code);
  }

  console.log('\n');
}

// Example 2: Handle errors gracefully
function handleErrors() {
  console.log('=== Example 2: Error Handling ===\n');

  const invalidResponses = [
    { name: 'Missing ID', data: { files: [] } },
    { name: 'No files', data: { id: 'test-123' } },
    { name: 'Invalid file format', data: { 
      id: 'test-456',
      files: [{ invalid: 'structure' }]
    }},
    { name: 'Null data', data: null }
  ];

  invalidResponses.forEach(({ name, data }) => {
    const result = transformResponse(data);
    if (isLeft(result)) {
      console.log(`${name}: ${result.left.code} - ${result.left.message}`);
    }
  });

  console.log('\n');
}

// Example 3: Extract specific information
function extractInformation() {
  console.log('=== Example 3: Extract Specific Information ===\n');

  const chatData: V0ChatData = {
    id: 'chat-xyz789',
    previewUrl: 'https://v0.dev/preview/xyz789',
    latestVersion: {
      files: [
        {
          name: 'App.tsx',
          content: 'export default function App() { return <div>Hello</div> }'
        },
        {
          name: 'styles.css',
          content: 'body { margin: 0; }'
        }
      ]
    }
  };

  // Extract metadata
  const metadata = extractMetadata(chatData);
  console.log('Metadata:');
  console.log('  Has preview:', metadata.hasPreview);
  console.log('  File count:', metadata.fileCount);
  console.log('  Total size:', metadata.totalSize, 'bytes');
  console.log('  File types:', metadata.fileTypes);

  // Extract specific file content
  const appContent = extractFileContent(chatData, 'App.tsx');
  if (isRight(appContent)) {
    console.log('\nApp.tsx content:', appContent.right);
  }

  // Check for valid component files
  console.log('\nHas valid component files:', hasValidComponentFiles(chatData));

  console.log('\n');
}

// Example 4: Handle different response formats
function handleDifferentFormats() {
  console.log('=== Example 4: Different Response Formats ===\n');

  // Format 1: Root level files (older format)
  const rootLevelFormat: V0ChatData = {
    id: 'chat-old-format',
    webUrl: 'https://v0.dev/chat/old-format',
    files: [
      {
        source: 'const Component = () => <div>Old format</div>',
        lang: 'tsx',
        meta: {
          file: 'Component.tsx'
        }
      }
    ]
  };

  // Format 2: Latest version files (newer format)
  const latestVersionFormat: V0ChatData = {
    id: 'chat-new-format',
    demo: 'https://v0.dev/demo/new-format',
    latestVersion: {
      files: [
        {
          name: 'Component.tsx',
          content: 'const Component = () => <div>New format</div>'
        }
      ],
      demoUrl: 'https://v0.dev/demo/new-format-alt'
    }
  };

  [rootLevelFormat, latestVersionFormat].forEach((data, index) => {
    const result = transformResponse(data);
    if (isRight(result)) {
      console.log(`Format ${index + 1}: Successfully transformed`);
      console.log(`  Files: ${result.right.files.map(f => f.name).join(', ')}`);
    }
  });

  console.log('\n');
}

// Run all examples
function main() {
  console.log('Chat Response Transformer Examples\n');
  console.log('==================================\n');

  transformCompleteResponse();
  handleErrors();
  extractInformation();
  handleDifferentFormats();

  console.log('Examples completed! 🎉');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}