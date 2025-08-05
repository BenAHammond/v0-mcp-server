/**
 * Console Logger Demo
 * 
 * Demonstrates various features of the console logger implementation
 */

import {
  createConsoleLogger,
  createSimpleConsoleLogger,
  createDevConsoleLogger,
  createProdConsoleLogger,
  createJsonFormatter,
  createCompactFormatter,
  LogLevel
} from '../../src/logging/index.js';

// Example 1: Basic console logger
console.log('\n=== Basic Console Logger ===');
const basicLogger = createSimpleConsoleLogger(LogLevel.INFO);
basicLogger.info('Application started');
basicLogger.debug('This debug message will not be shown (level too low)');
basicLogger.warn('This is a warning', { userId: 123, action: 'login' });
basicLogger.error('An error occurred', new Error('Connection failed'));

// Example 2: Development logger with all features
console.log('\n=== Development Logger ===');
const devLogger = createDevConsoleLogger();
devLogger.trace('Trace level message');
devLogger.debug('Debug message with data', { 
  config: { 
    port: 3000, 
    host: 'localhost',
    features: ['auth', 'api', 'websocket']
  } 
});

// Example 3: Child loggers with context
console.log('\n=== Child Loggers ===');
const appLogger = createConsoleLogger({
  type: 'console',
  level: LogLevel.INFO,
  useColors: true
});

const authLogger = appLogger
  .child({ source: { module: 'auth' } })
  .withTags('security');

const apiLogger = appLogger
  .child({ source: { module: 'api' } })
  .withCorrelationId('req-12345');

authLogger.info('User login attempt', { username: 'john.doe' });
apiLogger.info('API request received', { method: 'GET', path: '/users' });

// Example 4: Timing operations
console.log('\n=== Timing Operations ===');
const perfLogger = createSimpleConsoleLogger(LogLevel.DEBUG);

// Sync operation timing
const result = perfLogger.time('calculateSum', () => {
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += i;
  }
  return sum;
});
console.log(`Result: ${result}`);

// Async operation timing
async function simulateApiCall() {
  await perfLogger.timeAsync('apiCall', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { status: 'success' };
  });
}

// Example 5: Different formatters
console.log('\n=== Different Formatters ===');

// JSON formatter
const jsonLogger = createConsoleLogger({
  type: 'console',
  level: LogLevel.INFO,
  formatter: createJsonFormatter()
});
jsonLogger.info('JSON formatted log', { format: 'json', timestamp: true });

// Compact formatter
const compactLogger = createConsoleLogger({
  type: 'console',
  level: LogLevel.INFO,
  formatter: createCompactFormatter(true)
});
compactLogger.info('Compact log', { style: 'minimal' });

// Example 6: Production logger
console.log('\n=== Production Logger ===');
const prodLogger = createProdConsoleLogger();
prodLogger.info('Server started', { 
  environment: 'production',
  version: '1.0.0',
  pid: process.pid 
});
prodLogger.error('Database connection failed', new Error('ECONNREFUSED'), {
  host: 'db.example.com',
  port: 5432
});

// Example 7: Custom configuration
console.log('\n=== Custom Configuration ===');
const customLogger = createConsoleLogger({
  type: 'console',
  level: LogLevel.INFO,
  useColors: true,
  includeMilliseconds: true,
  relativeTime: true,
  prettyPrintOptions: {
    depth: 3,
    colors: true,
    compact: false,
    sorted: true
  }
});

customLogger.info('Starting process');
setTimeout(() => {
  customLogger.info('Process checkpoint', {
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
}, 100);

// Run async example
simulateApiCall().then(() => {
  console.log('\n=== Demo Complete ===');
});