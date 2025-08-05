/**
 * Types for documentation examples
 */

/**
 * Categories for organizing examples
 */
export type ExampleCategory = 
  | 'forms'
  | 'dashboards'
  | 'landing'
  | 'data-viz'
  | 'ui-components';

/**
 * Represents an iteration on an existing component
 */
export interface Iteration {
  /** The prompt used to request changes */
  prompt: string;
  /** The resulting code after the iteration */
  code: string;
  /** Optional description of what changed */
  description?: string;
}

/**
 * Represents a complete example with its prompt, code, and iterations
 */
export interface Example {
  /** Unique identifier for the example */
  id: string;
  /** Display title for the example */
  title: string;
  /** Brief description of what the example demonstrates */
  description: string;
  /** Category for grouping and filtering */
  category: ExampleCategory;
  /** The initial prompt used to generate the component */
  prompt: string;
  /** The generated component code */
  code: string;
  /** Optional chat ID from v0.dev for reference */
  chatId?: string;
  /** Optional iterations showing how the component was refined */
  iterations?: Iteration[];
  /** Optional tags for additional filtering */
  tags?: string[];
  /** Optional path to the component file if it exists */
  componentPath?: string;
  /** Whether this was generated with v0 */
  generatedWithV0?: boolean;
}

/**
 * Example gallery filter options
 */
export interface ExampleFilter {
  /** Filter by category */
  category?: ExampleCategory;
  /** Search query for title and description */
  search?: string;
  /** Filter by tags */
  tags?: string[];
}

/**
 * Props for example-related components
 */
export interface ExampleCardProps {
  example: Example;
  onViewDetails?: (example: Example) => void;
}

export interface ExampleGalleryProps {
  examples: Example[];
  filter?: ExampleFilter;
  onFilterChange?: (filter: ExampleFilter) => void;
}

export interface ExampleDetailProps {
  example: Example;
  onClose?: () => void;
}