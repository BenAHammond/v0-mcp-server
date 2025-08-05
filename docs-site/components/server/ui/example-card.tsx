import * as React from "react"
import { ExampleCardProps } from "@/types/example"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Displays an example card with title, description, category, and prompt
 */
export function ExampleCard({ example, onViewDetails }: ExampleCardProps) {
  const categoryColors: Record<string, string> = {
    forms: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    dashboards: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    landing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "data-viz": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    "ui-components": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  }

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(example)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-xl">{example.title}</CardTitle>
          <span
            className={cn(
              "px-2 py-1 text-xs font-medium rounded-full",
              categoryColors[example.category] || "bg-gray-100 text-gray-800"
            )}
          >
            {example.category}
          </span>
        </div>
        <CardDescription>{example.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Prompt:</h4>
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="text-foreground">{example.prompt}</p>
          </div>
          {example.iterations && example.iterations.length > 0 && (
            <p className="text-sm text-muted-foreground">
              + {example.iterations.length} iteration{example.iterations.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleViewDetails}
          variant="default"
          className="w-full"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}