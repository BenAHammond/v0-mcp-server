import { Example, Iteration } from '../types/example';
import fs from 'fs/promises';
import path from 'path';

/**
 * Configuration for the v0 MCP server connection
 */
interface V0Config {
  apiKey?: string;
  cacheDir?: string;
}

/**
 * Result from v0 component generation
 */
interface GeneratedComponent {
  files: Array<{
    path: string;
    content: string;
  }>;
  chatId: string;
}

/**
 * Cache structure for storing generated examples
 */
interface CachedExample {
  example: Example;
  generatedAt: string;
  version: string;
}

/**
 * Generate examples using the v0 MCP server
 * This utility handles calling v0, caching results, and error handling
 */
export class ExampleGenerator {
  private config: V0Config;
  private cacheDir: string;
  private readonly CACHE_VERSION = '1.0.0';

  constructor(config: V0Config = {}) {
    this.config = config;
    this.cacheDir = config.cacheDir || path.join(process.cwd(), '.cache', 'v0-examples');
  }

  /**
   * Initialize the cache directory
   */
  private async initCache(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  /**
   * Get cached example if it exists and is valid
   */
  private async getCachedExample(exampleId: string): Promise<Example | null> {
    try {
      const cachePath = path.join(this.cacheDir, `${exampleId}.json`);
      const cacheData = await fs.readFile(cachePath, 'utf-8');
      const cached: CachedExample = JSON.parse(cacheData);
      
      // Check if cache version matches
      if (cached.version === this.CACHE_VERSION) {
        return cached.example;
      }
    } catch (error) {
      // Cache miss or error, will regenerate
    }
    return null;
  }

  /**
   * Save example to cache
   */
  private async cacheExample(example: Example): Promise<void> {
    try {
      await this.initCache();
      const cachePath = path.join(this.cacheDir, `${example.id}.json`);
      const cacheData: CachedExample = {
        example,
        generatedAt: new Date().toISOString(),
        version: this.CACHE_VERSION
      };
      await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.error('Failed to cache example:', error);
    }
  }

  /**
   * Extract the main component code from generated files
   */
  private extractComponentCode(files: GeneratedComponent['files']): string {
    // Look for the main component file (usually the first .tsx or .jsx file)
    const componentFile = files.find(
      file => file.path.endsWith('.tsx') || file.path.endsWith('.jsx')
    );
    
    if (componentFile) {
      return componentFile.content;
    }
    
    // Fallback to first file if no component file found
    return files[0]?.content || '// No code generated';
  }

  /**
   * Generate a single example using v0
   * Note: This is a placeholder implementation since we're using MCP tools
   * In a real implementation, this would call the mcp__v0-server__generate_component tool
   */
  async generateExample(
    baseExample: Omit<Example, 'code' | 'chatId' | 'generatedWithV0'>
  ): Promise<Example> {
    // Check cache first
    const cached = await this.getCachedExample(baseExample.id);
    if (cached) {
      console.log(`Using cached example for ${baseExample.id}`);
      return cached;
    }

    try {
      console.log(`Generating example: ${baseExample.id}`);
      
      // In a real implementation with MCP tools available, this would be:
      // const result = await mcp__v0_server__generate_component({
      //   description: baseExample.prompt,
      //   options: {
      //     framework: 'react',
      //     styling: 'tailwind',
      //     typescript: true
      //   }
      // });

      // For now, return a mock implementation
      const mockCode = this.generateMockCode(baseExample);
      
      const example: Example = {
        ...baseExample,
        code: mockCode,
        chatId: `mock-chat-${baseExample.id}`,
        generatedWithV0: true
      };

      // Handle iterations if present
      if (baseExample.iterations && example.chatId) {
        example.iterations = await this.generateIterations(
          example.chatId,
          baseExample.iterations
        );
      }

      // Cache the result
      await this.cacheExample(example);
      
      return example;
    } catch (error) {
      console.error(`Failed to generate example ${baseExample.id}:`, error);
      
      // Return with placeholder code on error
      return {
        ...baseExample,
        code: `// Error generating component: ${error instanceof Error ? error.message : 'Unknown error'}\n// Using placeholder code`,
        generatedWithV0: false
      };
    }
  }

  /**
   * Generate iterations for an example
   */
  private async generateIterations(
    chatId: string,
    iterations: Iteration[]
  ): Promise<Iteration[]> {
    const generatedIterations: Iteration[] = [];
    
    for (const iteration of iterations) {
      try {
        // In a real implementation with MCP tools:
        // const result = await mcp__v0_server__iterate_component({
        //   chatId,
        //   changes: iteration.prompt
        // });
        
        // For now, use mock code
        const mockCode = this.generateMockIterationCode(iteration);
        
        generatedIterations.push({
          ...iteration,
          code: mockCode
        });
      } catch (error) {
        console.error('Failed to generate iteration:', error);
        generatedIterations.push({
          ...iteration,
          code: `// Error generating iteration: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
    
    return generatedIterations;
  }

  /**
   * Generate mock code for examples (temporary until MCP tools are available)
   */
  private generateMockCode(example: Omit<Example, 'code' | 'chatId' | 'generatedWithV0'>): string {
    const componentName = this.getComponentName(example.id);
    
    return `import React from 'react';

/**
 * ${example.title}
 * ${example.description}
 * 
 * Generated with v0.dev
 * Prompt: ${example.prompt}
 */
export function ${componentName}() {
  // This is a placeholder component
  // In production, this would be replaced with actual v0-generated code
  
  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">${example.title}</h3>
      <p className="text-gray-600">${example.description}</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-500">
          Component implementation will be generated using v0.dev
        </p>
      </div>
    </div>
  );
}`;
  }

  /**
   * Generate mock iteration code
   */
  private generateMockIterationCode(iteration: Iteration): string {
    return `// Iteration: ${iteration.description || 'Updated version'}
// Prompt: ${iteration.prompt}

// This is a placeholder for the iterated component
// In production, this would show the actual v0-generated iteration`;
  }

  /**
   * Convert example ID to PascalCase component name
   */
  private getComponentName(id: string): string {
    return id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Generate all examples from a list
   */
  async generateAllExamples(
    examples: Array<Omit<Example, 'code' | 'chatId' | 'generatedWithV0'>>
  ): Promise<Example[]> {
    const generated: Example[] = [];
    
    for (const example of examples) {
      const result = await this.generateExample(example);
      generated.push(result);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return generated;
  }

  /**
   * Clear the cache for a specific example or all examples
   */
  async clearCache(exampleId?: string): Promise<void> {
    try {
      if (exampleId) {
        const cachePath = path.join(this.cacheDir, `${exampleId}.json`);
        await fs.unlink(cachePath);
        console.log(`Cleared cache for example: ${exampleId}`);
      } else {
        // Clear all cache files
        const files = await fs.readdir(this.cacheDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            await fs.unlink(path.join(this.cacheDir, file));
          }
        }
        console.log('Cleared all cached examples');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalCached: number;
    cacheSize: number;
    oldestCache: Date | null;
  }> {
    try {
      await this.initCache();
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;
      let oldestDate: Date | null = null;
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.cacheDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          
          if (!oldestDate || stats.mtime < oldestDate) {
            oldestDate = stats.mtime;
          }
        }
      }
      
      return {
        totalCached: files.filter(f => f.endsWith('.json')).length,
        cacheSize: totalSize,
        oldestCache: oldestDate
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalCached: 0,
        cacheSize: 0,
        oldestCache: null
      };
    }
  }
}

/**
 * Default instance for convenience
 */
export const exampleGenerator = new ExampleGenerator();

/**
 * Utility function to generate a single example
 */
export async function generateExample(
  example: Omit<Example, 'code' | 'chatId' | 'generatedWithV0'>
): Promise<Example> {
  return exampleGenerator.generateExample(example);
}

/**
 * Utility function to generate multiple examples
 */
export async function generateExamples(
  examples: Array<Omit<Example, 'code' | 'chatId' | 'generatedWithV0'>>
): Promise<Example[]> {
  return exampleGenerator.generateAllExamples(examples);
}