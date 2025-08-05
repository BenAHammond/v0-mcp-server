"use client"

import * as React from "react"
import { ExampleGalleryProps, ExampleCategory, Example } from "@/types/example"
import { ExampleCard } from "@/components/server/ui/example-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Gallery component for displaying and filtering examples
 * Implements responsive grid layout, category filtering, and search functionality
 */
export function ExampleGallery({ examples }: { examples: Example[] }) {
  const [selectedCategory, setSelectedCategory] = React.useState<ExampleCategory | undefined>(undefined)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("")

  // Debounce search input for performance
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // No need to sync with parent - manage filter state locally

  // Get unique categories from examples
  const categories: ExampleCategory[] = React.useMemo(() => {
    const categorySet = new Set<ExampleCategory>()
    examples.forEach(example => categorySet.add(example.category))
    return Array.from(categorySet).sort()
  }, [examples])

  // Category display names
  const categoryDisplayNames: Record<ExampleCategory, string> = {
    forms: "Forms",
    dashboards: "Dashboards",
    landing: "Landing Pages",
    "data-viz": "Data Visualization",
    "ui-components": "UI Components"
  }

  // Filter examples based on selected category and search query
  const filteredExamples = React.useMemo(() => {
    let filtered = examples

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(example => example.category === selectedCategory)
    }

    // Filter by search query
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(example => 
        example.title.toLowerCase().includes(query) ||
        example.description.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [examples, selectedCategory, debouncedSearchQuery])

  // Handle category selection
  const handleCategorySelect = (category: ExampleCategory | undefined) => {
    setSelectedCategory(category)
  }

  // Handle view details action
  const handleViewDetails = (example: Example) => {
    // This will be implemented when the detail view is ready
    console.log("View details for:", example.title)
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="max-w-md">
        <Input
          type="search"
          placeholder="Search examples by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === undefined ? "default" : "outline"}
          size="sm"
          onClick={() => handleCategorySelect(undefined)}
          className="transition-colors"
        >
          All Examples
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategorySelect(category)}
            className="transition-colors"
          >
            {categoryDisplayNames[category]}
          </Button>
        ))}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredExamples.length} {filteredExamples.length === 1 ? "example" : "examples"}
        {selectedCategory && ` in ${categoryDisplayNames[selectedCategory]}`}
        {debouncedSearchQuery && ` matching "${debouncedSearchQuery}"`}
      </div>

      {/* Example Grid */}
      <div 
        className={cn(
          "grid gap-6",
          // Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop
          "grid-cols-1",
          "md:grid-cols-2",
          "lg:grid-cols-3"
        )}
      >
        {filteredExamples.map((example) => (
          <ExampleCard
            key={example.id}
            example={example}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredExamples.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {debouncedSearchQuery 
              ? `No examples found matching "${debouncedSearchQuery}"${selectedCategory ? ` in ${categoryDisplayNames[selectedCategory]}` : ''}.`
              : `No examples found in ${categoryDisplayNames[selectedCategory || 'forms']}.`
            }
          </p>
          <div className="mt-4 space-x-2">
            {debouncedSearchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            )}
            {selectedCategory && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCategorySelect(undefined)}
              >
                View all categories
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}