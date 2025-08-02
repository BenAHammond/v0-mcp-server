#!/bin/bash
# complete-setup.sh - Complete initial setup for v0 MCP Server
# Run this script in an empty directory after creating your GitHub repository

set -e  # Exit on any error

PROJECT_NAME="v0-mcp-server"
DESCRIPTION="MCP Server for v0.dev component generation with Claude Code"

echo "🚀 Setting up $PROJECT_NAME project..."
echo ""

# Step 1: Initialize npm project
echo "📦 Initializing npm project..."
npm init -y

# Step 2: Update package.json metadata
echo "⚙️ Configuring package.json..."
npm pkg set name="$PROJECT_NAME"
npm pkg set description="$DESCRIPTION"
npm pkg set type="module"
npm pkg set main="./dist/index.js"
npm pkg set types="./dist/index.d.ts"
npm pkg set bin.v0-mcp="./dist/cli/index.js"
npm pkg set files[]="dist/**/*"
npm pkg set preferGlobal=true
npm pkg set engines.node=">=18.0.0"
npm pkg set license="MIT"
npm pkg set keywords[]="mcp"
npm pkg set keywords[]="v0"
npm pkg set keywords[]="claude-code"
npm pkg set keywords[]="ai"
npm pkg set keywords[]="react"
npm pkg set keywords[]="components"

# Step 3: Install dependencies
echo "📥 Installing dependencies..."
npm install @modelcontextprotocol/sdk v0-sdk commander chalk
npm install -D typescript tsx tsup @types/node rimraf

# Step 4: Create project structure
echo "📁 Creating project structure..."
mkdir -p src/cli
mkdir -p docs
mkdir -p tests
mkdir -p scripts

# Step 5: Create TypeScript configuration
echo "🔧 Creating TypeScript configuration..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "docs", "tests"]
}
EOF

# Step 6: Create build configuration
echo "⚡ Creating build configuration..."
cat > tsup.config.ts << 'EOF'
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
  esbuildOptions(options) {
    options.platform = 'node';
  },
});
EOF

# Step 7: Add npm scripts
echo "📝 Adding npm scripts..."
npm pkg set scripts.dev="tsx watch src/cli/index.ts"
npm pkg set scripts.build="tsup"
npm pkg set scripts.typecheck="tsc --noEmit"
npm pkg set scripts.mcp:test="npx @modelcontextprotocol/inspector dist/index.js"
npm pkg set scripts.test:cli="node dist/cli/index.js --validate"
npm pkg set scripts.prepublishOnly="npm run typecheck && npm run build"
npm pkg set scripts.release="npm run prepublishOnly && npm publish"
npm pkg set scripts.clean="rimraf dist"

# Step 8: Create basic README
echo "📖 Creating README..."
cat > README.md << 'EOF'
# v0 MCP Server

MCP Server for v0.dev component generation with Claude Code.

## Quick Start

```bash
# Install and run
npx v0-mcp-server --api-key your_v0_api_key

# Or set environment variable
export V0_API_KEY=your_key
npx v0-mcp-server
```

## Available Tools

- `generate_component` - Create new React components from descriptions
- `iterate_component` - Refine existing components

## Setup for Claude Code

```bash
# Add to Claude Code
claude mcp add v0 npx v0-mcp-server
```

Get your API key from: https://v0.dev/chat/settings/keys

## Development

```bash
npm install
npm run dev
```
EOF

# Step 9: Create .gitignore
echo "🚫 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*

# Build output
dist/
*.tsbuildinfo

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
EOF

# Step 10: Create placeholder source files
echo "📄 Creating source file placeholders..."
cat > src/index.ts << 'EOF'
// Main MCP server implementation
// TODO: Implement using the agentic LLM prompt

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

console.log('v0 MCP Server - Ready for implementation!');

export async function startServer() {
  // TODO: Implement server with generate_component and iterate_component tools
  console.log('Server starting...');
}
EOF

cat > src/cli/index.ts << 'EOF'
#!/usr/bin/env node
// CLI entry point
// TODO: Implement using the agentic LLM prompt

import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('v0-mcp')
  .description('v0.dev MCP Server for component generation')
  .version('1.0.0')
  .option('-k, --api-key <key>', 'v0.dev API key')
  .action(() => {
    console.log(chalk.green('v0 MCP CLI - Ready for implementation!'));
  });

program.parse();
EOF

# Step 11: Initialize git (if not already done)
if [ ! -d ".git" ]; then
    echo "🔧 Initializing git repository..."
    git init
fi

# Step 12: Create initial commit
echo "💾 Creating initial commit..."
git add .
git commit -m "Initial setup: v0 MCP Server project structure

- Setup npm package with proper configuration
- Added TypeScript and build configuration  
- Created project structure for MCP server
- Added development scripts and tooling
- Ready for implementation of v0 component generation tools"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📁 Project structure created:"
echo "  ├── src/index.ts (MCP server - ready for implementation)"
echo "  ├── src/cli/index.ts (CLI wrapper - ready for implementation)"
echo "  ├── tsconfig.json (TypeScript config)"
echo "  ├── tsup.config.ts (Build config)"
echo "  └── package.json (NPM config)"
echo ""
echo "🎯 Next steps:"
echo "  1. Use the agentic LLM prompt to implement src/index.ts"
echo "  2. Use the agentic LLM prompt to implement src/cli/index.ts"
echo "  3. Test with: npm run build && npm run mcp:test"
echo "  4. Publish with: npm run release"
echo ""
echo "🔑 Don't forget to get your v0 API key from:"
echo "    https://v0.dev/chat/settings/keys"
echo ""
echo "🚀 Ready to build the v0 MCP Server!"