"use client"

import { useState } from "react"
import { Search, Copy, Check, ChevronRight, ExternalLink, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Tool {
  name: string
  description: string
  parameters: {
    required: string[]
    optional: string[]
  }
  example: string
  exampleUsageLink?: string
}

export default function ApiReferencePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedTool, setCopiedTool] = useState<string | null>(null)

  const copyToClipboard = (text: string, toolName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedTool(toolName)
    setTimeout(() => setCopiedTool(null), 2000)
  }

  // SDK documentation links for each namespace
  const sdkDocLinks: Record<string, string> = {
    chats: "https://v0.dev/docs/api/chats",
    projects: "https://v0.dev/docs/api/projects",
    deployments: "https://v0.dev/docs/api/deployments",
    user: "https://v0.dev/docs/api/user",
    rate_limits: "https://v0.dev/docs/api/rate-limits",
    hooks: "https://v0.dev/docs/api/webhooks",
    integrations: "https://v0.dev/docs/api/integrations"
  }

  const tools: Record<string, Tool[]> = {
    chats: [
      {
        name: "chats_create",
        description: "Create a new chat to generate a component",
        parameters: {
          required: ["message"],
          optional: []
        },
        example: `{
  "tool": "chats_create",
  "arguments": {
    "params": {
      "message": "Create a hero section with gradient background"
    }
  }
}`,
        exampleUsageLink: "/examples#contact-form"
      },
      {
        name: "chats_find",
        description: "List all existing chats",
        parameters: {
          required: [],
          optional: ["limit", "offset"]
        },
        example: `{
  "tool": "chats_find",
  "arguments": {
    "params": {}
  }
}`
      },
      {
        name: "chats_send_message",
        description: "Send a message to an existing chat to iterate on a component",
        parameters: {
          required: ["chatId", "message"],
          optional: []
        },
        example: `{
  "tool": "chats_send_message",
  "arguments": {
    "params": {
      "chatId": "abc123",
      "message": "Make the background darker"
    }
  }
}`,
        exampleUsageLink: "/examples#contact-form"
      }
    ],
    projects: [
      {
        name: "projects_find",
        description: "List all projects",
        parameters: {
          required: [],
          optional: ["limit", "offset"]
        },
        example: `{
  "tool": "projects_find",
  "arguments": {
    "params": {}
  }
}`
      },
      {
        name: "projects_create",
        description: "Create a new project",
        parameters: {
          required: ["name"],
          optional: ["description"]
        },
        example: `{
  "tool": "projects_create",
  "arguments": {
    "params": {
      "name": "My UI Library"
    }
  }
}`
      }
    ],
    deployments: [
      {
        name: "deployments_find",
        description: "List deployments for a project",
        parameters: {
          required: ["projectId", "chatId", "versionId"],
          optional: []
        },
        example: `{
  "tool": "deployments_find",
  "arguments": {
    "params": {
      "projectId": "proj_123",
      "chatId": "chat_456",
      "versionId": "ver_789"
    }
  }
}`
      }
    ],
    user: [
      {
        name: "user_get",
        description: "Get current user information",
        parameters: {
          required: [],
          optional: []
        },
        example: `{
  "tool": "user_get",
  "arguments": {
    "params": {}
  }
}`
      },
      {
        name: "user_get_plan",
        description: "Get current subscription plan details",
        parameters: {
          required: [],
          optional: []
        },
        example: `{
  "tool": "user_get_plan",
  "arguments": {
    "params": {}
  }
}`
      }
    ],
    rate_limits: [
      {
        name: "rate_limits_find",
        description: "Check current API rate limits and usage",
        parameters: {
          required: [],
          optional: []
        },
        example: `{
  "tool": "rate_limits_find",
  "arguments": {
    "params": {}
  }
}`
      }
    ]
  }

  const legacyAliases = [
    {
      legacy: "generate_component",
      modern: "chats_create",
      description: "Legacy alias for component generation",
      exampleLink: "/examples#contact-form"
    },
    {
      legacy: "iterate_component",
      modern: "chats_send_message",
      description: "Legacy alias for component iteration",
      exampleLink: "/examples#saas-landing"
    }
  ]

  const filteredTools = Object.entries(tools).reduce<Record<string, Tool[]>>((acc, [namespace, toolList]) => {
    const filtered = toolList.filter(tool => 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (filtered.length > 0) {
      acc[namespace] = filtered
    }
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            API Reference
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Complete reference for all auto-discovered v0 SDK tools available through the MCP server
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
        </div>
      </section>

      {/* Key Examples Section */}
      <section className="py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start Examples</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link 
              href="/examples#contact-form"
              className="block p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <h3 className="font-semibold text-gray-900 mb-1">Generate a Component</h3>
              <p className="text-sm text-gray-600">Learn how to use chats_create to generate your first component</p>
              <span className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600">
                View example <ChevronRight className="h-3 w-3" />
              </span>
            </Link>
            <Link 
              href="/examples#saas-landing"
              className="block p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <h3 className="font-semibold text-gray-900 mb-1">Iterate on Components</h3>
              <p className="text-sm text-gray-600">See how chats_send_message refines existing components</p>
              <span className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600">
                View example <ChevronRight className="h-3 w-3" />
              </span>
            </Link>
            <Link 
              href="/examples#analytics-dashboard"
              className="block p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <h3 className="font-semibold text-gray-900 mb-1">Complex UI Patterns</h3>
              <p className="text-sm text-gray-600">Explore dashboard and data visualization examples</p>
              <span className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600">
                View example <ChevronRight className="h-3 w-3" />
              </span>
            </Link>
          </div>
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Tip:</strong> Check out our <Link href="/examples" className="text-blue-600 hover:text-blue-700">examples page</Link> for comprehensive demonstrations of each tool in action, including prompts, generated code, and iteration workflows.
            </p>
          </div>
        </div>
      </section>

      {/* Tools Directory */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Auto-Discovered Tools</h2>
            <p className="text-gray-600">
              The v0 MCP Server automatically discovers and exposes 39 tools from the v0 SDK. 
              These tools are organized by namespace and provide full access to v0's capabilities.
            </p>
          </div>

          {/* Tools Grid */}
          <div className="space-y-12">
            {Object.entries(filteredTools).map(([namespace, toolList]) => (
              <div key={namespace}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 capitalize">
                    {namespace.replace('_', ' ')} Namespace
                  </h3>
                  {sdkDocLinks[namespace] && (
                    <a
                      href={sdkDocLinks[namespace]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      View SDK Docs
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="grid gap-6">
                  {toolList.map((tool) => (
                    <Card key={tool.name} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-mono">{tool.name}</CardTitle>
                            <CardDescription className="mt-2">{tool.description}</CardDescription>
                          </div>
                          {tool.exampleUsageLink && (
                            <Link 
                              href={tool.exampleUsageLink}
                              className="ml-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <BookOpen className="h-4 w-4" />
                              Example
                            </Link>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Parameters</h4>
                          <div className="space-y-1">
                            {tool.parameters.required.length > 0 && (
                              <div className="text-sm">
                                <span className="text-red-600 font-medium">Required:</span>{" "}
                                <span className="font-mono text-gray-700">
                                  {tool.parameters.required.join(", ")}
                                </span>
                              </div>
                            )}
                            {tool.parameters.optional.length > 0 && (
                              <div className="text-sm">
                                <span className="text-blue-600 font-medium">Optional:</span>{" "}
                                <span className="font-mono text-gray-700">
                                  {tool.parameters.optional.join(", ")}
                                </span>
                              </div>
                            )}
                            {tool.parameters.required.length === 0 && tool.parameters.optional.length === 0 && (
                              <div className="text-sm text-gray-500">No parameters required</div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-700">Example</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(tool.example, tool.name)}
                              className="h-8 px-2"
                            >
                              {copiedTool === tool.name ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-gray-300">
                              <code>{tool.example}</code>
                            </pre>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legacy Aliases Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Legacy Aliases</h2>
            <p className="text-gray-600 mb-8">
              For backward compatibility, the following legacy tool names are supported and automatically 
              mapped to their modern equivalents:
            </p>
            <div className="grid gap-4">
              {legacyAliases.map((alias) => (
                <Card key={alias.legacy}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex-1 flex items-center space-x-4">
                      <code className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                        {alias.legacy}
                      </code>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <code className="text-sm font-mono bg-blue-100 text-blue-700 px-3 py-1 rounded">
                        {alias.modern}
                      </code>
                      <span className="text-sm text-gray-600 ml-4">{alias.description}</span>
                    </div>
                    {alias.exampleLink && (
                      <Link 
                        href={alias.exampleLink}
                        className="ml-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <BookOpen className="h-4 w-4" />
                        Example
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Authentication Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Authentication</h2>
            <Card>
              <CardHeader>
                <CardTitle>API Key Configuration</CardTitle>
                <CardDescription>
                  All requests require a valid v0 API key for authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Getting Your API Key</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>Visit <code className="bg-gray-100 px-2 py-1 rounded">v0.dev/chat/settings/keys</code></li>
                    <li>Click "Generate New Key"</li>
                    <li>Copy your key (format: <code className="bg-gray-100 px-2 py-1 rounded">v1:xxxxx:xxxxx</code>)</li>
                  </ol>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Using Your API Key</h4>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-sm text-gray-300">
                      <code>{`# Set as environment variable
export V0_API_KEY="v1:your:key"

# Or pass to npx command
npx v0-mcp-server --api-key "v1:your:key"`}</code>
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Official SDK Documentation Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Official v0 SDK Documentation</h2>
            <Card>
              <CardHeader>
                <CardTitle>Learn More About v0's Capabilities</CardTitle>
                <CardDescription>
                  The v0 MCP Server exposes a subset of the full v0 SDK capabilities. For advanced use cases and direct SDK integration, explore the official documentation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <a
                    href="https://v0.dev/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">v0 Documentation</h4>
                      <p className="text-sm text-gray-600 mt-1">Complete guide to v0's features and capabilities</p>
                    </div>
                    <ExternalLink className="h-5 w-5 text-gray-400" />
                  </a>
                  <a
                    href="https://v0.dev/docs/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">API Reference</h4>
                      <p className="text-sm text-gray-600 mt-1">Detailed SDK API documentation</p>
                    </div>
                    <ExternalLink className="h-5 w-5 text-gray-400" />
                  </a>
                  <a
                    href="https://sdk.v0.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">v0 SDK</h4>
                      <p className="text-sm text-gray-600 mt-1">Official SDK for direct integration</p>
                    </div>
                    <ExternalLink className="h-5 w-5 text-gray-400" />
                  </a>
                  <a
                    href="https://v0.dev/docs/guides"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">Guides & Tutorials</h4>
                      <p className="text-sm text-gray-600 mt-1">Learn best practices and advanced techniques</p>
                    </div>
                    <ExternalLink className="h-5 w-5 text-gray-400" />
                  </a>
                </div>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> When using the v0 MCP Server through Claude, you don't need to interact with the SDK directly. 
                    The MCP server handles all SDK calls automatically. These links are provided for users who want to explore 
                    additional capabilities or integrate v0 directly into their applications.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}