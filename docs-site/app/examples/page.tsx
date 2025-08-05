
import { ExampleGallery } from "@/components/client/widgets/example-gallery"
import { examples } from "@/data/examples"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Code2, FileCode } from "lucide-react"

export default function ExamplesPage() {

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Examples
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl">
            Explore practical examples of v0-generated components. Each example shows the natural language prompt and the resulting code.
          </p>
        </div>
      </section>

      {/* Example Gallery Section */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ExampleGallery examples={examples} />
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Additional Resources</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Example Repository
                </CardTitle>
                <CardDescription>
                  Find all example code in the GitHub repository
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="https://github.com/BenAHammond/v0-mcp-server/tree/main/examples" target="_blank" rel="noopener noreferrer">
                    View on GitHub
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  API Documentation
                </CardTitle>
                <CardDescription>
                  Explore the complete API reference
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/api-reference">
                    API Reference
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