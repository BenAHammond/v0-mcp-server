import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Key, Download, Settings, Terminal } from "lucide-react"

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Getting Started
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Set up the v0 MCP Server and start generating React components in minutes
          </p>
        </div>
      </section>

      {/* Prerequisites */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Prerequisites</h2>
          <div className="grid gap-4 md:grid-cols-2">
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
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Start</h2>
          
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Get your v0 API Key
                </h3>
                <p className="text-gray-600 mb-4">
                  Visit v0.dev settings to generate your API key
                </p>
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <code className="text-sm text-gray-300">
                    https://v0.dev/chat/settings/keys
                  </code>
                </div>
                <p className="text-sm text-gray-500">
                  Your API key will look like: <code className="bg-gray-100 px-2 py-1 rounded">v1:xxxxx:xxxxx</code>
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Run the Server
                </h3>
                <p className="text-gray-600 mb-4">
                  No installation needed! Run directly with npx:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <code className="text-sm text-gray-300">
                    npx v0-mcp-server --api-key YOUR_API_KEY
                  </code>
                </div>
                <p className="text-sm text-gray-500">
                  Or set the API key as an environment variable:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 mt-2">
                  <code className="text-sm text-gray-300">
                    export V0_API_KEY="YOUR_API_KEY"<br />
                    npx v0-mcp-server
                  </code>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configure Claude Desktop
                </h3>
                <p className="text-gray-600 mb-4">
                  Add the server to your Claude Desktop configuration file:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300 whitespace-pre">{`{
  "mcpServers": {
    "v0-mcp-server": {
      "command": "npx",
      "args": ["v0-mcp-server"],
      "env": {
        "V0_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}`}</code>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Configuration file location:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• macOS: <code className="bg-gray-100 px-2 py-1 rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
                  <li>• Windows: <code className="bg-gray-100 px-2 py-1 rounded">%APPDATA%\\Claude\\claude_desktop_config.json</code></li>
                </ul>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Start Creating Components
                </h3>
                <p className="text-gray-600 mb-4">
                  Restart Claude Desktop and start generating components!
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">Example prompts:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
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
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Alternative Installation</h2>
          <Card>
            <CardHeader>
              <CardTitle>Install from GitHub</CardTitle>
              <CardDescription>Clone and run the server locally for development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                <code className="text-sm text-gray-300 block">git clone https://github.com/BenAHammond/v0-mcp-server.git</code>
                <code className="text-sm text-gray-300 block">cd v0-mcp-server</code>
                <code className="text-sm text-gray-300 block">npm install</code>
                <code className="text-sm text-gray-300 block">npm run build</code>
                <code className="text-sm text-gray-300 block">V0_API_KEY=your_key node dist/index.js</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Next Steps</h2>
          <div className="grid gap-4 md:grid-cols-2">
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