/**
 * Tests for memoization utility
 */

import { jest } from '@jest/globals';
import { 
  memoize, 
  memoizeAsync, 
  Memoize, 
  CacheManager,
  type MemoizeOptions 
} from '../../src/utils/memoize.js';

describe('Memoization Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('memoize', () => {
    it('should cache function results', () => {
      let callCount = 0;
      const add = memoize((a: number, b: number) => {
        callCount++;
        return a + b;
      });

      expect(add(1, 2)).toBe(3);
      expect(add(1, 2)).toBe(3);
      expect(callCount).toBe(1);

      expect(add(2, 3)).toBe(5);
      expect(callCount).toBe(2);
    });

    it('should handle functions with different argument types', () => {
      let callCount = 0;
      const complex = memoize((obj: any, arr: any[], str: string) => {
        callCount++;
        return { obj, arr, str };
      });

      const obj = { a: 1 };
      const arr = [1, 2, 3];
      
      complex(obj, arr, 'test');
      complex(obj, arr, 'test');
      expect(callCount).toBe(1);
    });

    it('should respect maxSize option', () => {
      let callCount = 0;
      const fn = memoize(
        (n: number) => {
          callCount++;
          return n * 2;
        },
        { maxSize: 2 }
      );

      fn(1); // Cache: [1]
      fn(2); // Cache: [1, 2]
      fn(3); // Cache: [2, 3] - 1 evicted
      fn(1); // Cache: [3, 1] - recomputed

      expect(callCount).toBe(4);
    });

    it('should respect TTL option', async () => {
      let callCount = 0;
      const fn = memoize(
        (n: number) => {
          callCount++;
          return n * 2;
        },
        { ttl: 50 } // 50ms TTL
      );

      expect(fn(1)).toBe(2);
      expect(fn(1)).toBe(2);
      expect(callCount).toBe(1);

      await new Promise(resolve => setTimeout(resolve, 60));

      expect(fn(1)).toBe(2);
      expect(callCount).toBe(2);
    });

    it('should provide cache management methods', () => {
      const fn = memoize((a: number, b: number) => a + b);

      fn(1, 2);
      fn(3, 4);

      expect(fn.size()).toBe(2);
      expect(fn.has(1, 2)).toBe(true);
      expect(fn.has(5, 6)).toBe(false);

      fn.delete(1, 2);
      expect(fn.size()).toBe(1);
      expect(fn.has(1, 2)).toBe(false);

      fn.clear();
      expect(fn.size()).toBe(0);
    });

    it('should collect statistics when enabled', () => {
      const fn = memoize(
        (n: number) => n * 2,
        { stats: true }
      );

      fn(1); // miss
      fn(1); // hit
      fn(2); // miss
      fn(1); // hit

      const stats = fn.stats();
      expect(stats).toEqual({
        hits: 2,
        misses: 2,
        evictions: 0,
        size: 2,
        hitRate: 0.5
      });
    });

    it('should use WeakMap for object arguments', () => {
      const fn = memoize(
        (obj: object) => ({ ...obj, processed: true }),
        { weakMap: true }
      );

      const obj1 = { a: 1 };
      const obj2 = { b: 2 };

      const result1 = fn(obj1);
      const result2 = fn(obj1);

      expect(result1).toBe(result2);
      expect(fn.has(obj1)).toBe(true);
      expect(fn.has(obj2)).toBe(false);

      // WeakMap limitations
      expect(() => fn.clear()).toThrow();
      expect(() => fn.size()).toThrow();
      expect(() => fn.entries()).toThrow();
    });

    it('should preserve function context (this)', () => {
      const obj = {
        value: 10,
        getValue: memoize(function(this: any, multiplier: number) {
          return this.value * multiplier;
        })
      };

      expect(obj.getValue(2)).toBe(20);
      expect(obj.getValue(2)).toBe(20);
    });

    it('should use custom key serializer', () => {
      let serializerCalls = 0;
      const customSerializer = (args: unknown[]) => {
        serializerCalls++;
        return args.map(arg => String(arg)).join('|');
      };

      const fn = memoize(
        (a: number, b: number) => a + b,
        { keySerializer: customSerializer }
      );

      fn(1, 2);
      fn(1, 2);
      expect(serializerCalls).toBe(3); // 2 calls + 1 for has() check
    });
  });

  describe('memoizeAsync', () => {
    it('should cache async function results', async () => {
      let callCount = 0;
      const fetchData = memoizeAsync(async (id: string) => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 10));
        return { id, data: `data-${id}` };
      });

      const result1 = await fetchData('123');
      const result2 = await fetchData('123');

      expect(result1).toBe(result2);
      expect(callCount).toBe(1);
    });

    it('should handle concurrent calls', async () => {
      let callCount = 0;
      const slowFetch = memoizeAsync(async (id: string) => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return { id };
      });

      // Start two concurrent calls
      const promise1 = slowFetch('123');
      const promise2 = slowFetch('123');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe(result2);
      expect(callCount).toBe(1); // Should only call once
    });

    it('should not cache rejected promises', async () => {
      let callCount = 0;
      const failingFn = memoizeAsync(async (shouldFail: boolean) => {
        callCount++;
        if (shouldFail) {
          throw new Error('Failed');
        }
        return 'success';
      });

      await expect(failingFn(true)).rejects.toThrow('Failed');
      await expect(failingFn(true)).rejects.toThrow('Failed');
      expect(callCount).toBe(2); // Should be called twice

      const result = await failingFn(false);
      expect(result).toBe('success');
      expect(callCount).toBe(3);
    });

    it('should support refresh method', async () => {
      let callCount = 0;
      let returnValue = 1;
      
      const fn = memoizeAsync(async () => {
        callCount++;
        return returnValue++;
      });

      expect(await fn()).toBe(1);
      expect(await fn()).toBe(1); // Cached
      expect(callCount).toBe(1);

      expect(await fn.refresh()).toBe(2); // Force refresh
      expect(callCount).toBe(2);
      expect(await fn()).toBe(2); // New cached value
    });

    it('should handle TTL for async functions', async () => {
      let callCount = 0;
      const fn = memoizeAsync(
        async (n: number) => {
          callCount++;
          return n * 2;
        },
        { ttl: 50 }
      );

      expect(await fn(1)).toBe(2);
      expect(callCount).toBe(1);

      await new Promise(resolve => setTimeout(resolve, 60));

      expect(await fn(1)).toBe(2);
      expect(callCount).toBe(2);
    });
  });

  describe('Memoize decorator', () => {
    it('should memoize class methods', () => {
      let fibCalls = 0;
      let factCalls = 0;

      class Calculator {
        @Memoize({ maxSize: 10 })
        fibonacci(n: number): number {
          fibCalls++;
          if (n <= 1) return n;
          return this.fibonacci(n - 1) + this.fibonacci(n - 2);
        }

        @Memoize({ stats: true })
        factorial(n: number): number {
          factCalls++;
          if (n <= 1) return 1;
          return n * this.factorial(n - 1);
        }
      }

      const calc = new Calculator();

      // Fibonacci should use memoization
      calc.fibonacci(10);
      expect(fibCalls).toBe(11); // Only 11 unique calls for fib(10)

      // Factorial should use memoization
      calc.factorial(5);
      expect(factCalls).toBe(5); // 5, 4, 3, 2, 1

      calc.factorial(6);
      expect(factCalls).toBe(6); // Only one more call for 6
    });

    it('should memoize async class methods', async () => {
      let callCount = 0;

      class DataService {
        @Memoize({ ttl: 1000 })
        async fetchData(id: string): Promise<any> {
          callCount++;
          await new Promise(resolve => setTimeout(resolve, 10));
          return { id, timestamp: Date.now() };
        }
      }

      const service = new DataService();

      const result1 = await service.fetchData('123');
      const result2 = await service.fetchData('123');

      expect(result1).toBe(result2);
      expect(callCount).toBe(1);
    });
  });

  describe('CacheManager', () => {
    beforeEach(() => {
      // Clear any registered caches
      CacheManager.clearAll();
    });

    it('should manage multiple caches', () => {
      const fn1 = memoize((n: number) => n * 2, { stats: true });
      const fn2 = memoize((n: number) => n * 3, { stats: true });

      CacheManager.register('double', fn1);
      CacheManager.register('triple', fn2);

      expect(CacheManager.getCacheNames()).toEqual(['double', 'triple']);

      fn1(5);
      fn2(5);

      const stats = CacheManager.getStats();
      expect(stats.get('double')?.misses).toBe(1);
      expect(stats.get('triple')?.misses).toBe(1);

      CacheManager.clearAll();
      expect(fn1.size()).toBe(0);
      expect(fn2.size()).toBe(0);
    });

    it('should unregister caches', () => {
      const fn = memoize((n: number) => n * 2);
      
      CacheManager.register('test', fn);
      expect(CacheManager.getCacheNames()).toContain('test');

      CacheManager.unregister('test');
      expect(CacheManager.getCacheNames()).not.toContain('test');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle circular references in arguments', () => {
      const fn = memoize((obj: any) => obj.value);

      const circular: any = { value: 42 };
      circular.self = circular;

      expect(fn(circular)).toBe(42);
      expect(fn(circular)).toBe(42); // Should work with fallback serializer
    });

    it('should handle null and undefined arguments', () => {
      const fn = memoize((a: any, b: any) => `${a}-${b}`);

      expect(fn(null, undefined)).toBe('null-undefined');
      expect(fn(undefined, null)).toBe('undefined-null');
      expect(fn(null, null)).toBe('null-null');
    });

    it('should throw error for WeakMap with non-object keys', () => {
      const fn = memoize(
        (n: number) => n * 2,
        { weakMap: true }
      );

      expect(() => fn(42)).toThrow('WeakMap memoization requires first argument to be an object');
    });

    it('should provide debug information', () => {
      const named = memoize(function myFunction(n: number) { return n; });
      const anonymous = memoize((n: number) => n);

      expect(named.name).toBe('memoized(myFunction)');
      expect(anonymous.name).toBe('memoized(anonymous)');
    });

    it('should handle large cache sizes efficiently', () => {
      const fn = memoize(
        (n: number) => n * 2,
        { maxSize: 1000, stats: true }
      );

      // Fill cache
      for (let i = 0; i < 1500; i++) {
        fn(i);
      }

      const stats = fn.stats();
      expect(stats?.size).toBe(1000);
      expect(stats?.evictions).toBe(500);
    });
  });
});

describe('Performance characteristics', () => {
  it('should demonstrate performance improvement', () => {
    // Fibonacci without memoization
    let unmemoizedCalls = 0;
    const fibUnmemoized = (n: number): number => {
      unmemoizedCalls++;
      if (n <= 1) return n;
      return fibUnmemoized(n - 1) + fibUnmemoized(n - 2);
    };

    // Fibonacci with memoization
    let memoizedCalls = 0;
    const fibMemoized = memoize((n: number): number => {
      memoizedCalls++;
      if (n <= 1) return n;
      return fibMemoized(n - 1) + fibMemoized(n - 2);
    });

    const n = 20;
    
    const unmemoizedResult = fibUnmemoized(n);
    const memoizedResult = fibMemoized(n);

    expect(unmemoizedResult).toBe(memoizedResult);
    expect(unmemoizedCalls).toBeGreaterThan(10000);
    expect(memoizedCalls).toBe(n + 1);
  });
});