"use client"

import { ArrowRight, Github, Zap, Puzzle, RefreshCw, Shield, Download, Settings, Play, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-blue-400/10 to-cyan-400/10 animate-gradient-x"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                v0 MCP Server
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Generate React components with AI directly in Claude Desktop
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Link href="/getting-started">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="https://github.com/BenAHammond/v0-mcp-server" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What is v0? Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">What is v0?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              v0 is Vercel's AI-powered UI generation tool that creates React components from text descriptions. 
              With the v0 MCP Server, you can access v0's powerful component generation directly within Claude Desktop.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" size="lg">
                <Link href="https://v0.dev" target="_blank" rel="noopener noreferrer">
                  Visit v0.dev
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="https://v0.dev/docs" target="_blank" rel="noopener noreferrer">
                  v0 Documentation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>AI-Powered UI</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  v0 uses advanced AI models to understand your component requirements and generate production-ready React code
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Instant Previews</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  See live previews of your components on v0.dev and iterate with natural language to perfect your designs
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Modern Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Built for modern React with TypeScript, Tailwind CSS, and popular component libraries like shadcn/ui
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to generate and iterate on React components with AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle>AI-Powered Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate components from natural language descriptions using advanced AI models
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Puzzle className="h-6 w-6 text-white" />
                </div>
                <CardTitle>MCP Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Seamlessly works within Claude Desktop through the Model Context Protocol
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                  <RefreshCw className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Iterate & Refine</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Modify and improve components with follow-up prompts and iterations</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle>TypeScript Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Full type safety out of the box with TypeScript support and proper typing
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Quick Start</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get up and running in seconds with these simple commands
            </p>
          </div>

          {/* Installation Method Cards - Stack vertically on mobile, horizontal on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Claude Code Installation (Most Prominent) */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Claude Code (Recommended)</CardTitle>
                <CardDescription className="text-base">
                  The fastest way to get started - install directly into Claude
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-green-400 text-sm whitespace-pre">claude mcp add v0-server -e V0_API_KEY="your-key-here" -- npx v0-mcp-server</code>
                </div>
              </CardContent>
            </Card>

            {/* NPX Quick Start */}
            <Card className="border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">NPX</CardTitle>
                <CardDescription className="text-base">
                  No installation needed - run the server directly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-green-400 text-sm whitespace-pre">V0_API_KEY="your-key-here" npx v0-mcp-server</code>
                </div>
              </CardContent>
            </Card>

            {/* Manual Configuration */}
            <Card className="border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Manual Setup</CardTitle>
                <CardDescription className="text-base">
                  Configure Claude Desktop manually for advanced setups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/getting-started#manual-configuration">
                    View Configuration
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Get API Key Note */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Need an API key? Get yours from{" "}
              <Link href="https://v0.dev/chat/settings/keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 font-medium">
                v0.dev/chat/settings/keys
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started with v0 MCP Server in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Key className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Get v0 API Key</h3>
              <p className="text-gray-600 mb-4">Generate your API key from v0.dev settings</p>
              <div className="bg-gray-900 rounded-lg p-4 text-left overflow-x-auto">
                <code className="text-purple-400 text-sm">v0.dev/chat/settings/keys</code>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Install Server</h3>
              <p className="text-gray-600 mb-4">Use Claude Code or run with npx</p>
              <div className="bg-gray-900 rounded-lg p-4 text-left overflow-x-auto">
                <code className="text-green-400 text-sm">claude mcp add v0-server</code>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Add API Key</h3>
              <p className="text-gray-600 mb-4">Provide your v0 API key when prompted</p>
              <div className="bg-gray-900 rounded-lg p-4 text-left overflow-x-auto">
                <code className="text-blue-400 text-sm">
                  {"--api-key YOUR_V0_API_KEY"}
                </code>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Play className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">4. Start Creating</h3>
              <p className="text-gray-600 mb-4">Generate React components with natural language</p>
              <div className="bg-gray-900 rounded-lg p-4 text-left overflow-x-auto">
                <code className="text-cyan-400 text-sm">Create a login form component</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Example Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">See It In Action</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Watch how natural language prompts become fully functional React components
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* MCP Tool Call */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                MCP Tool Call
              </h3>
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300">Claude Desktop</div>
                <div className="p-6">
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    <code>{`{
  "tool": "chats_create",
  "arguments": {
    "params": {
      "message": "Create a modern login form with email and password fields, a remember me checkbox, and a gradient submit button. Include form validation and loading states."
    }
  }
}`}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Generated Component */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Generated Component
              </h3>
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300">login-form.tsx</div>
                <div className="p-6">
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    <code>{`import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  return (
    <form className="space-y-4 max-w-md mx-auto">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button 
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Examples Preview Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Learn by Example</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore practical examples and code snippets to get the most out of v0 MCP Server
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Response Transformation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Learn how to parse and transform v0.dev responses for your specific needs
                </CardDescription>
                <Button asChild variant="outline" size="sm">
                  <Link href="/examples#chat-response">
                    View Example
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Language Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Automatically detect programming languages for syntax highlighting
                </CardDescription>
                <Button asChild variant="outline" size="sm">
                  <Link href="/examples#language-detection">
                    View Example
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Logging Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Implement comprehensive logging for debugging and monitoring
                </CardDescription>
                <Button asChild variant="outline" size="sm">
                  <Link href="/examples#logging">
                    View Example
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <Button asChild size="lg">
              <Link href="/examples">
                View All Examples
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of developers using v0 MCP Server to accelerate their React development
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/getting-started">
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-purple-600 bg-transparent"
            >
              <Link href="/api-reference">API Reference</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}