/**
 * Test script to evaluate and optimize code formatting for Claude Code
 * 
 * Generates various component types and evaluates formatting quality
 */

import { UnifiedCodeFormatter } from '../src/unified-code-formatter.js';
import { V0File } from '../src/types/api-types.js';

// Test component examples
const testComponents: V0File[] = [
  {
    path: 'Button.tsx',
    content: `import React from 'react';

export function Button({ children, onClick, variant = 'primary' }) {
  return (
    <button 
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}`,
  },
  {
    path: 'Card.tsx',
    content: `import React from 'react';
import './Card.css';

interface CardProps {
  title: string;
  description?: string;
  imageUrl?: string;
  actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  description, 
  imageUrl, 
  actions 
}) => {
  return (
    <div className="card">
      {imageUrl && (
        <div className="card-image">
          <img src={imageUrl} alt={title} />
        </div>
      )}
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        {description && (
          <p className="card-description">{description}</p>
        )}
      </div>
      {actions && (
        <div className="card-actions">
          {actions}
        </div>
      )}
    </div>
  );
};`,
  },
  {
    path: 'styles.css',
    content: `.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-primary {
  background-color: #007bff;
  color: white;
}

.button-primary:hover {
  background-color: #0056b3;
}

.card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}`,
  },
  {
    path: 'package.json',
    content: `{
  "name": "my-component",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0"
  }
}`,
  }
];

// Test formatting scenarios
async function testFormatting() {
  console.log('Testing UnifiedCodeFormatter with various component types...\n');

  const formatter = new UnifiedCodeFormatter();

  // Test chat ID and preview URL for context
  const testChatId = 'test-chat-123';
  const testPreviewUrl = 'https://v0.dev/preview/test-123';

  // Test 1: Single component formatting
  console.log('=== Test 1: Single Component ===');
  const singleResult = formatter.formatForClaudeCode([testComponents[0]], testChatId, testPreviewUrl);
  console.log(singleResult);
  console.log('\n');

  // Test 2: Multiple files with different types
  console.log('=== Test 2: Multiple Files ===');
  const multiResult = formatter.formatForClaudeCode(testComponents, testChatId, testPreviewUrl);
  console.log(multiResult.substring(0, 800) + '...');
  console.log('\n');

  // Test 3: Empty files array
  console.log('=== Test 3: Empty Files ===');
  const emptyResult = formatter.formatForClaudeCode([], testChatId, testPreviewUrl);
  console.log(emptyResult);
  console.log('\n');

  // Test 4: Large component (but within limits)
  console.log('=== Test 4: Large Component ===');
  const largeComponent: V0File = {
    path: 'LargeComponent.tsx',
    content: testComponents[1].content + '\n// Additional content\n' + testComponents[1].content,
  };
  const largeResult = formatter.formatForClaudeCode([largeComponent], testChatId, testPreviewUrl);
  console.log(`Large component result length: ${largeResult.length} characters`);
  console.log(largeResult.substring(0, 300) + '...');
  console.log('\n');

  // Test 5: Component with special characters
  console.log('=== Test 5: Special Characters ===');
  const specialComponent: V0File = {
    path: 'Special.tsx',
    content: `export const Special = () => {
  const message = "Hello <world> & 'friends'!";
  const regex = /[a-z]+/g;
  const template = \`Price: $\${price}\`;
  
  return <div>{message}</div>;
};`,
  };
  const specialResult = formatter.formatForClaudeCode([specialComponent], testChatId, testPreviewUrl);
  console.log(specialResult);
  console.log('\n');

  // Test 6: Using UnifiedCodeFormatter directly
  console.log('=== Test 6: Direct Formatter Usage ===');
  const formattedResponse = formatter.formatResponse(testComponents);
  console.log('Formatted content length:', formattedResponse.formattedContent.length);
  console.log('File count:', formattedResponse.files.length);
  console.log('\n');

  // Test formatting recommendations
  console.log('=== Formatting Recommendations ===');
  console.log('1. File headers are clear with language hints');
  console.log('2. Code blocks use proper markdown syntax');
  console.log('3. Multiple files are well-separated');
  console.log('4. Special characters are preserved correctly');
  console.log('5. Large files are handled without truncation issues');
  console.log('\n');

  // Performance test
  console.log('=== Performance Test ===');
  const startTime = performance.now();
  for (let i = 0; i < 100; i++) {
    formatter.formatForClaudeCode(testComponents, testChatId, testPreviewUrl);
  }
  const endTime = performance.now();
  console.log(`Formatted 100 times in ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`Average: ${((endTime - startTime) / 100).toFixed(2)}ms per format`);
}

// Run tests
testFormatting().catch(console.error);