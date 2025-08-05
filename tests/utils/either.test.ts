import { 
  Either, 
  left, 
  right, 
  isLeft, 
  isRight, 
  map, 
  mapLeft, 
  chain, 
  chainAsync, 
  fold, 
  pipe,
  tryCatch,
  tryCatchAsync,
  getOrElse,
  orElse,
  fromNullable,
  sequence,
  traverse,
  Do,
  bind
} from '../../src/utils/either.js';

describe('Either Type Tests', () => {
  describe('Constructor Functions', () => {
    it('should create Left values', () => {
      const error = left('error');
      expect(isLeft(error)).toBe(true);
      expect(isRight(error)).toBe(false);
      expect(error._tag).toBe('Left');
      expect(error.left).toBe('error');
    });

    it('should create Right values', () => {
      const success = right(42);
      expect(isRight(success)).toBe(true);
      expect(isLeft(success)).toBe(false);
      expect(success._tag).toBe('Right');
      expect(success.right).toBe(42);
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify Left values', () => {
      const error = left('error');
      if (isLeft(error)) {
        expect(error.left).toBe('error');
      } else {
        fail('Should be Left');
      }
    });

    it('should correctly identify Right values', () => {
      const success = right(42);
      if (isRight(success)) {
        expect(success.right).toBe(42);
      } else {
        fail('Should be Right');
      }
    });
  });

  describe('Map Functions', () => {
    it('should map Right values', () => {
      const result = map((x: number) => x * 2)(right(21));
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe(42);
      }
    });

    it('should not map Left values', () => {
      const result = map((x: number) => x * 2)(left('error'));
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toBe('error');
      }
    });

    it('should map Left errors with mapLeft', () => {
      const result = mapLeft((err: string) => `Error: ${err}`)(left('test'));
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toBe('Error: test');
      }
    });

    it('should not map Right values with mapLeft', () => {
      const result = mapLeft((err: string) => `Error: ${err}`)(right(42));
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe(42);
      }
    });
  });

  describe('Chain Functions', () => {
    const divide = (divisor: number) => (dividend: number): Either<string, number> =>
      divisor === 0 ? left('Division by zero') : right(dividend / divisor);

    it('should chain Right values', () => {
      const result = chain(divide(2))(right(10));
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe(5);
      }
    });

    it('should not chain Left values', () => {
      const result = chain(divide(2))(left('error'));
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toBe('error');
      }
    });

    it('should handle chained failures', () => {
      const result = chain(divide(0))(right(10));
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toBe('Division by zero');
      }
    });
  });

  describe('Async Chain Functions', () => {
    const asyncDivide = (divisor: number) => async (dividend: number): Promise<Either<string, number>> =>
      divisor === 0 ? left('Division by zero') : right(dividend / divisor);

    it('should chain async Right values', async () => {
      const result = await chainAsync(asyncDivide(2))(right(10));
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe(5);
      }
    });

    it('should not chain async Left values', async () => {
      const result = await chainAsync(asyncDivide(2))(left('error'));
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toBe('error');
      }
    });

    it('should handle async chained failures', async () => {
      const result = await chainAsync(asyncDivide(0))(right(10));
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toBe('Division by zero');
      }
    });
  });

  describe('Fold Function', () => {
    it('should fold Left values', () => {
      const result = fold(
        (err: string) => `Error: ${err}`,
        (val: number) => `Success: ${val}`
      )(left('test'));
      expect(result).toBe('Error: test');
    });

    it('should fold Right values', () => {
      const result = fold(
        (err: string) => `Error: ${err}`,
        (val: number) => `Success: ${val}`
      )(right(42));
      expect(result).toBe('Success: 42');
    });
  });

  describe('Pipe Function', () => {
    it('should compose functions with pipe', () => {
      const add = (x: number) => (y: number) => x + y;
      const multiply = (x: number) => (y: number) => x * y;
      
      const result = pipe(
        add(5),
        multiply(2)
      )(10);
      
      expect(result).toBe(30); // (10 + 5) * 2
    });

    it('should work with single function', () => {
      const double = (x: number) => x * 2;
      const result = pipe(double)(21);
      expect(result).toBe(42);
    });
  });

  describe('Function Composition with Either', () => {
    const parseNumber = (str: string): Either<string, number> => {
      const num = parseFloat(str);
      return isNaN(num) ? left('Not a number') : right(num);
    };

    const isPositive = (num: number): Either<string, number> =>
      num > 0 ? right(num) : left('Not positive');

    const sqrt = (num: number): Either<string, number> =>
      right(Math.sqrt(num));

    it('should compose successful operations', () => {
      const result = pipe(
        parseNumber,
        chain(isPositive),
        chain(sqrt)
      )('16');

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe(4);
      }
    });

    it('should fail fast on first error', () => {
      const result = pipe(
        parseNumber,
        chain(isPositive),
        chain(sqrt)
      )('not-a-number');

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toBe('Not a number');
      }
    });

    it('should fail on intermediate error', () => {
      const result = pipe(
        parseNumber,
        chain(isPositive),
        chain(sqrt)
      )('-4');

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toBe('Not positive');
      }
    });
  });

  describe('TryCatch Functions', () => {
    it('should catch synchronous exceptions', () => {
      const throwingFn = () => {
        throw new Error('Something went wrong');
      };

      const result = tryCatch(throwingFn);
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.message).toBe('Something went wrong');
      }
    });

    it('should return Right for successful operations', () => {
      const safeFn = () => 42;
      const result = tryCatch(safeFn);
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe(42);
      }
    });

    it('should catch async exceptions', async () => {
      const throwingAsyncFn = async () => {
        throw new Error('Async error');
      };

      const result = await tryCatchAsync(throwingAsyncFn);
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left.message).toBe('Async error');
      }
    });

    it('should return Right for successful async operations', async () => {
      const safeAsyncFn = async () => 42;
      const result = await tryCatchAsync(safeAsyncFn);
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe(42);
      }
    });
  });

  describe('Utility Functions', () => {
    it('should get value or else', () => {
      expect(getOrElse(0)(right(42))).toBe(42);
      expect(getOrElse(0)(left('error'))).toBe(0);
    });

    it('should provide alternative Either', () => {
      const result1 = orElse(() => right(99))(right(42));
      expect(isRight(result1) && result1.right).toBe(42);

      const result2 = orElse(() => right(99))(left('error'));
      expect(isRight(result2) && result2.right).toBe(99);
    });

    it('should convert nullable values', () => {
      expect(isRight(fromNullable('not found')(42))).toBe(true);
      expect(isLeft(fromNullable('not found')(null))).toBe(true);
      expect(isLeft(fromNullable('not found')(undefined))).toBe(true);
    });
  });

  describe('Array Operations', () => {
    it('should sequence successful operations', () => {
      const values = [right(1), right(2), right(3)];
      const result = sequence(values);
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toEqual([1, 2, 3]);
      }
    });

    it('should fail on first error in sequence', () => {
      const values = [right(1), left('error'), right(3)];
      const result = sequence(values);
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toBe('error');
      }
    });

    it('should traverse with transformation', () => {
      const parseNum = (str: string): Either<string, number> => {
        const num = parseFloat(str);
        return isNaN(num) ? left('Not a number') : right(num);
      };

      const result = traverse(parseNum)(['1', '2', '3']);
      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toEqual([1, 2, 3]);
      }
    });

    it('should fail traverse on invalid input', () => {
      const parseNum = (str: string): Either<string, number> => {
        const num = parseFloat(str);
        return isNaN(num) ? left('Not a number') : right(num);
      };

      const result = traverse(parseNum)(['1', 'invalid', '3']);
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toBe('Not a number');
      }
    });
  });

  describe('Do Notation', () => {
    it('should build context with Do notation', () => {
      const result = pipe(
        bind('x', () => right(5)),
        bind('y', () => right(10)),
        map(({ x, y }) => x + y)
      )(Do);

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe(15);
      }
    });

    it('should fail early in Do notation', () => {
      const result = pipe(
        bind('x', () => right(5)),
        bind('y', () => left('error')),
        bind('z', () => right(20)),
        map(({ x, y, z }) => x + y + z)
      )(Do);

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toBe('error');
      }
    });

    it('should access previous values in Do notation', () => {
      const result = pipe(
        bind('x', () => right(5)),
        bind('y', ({ x }) => right(x * 2)),
        bind('z', ({ x, y }) => right(x + y)),
        map(({ x, y, z }) => ({ x, y, z }))
      )(Do);

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toEqual({ x: 5, y: 10, z: 15 });
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle deeply nested chains', () => {
      const add1 = (x: number): Either<string, number> => right(x + 1);
      
      let result: Either<string, number> = right(0);
      for (let i = 0; i < 100; i++) {
        result = chain(add1)(result);
      }

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe(100);
      }
    });

    it('should handle null and undefined in tryCatch', () => {
      const returnNull = () => null;
      const returnUndefined = () => undefined;

      expect(isRight(tryCatch(returnNull))).toBe(true);
      expect(isRight(tryCatch(returnUndefined))).toBe(true);
    });

    it('should preserve type information through transformations', () => {
      interface User {
        id: number;
        name: string;
      }

      const user: User = { id: 1, name: 'Alice' };
      const result = pipe(
        map((u: User) => ({ ...u, name: u.name.toUpperCase() })),
        chain((u: User) => u.id > 0 ? right(u) : left('Invalid ID'))
      )(right(user));

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.name).toBe('ALICE');
        expect(result.right.id).toBe(1);
      }
    });
  });
});