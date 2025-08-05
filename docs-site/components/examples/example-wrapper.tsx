import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Code } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExampleWrapperProps {
  title: string
  prompt: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ExampleWrapper({
  title,
  prompt,
  description,
  children,
  className
}: ExampleWrapperProps) {
  const [showPrompt, setShowPrompt] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPrompt(!showPrompt)}
            className="shrink-0"
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>
        
        {showPrompt && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-mono text-gray-700 flex-1">
                "{prompt}"
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 h-8 w-8 p-0"
              >
                {copied ? (
                  <span className="text-xs">✓</span>
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-6 pt-3">
        <div className="border rounded-lg p-4 bg-white">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}