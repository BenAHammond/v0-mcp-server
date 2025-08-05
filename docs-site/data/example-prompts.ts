export interface ExamplePrompt {
  id: string
  title: string
  prompt: string
  description?: string
  category: 'styling' | 'content' | 'interactive' | 'layout'
  componentPath: string
}

export const examplePrompts: ExamplePrompt[] = [
  {
    id: 'party-welcome',
    title: 'Party Welcome Card',
    prompt: "a welcome card in hot pink with 'Welcome to Tiffany's Party'",
    description: 'Shows custom styling and theming capabilities',
    category: 'styling',
    componentPath: 'party-welcome-card'
  },
  {
    id: 'ocean-info',
    title: 'Ocean Information Card',
    prompt: 'A card of information about the ocean.',
    description: 'Demonstrates content organization and information display',
    category: 'content',
    componentPath: 'ocean-info-card'
  },
  {
    id: 'game-rules',
    title: 'Game Night Rules',
    prompt: 'A list of rules for a game night with some friends.',
    description: 'Shows list formatting and structured content',
    category: 'layout',
    componentPath: 'game-rules-list'
  },
  {
    id: 'recipe-card',
    title: 'Recipe Card',
    prompt: 'A recipe card for a grilled cheese sandwich',
    description: 'Displays structured data in a visually appealing way',
    category: 'content',
    componentPath: 'recipe-card'
  },
  {
    id: 'contact-form',
    title: 'Contact Form',
    prompt: 'A contact form for a plumbing service',
    description: 'Interactive form with industry-specific styling',
    category: 'interactive',
    componentPath: 'contact-form'
  }
]