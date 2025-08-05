"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeViewerProps {
  code: string
  language?: string
  title?: string
  showLineNumbers?: boolean
  className?: string
}

/**
 * Enhanced responsive code viewer component with mobile-first design
 * Includes copy functionality, fullscreen mode, and improved touch support
 */
export function CodeViewer({ 
  code, 
  language = "typescript", 
  title,
  showLineNumbers = true,
  className 
}: CodeViewerProps) {
  const [copied, setCopied] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isClient, setIsClient] = React.useState(false)
  const codeRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Generate line numbers
  const lines = code.split('\n')
  const maxLineNumberWidth = String(lines.length).length

  return (
    <div 
      className={cn(
        "relative rounded-lg border bg-gray-900",
        isFullscreen && "fixed inset-4 z-50 m-0",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          {title && (
            <span className="text-sm font-medium text-gray-300">{title}</span>
          )}
          {language && (
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              {language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-7 px-2 text-gray-400 hover:text-gray-200"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-gray-400 hover:text-gray-200"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Code Content */}
      <div 
        ref={codeRef}
        className={cn(
          "overflow-x-auto overflow-y-auto",
          isFullscreen ? "max-h-[calc(100vh-8rem)]" : "max-h-[600px]",
          // Mobile-specific styles
          "touch-pan-x touch-pan-y",
          "-webkit-overflow-scrolling-touch"
        )}
      >
        <pre className="p-4 text-sm leading-relaxed">
          <code className="block min-w-max">
            {lines.map((line, index) => (
              <div key={index} className="flex">
                {showLineNumbers && (
                  <span 
                    className="select-none text-gray-500 mr-4"
                    style={{ 
                      minWidth: `${maxLineNumberWidth + 0.5}ch`,
                      textAlign: 'right' 
                    }}
                  >
                    {index + 1}
                  </span>
                )}
                {isClient ? (
                  <span 
                    className="text-gray-300"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSyntax(line, language) 
                    }} 
                  />
                ) : (
                  <span className="text-gray-300">{line}</span>
                )}
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* Mobile scroll indicator */}
      <div className="sm:hidden absolute bottom-2 right-2 text-xs text-gray-500 pointer-events-none">
        {code.split('\n').some(line => line.length > 80) && (
          <span className="bg-gray-800 px-2 py-1 rounded">
            ← Scroll →
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Basic syntax highlighting for common languages
 */
function highlightSyntax(code: string, language: string): string {
  // Escape HTML first
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  if (language === 'typescript' || language === 'javascript' || language === 'tsx' || language === 'jsx') {
    // Keywords
    highlighted = highlighted.replace(
      /\b(const|let|var|function|class|interface|type|import|export|from|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|this|super|extends|implements|async|await|yield|typeof|instanceof|in|of|delete|void|null|undefined|true|false)\b/g,
      '<span class="text-purple-400">$1</span>'
    )
    
    // Strings
    highlighted = highlighted.replace(
      /(["'`])(?:(?=(\\?))\2[\s\S])*?\1/g,
      '<span class="text-green-400">$&</span>'
    )
    
    // Comments
    highlighted = highlighted.replace(
      /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
      '<span class="text-gray-500">$1</span>'
    )
    
    // Numbers
    highlighted = highlighted.replace(
      /\b(\d+)\b/g,
      '<span class="text-orange-400">$1</span>'
    )
    
    // Functions
    highlighted = highlighted.replace(
      /(\w+)(?=\s*\()/g,
      '<span class="text-blue-400">$1</span>'
    )
  } else if (language === 'css') {
    // CSS selectors
    highlighted = highlighted.replace(
      /([.#]?[\w-]+)(?=\s*{)/g,
      '<span class="text-yellow-400">$1</span>'
    )
    
    // CSS properties
    highlighted = highlighted.replace(
      /([\w-]+)(?=\s*:)/g,
      '<span class="text-blue-400">$1</span>'
    )
    
    // CSS values
    highlighted = highlighted.replace(
      /:\s*([^;]+)/g,
      ': <span class="text-green-400">$1</span>'
    )
  } else if (language === 'html' || language === 'xml') {
    // Tags
    highlighted = highlighted.replace(
      /(&lt;\/?)([\w-]+)(.*?)(&gt;)/g,
      '$1<span class="text-red-400">$2</span>$3$4'
    )
    
    // Attributes
    highlighted = highlighted.replace(
      /(\w+)(?==)/g,
      '<span class="text-yellow-400">$1</span>'
    )
  }

  return highlighted
}

/**
 * Responsive code block utility component for inline code snippets
 */
export function InlineCode({ 
  children, 
  className = "",
  variant = "default" 
}: { 
  children: React.ReactNode
  className?: string
  variant?: "default" | "primary" | "success" | "warning"
}) {
  const baseClasses = "font-mono text-xs sm:text-sm px-2 py-1 rounded break-all"
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-blue-100 text-blue-700", 
    success: "bg-green-100 text-green-700",
    warning: "bg-orange-100 text-orange-700"
  }
  
  return (
    <code className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </code>
  )
}

/**
 * Simple responsive code block for basic code snippets
 */
export function CodeBlock({ 
  children, 
  className = "",
  copyable = true,
  language = "text"
}: { 
  children: React.ReactNode
  className?: string
  copyable?: boolean
  language?: string
}) {
  const [copied, setCopied] = React.useState(false)
  
  const handleCopy = async () => {
    if (!copyable) return
    
    try {
      const text = typeof children === 'string' ? children : children?.toString() || ''
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <div className={cn("relative bg-gray-900 rounded-lg overflow-hidden", className)}>
      {copyable && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="absolute top-2 right-2 z-10 h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-800"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      )}
      <div className="overflow-x-auto touch-pan-x -webkit-overflow-scrolling-touch">
        <pre className="p-3 sm:p-4 text-xs sm:text-sm leading-relaxed min-w-max">
          <code className="text-gray-300">
            {children}
          </code>
        </pre>
      </div>
      
      {/* Mobile scroll hint for long code */}
      <div className="sm:hidden absolute bottom-2 right-2 pointer-events-none">
        {typeof children === 'string' && children.split('\n').some(line => line.length > 60) && (
          <span className="bg-gray-800/80 text-gray-400 text-xs px-2 py-1 rounded backdrop-blur-sm">
            ← →
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Multi-line command block for terminal commands
 */
export function CommandBlock({ 
  commands, 
  className = "",
  prompt = "$"
}: { 
  commands: string[]
  className?: string
  prompt?: string
}) {
  const [copied, setCopied] = React.useState(false)
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(commands.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy commands:', err)
    }
  }

  return (
    <div className={cn("relative bg-gray-900 rounded-lg overflow-hidden", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-800"
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      <div className="overflow-x-auto touch-pan-x -webkit-overflow-scrolling-touch">
        <pre className="p-3 sm:p-4 text-xs sm:text-sm leading-relaxed">
          {commands.map((command, index) => (
            <div key={index} className="flex">
              <span className="text-green-400 select-none mr-2 flex-shrink-0">
                {prompt}
              </span>
              <code className="text-gray-300 min-w-max">
                {command}
              </code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  )
}