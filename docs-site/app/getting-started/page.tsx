import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CodeViewer, CodeBlock, InlineCode, CommandBlock } from "@/components/client/widgets/code-viewer"
import Link from "next/link"
import { ArrowRight, Key, Download, Settings, Terminal } from "lucide-react"

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Getting Started
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl">
            Set up the v0 MCP Server and start generating React components in minutes
          </p>
        </div>
      </section>

      {/* Prerequisites */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Prerequisites</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Claude Desktop</CardTitle>
                <CardDescription>The v0 MCP Server works with Claude Desktop app</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm">
                  <Link href="https://claude.ai/download" target="_blank" rel="noopener noreferrer">
                    Download Claude Desktop
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Node.js 18+</CardTitle>
                <CardDescription>Required to run the MCP server</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm">
                  <Link href="https://nodejs.org" target="_blank" rel="noopener noreferrer">
                    Install Node.js
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Start Steps */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Quick Start</h2>
          
          <div className="space-y-6 sm:space-y-8">
            {/* Step 1 */}
            <div className="flex gap-4 sm:gap-6">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4 sm:h-5 sm:w-5" />
                  Get your v0 API Key
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  Visit v0.dev settings to generate your API key
                </p>
                <CodeBlock className="mb-4">
                  https://v0.dev/chat/settings/keys
                </CodeBlock>
                <p className="text-sm text-gray-500">
                  Replace <InlineCode>YOUR_V0_API_KEY</InlineCode> with your actual API key
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 sm:gap-6">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2">
                  <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                  Install the Server
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  Choose your preferred installation method:
                </p>
                
                {/* Claude Code Method - Primary */}
                <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-3 sm:p-4 mb-4">
                  <p className="text-xs sm:text-sm font-semibold text-purple-900 mb-2">Recommended: Install with Claude Code</p>
                  <CodeBlock language="bash">
                    claude mcp add v0-server -e V0_API_KEY="your-key-here" -- npx v0-mcp-server
                  </CodeBlock>
                </div>

                {/* NPX Method */}
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Or run directly with npx:</p>
                <CodeBlock language="bash" className="mb-4">
                  V0_API_KEY="your-key-here" npx v0-mcp-server
                </CodeBlock>
                
                <p className="text-xs sm:text-sm text-gray-500">
                  Or set the API key as an environment variable:
                </p>
                <CommandBlock 
                  className="mt-2"
                  commands={[
                    'export V0_API_KEY="YOUR_V0_API_KEY"',
                    'npx v0-mcp-server'
                  ]}
                />
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 sm:gap-6">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  Configure Claude Desktop
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  Add the server to your Claude Desktop configuration file:
                </p>
                <CodeViewer 
                  language="json"
                  showLineNumbers={false}
                  code={`{
  "mcpServers": {
    "v0": {
      "command": "npx",
      "args": ["v0-mcp-server"],
      "env": {
        "V0_API_KEY": "your-api-key-here"
      }
    }
  }
}`}
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-4">
                  Configuration file location:
                </p>
                <ul className="text-xs sm:text-sm text-gray-600 mt-2 space-y-2">
                  <li className="break-words">• macOS: <InlineCode>~/Library/Application Support/Claude/claude_desktop_config.json</InlineCode></li>
                  <li className="break-words">• Windows: <InlineCode>%APPDATA%\Claude\claude_desktop_config.json</InlineCode></li>
                </ul>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 sm:gap-6">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                  4
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2">
                  <Terminal className="h-4 w-4 sm:h-5 sm:w-5" />
                  Start Creating Components
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  Restart Claude Desktop and start generating components!
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-blue-800 font-medium mb-2">Example prompts:</p>
                  <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
                    <li>• "Create a hero section with gradient background"</li>
                    <li>• "Build a pricing table with three tiers"</li>
                    <li>• "Design a contact form with validation"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative Installation */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Alternative Installation Methods</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Global Installation</CardTitle>
                <CardDescription>Install globally for use across projects</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock language="bash" className="mb-4">
                  npm install -g v0-mcp-server
                </CodeBlock>
                <p className="text-xs sm:text-sm text-gray-500">
                  Then use the same configuration JSON shown above
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Install from GitHub</CardTitle>
                <CardDescription>Clone and run the server locally for development</CardDescription>
              </CardHeader>
              <CardContent>
                <CommandBlock
                  commands={[
                    'git clone https://github.com/BenAHammond/v0-mcp-server.git',
                    'cd v0-mcp-server',
                    'npm install',
                    'npm run build',
                    'V0_API_KEY=your-api-key-here node dist/index.js'
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Next Steps</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Explore the API</CardTitle>
                <CardDescription>
                  Learn about all 39 auto-discovered tools available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/api-reference">
                    View API Reference
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Join the Community</CardTitle>
                <CardDescription>
                  Get help and share your creations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="https://github.com/BenAHammond/v0-mcp-server/discussions" target="_blank" rel="noopener noreferrer">
                    GitHub Discussions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}