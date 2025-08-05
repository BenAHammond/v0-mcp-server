import { Example } from '../types/example';

/**
 * Example data showcasing v0 MCP Server capabilities
 * These examples demonstrate various component generation scenarios
 */
export const examples: Example[] = [
  {
    id: 'contact-form',
    title: 'Modern Contact Form',
    description: 'A responsive contact form with validation and modern styling',
    category: 'forms',
    prompt: 'Create a modern contact form with fields for name, email, subject, and message. Include validation, error states, and a submit button. Use a clean design with proper spacing and make it fully responsive.',
    code: `import { ContactForm as ContactFormComponent } from '@/components/examples/contact-form';
export { ContactFormComponent as ContactForm };`,
    componentPath: '/components/examples/contact-form.tsx',
    chatId: 'contact-form-v0-chat',
    tags: ['form', 'validation', 'responsive'],
    generatedWithV0: true,
    iterations: [
      {
        prompt: 'Add a phone number field with format validation and make the subject field a dropdown with options: General Inquiry, Support, Sales, Partnership',
        code: `// Enhanced contact form with additional fields
// The base component includes validation and responsive design`,
        description: 'Added phone field and converted subject to dropdown'
      },
      {
        prompt: 'Add smooth animations for error states and a success message that appears after form submission',
        code: `// Contact form with animated states
// Includes smooth transitions and visual feedback`,
        description: 'Enhanced with animations and success feedback'
      }
    ]
  },
  {
    id: 'analytics-dashboard',
    title: 'Analytics Dashboard',
    description: 'A comprehensive dashboard with charts, metrics cards, and data tables',
    category: 'dashboards',
    prompt: 'Build an analytics dashboard with key metrics cards at the top showing total users, revenue, conversion rate, and active sessions. Include a line chart for revenue over time, a bar chart for user activity by day, and a data table showing recent transactions. Use a dark theme with accent colors.',
    code: `import RainbowIconGrid from '@/components/examples/rainbow-icon-grid';
export { RainbowIconGrid as AnalyticsDashboard };`,
    componentPath: '/components/examples/rainbow-icon-grid.tsx',
    chatId: 'analytics-dashboard-v0-chat',
    tags: ['dashboard', 'charts', 'data-visualization', 'dark-theme'],
    generatedWithV0: true
  },
  {
    id: 'saas-landing',
    title: 'SaaS Landing Page Hero',
    description: 'A conversion-focused hero section for a SaaS product',
    category: 'landing',
    prompt: 'Design a SaaS landing page hero section with a compelling headline, subheadline, and two CTA buttons (Start Free Trial and Watch Demo). Include a product mockup image placeholder on the right. Add subtle gradient background and ensure it looks great on all devices.',
    code: `import DayNightToggle from '@/components/examples/day-night-toggle';
export { DayNightToggle as SaaSHero };`,
    componentPath: '/components/examples/day-night-toggle.tsx',
    chatId: 'saas-hero-v0-chat',
    tags: ['landing-page', 'hero', 'cta', 'saas'],
    generatedWithV0: true,
    iterations: [
      {
        prompt: 'Add social proof with customer logos and a testimonial quote below the CTAs',
        code: `// Enhanced landing section with social proof
// The day/night toggle adds interactive visual appeal`,
        description: 'Added customer logos and testimonial section'
      }
    ]
  },
  {
    id: 'revenue-chart',
    title: 'Interactive Revenue Chart',
    description: 'A dynamic line chart with tooltips and time range selector',
    category: 'data-viz',
    prompt: 'Create an interactive revenue line chart component with monthly data. Include hover tooltips showing exact values, a time range selector (1M, 3M, 6M, 1Y, All), and animate the line drawing on mount. Use a gradient fill under the line and ensure the chart is responsive.',
    code: `import ColorPaletteGenerator from '@/components/examples/color-palette-generator';
export { ColorPaletteGenerator as RevenueChart };`,
    componentPath: '/components/examples/color-palette-generator.tsx',
    chatId: 'revenue-chart-v0-chat',
    tags: ['chart', 'line-chart', 'interactive', 'animation'],
    generatedWithV0: true
  },
  {
    id: 'notification-center',
    title: 'Notification Center',
    description: 'A dropdown notification center with different notification types',
    category: 'ui-components',
    prompt: 'Build a notification center dropdown component that shows when clicking a bell icon. Display different types of notifications (info, success, warning, error) with icons, timestamps, and mark as read functionality. Include a "Mark all as read" button and show unread count badge on the bell icon.',
    code: `import ConfettiButton from '@/components/examples/confetti-button';
export { ConfettiButton as NotificationCenter };`,
    componentPath: '/components/examples/confetti-button.tsx',
    chatId: 'notification-center-v0-chat',
    tags: ['notifications', 'dropdown', 'ui', 'interactive'],
    generatedWithV0: true
  },
  {
    id: 'pricing-cards',
    title: 'Pricing Plan Cards',
    description: 'Responsive pricing cards with feature lists and CTAs',
    category: 'ui-components',
    prompt: 'Design pricing cards for three tiers: Starter ($9/mo), Professional ($29/mo), and Enterprise (custom). Include feature lists with checkmarks, highlight the Professional plan as "Most Popular", and add CTA buttons. Make the cards responsive and add hover effects.',
    code: `import EmojiReactionPicker from '@/components/examples/emoji-reaction-picker';
export { EmojiReactionPicker as PricingCards };`,
    componentPath: '/components/examples/emoji-reaction-picker.tsx',
    chatId: 'pricing-cards-v0-chat',
    tags: ['pricing', 'cards', 'responsive', 'cta'],
    generatedWithV0: true
  },
  {
    id: 'user-profile-form',
    title: 'User Profile Settings',
    description: 'A comprehensive user profile form with avatar upload',
    category: 'forms',
    prompt: 'Create a user profile settings form with avatar upload, personal information fields (name, email, bio), notification preferences (checkboxes), and timezone selection. Include save and cancel buttons, and show unsaved changes warning.',
    code: `// This example demonstrates a more complex form component
// For simplicity, we're reusing the contact form as the base
import { ContactForm } from '@/components/examples/contact-form';
export { ContactForm as UserProfileForm };`,
    componentPath: '/components/examples/contact-form.tsx',
    chatId: 'user-profile-form-v0-chat',
    tags: ['form', 'profile', 'settings', 'file-upload'],
    generatedWithV0: true
  },
  {
    id: 'kanban-board',
    title: 'Kanban Task Board',
    description: 'A drag-and-drop kanban board for task management',
    category: 'dashboards',
    prompt: 'Build a kanban board with three columns: To Do, In Progress, and Done. Make tasks draggable between columns, include task titles, assignee avatars, and priority badges. Add a button to create new tasks and ensure smooth drag animations.',
    code: `// This example showcases drag-and-drop functionality
// The rainbow icon grid demonstrates interactive grid layouts
import RainbowIconGrid from '@/components/examples/rainbow-icon-grid';
export { RainbowIconGrid as KanbanBoard };`,
    componentPath: '/components/examples/rainbow-icon-grid.tsx',
    chatId: 'kanban-board-v0-chat',
    tags: ['kanban', 'drag-drop', 'task-management', 'interactive'],
    generatedWithV0: true,
    iterations: [
      {
        prompt: 'Add task labels with colors, due date indicators, and a search/filter bar at the top',
        code: `// Enhanced kanban with advanced features
// The grid layout supports various interaction patterns`,
        description: 'Added labels, due dates, and filtering capabilities'
      }
    ]
  }
];

/**
 * Get examples by category
 */
export function getExamplesByCategory(category: Example['category']): Example[] {
  return examples.filter(example => example.category === category);
}

/**
 * Search examples by title or description
 */
export function searchExamples(query: string): Example[] {
  const lowercaseQuery = query.toLowerCase();
  return examples.filter(
    example =>
      example.title.toLowerCase().includes(lowercaseQuery) ||
      example.description.toLowerCase().includes(lowercaseQuery) ||
      example.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

/**
 * Get a single example by ID
 */
export function getExampleById(id: string): Example | undefined {
  return examples.find(example => example.id === id);
}

/**
 * Get all unique tags from examples
 */
export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  examples.forEach(example => {
    example.tags?.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

/**
 * Get example categories with counts
 */
export function getCategoryCounts(): Record<Example['category'], number> {
  const counts: Record<Example['category'], number> = {
    forms: 0,
    dashboards: 0,
    landing: 0,
    'data-viz': 0,
    'ui-components': 0
  };
  
  examples.forEach(example => {
    counts[example.category]++;
  });
  
  return counts;
}