import fs from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import path from 'node:path';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'debug' | 'warn';
  message: string;
  context?: any;
}

export class LogManager {
  private static instance: LogManager;
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;
  private readonly logFilePath = '/tmp/v0-mcp-debug.log';

  private constructor() {}

  static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }

  /**
   * Add a log entry to the in-memory buffer
   */
  addLog(level: LogEntry['level'], message: string, context?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Get recent logs from memory
   */
  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogEntry['level'], limit: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.level === level)
      .slice(-limit);
  }

  /**
   * Search logs by message content
   */
  searchLogs(query: string, limit: number = 100): LogEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.logs
      .filter(log => log.message.toLowerCase().includes(lowerQuery))
      .slice(-limit);
  }

  /**
   * Read logs from the debug file
   */
  async readDebugFile(lines: number = 100): Promise<string[]> {
    try {
      if (fs.existsSync(this.logFilePath)) {
        const content = await fsPromises.readFile(this.logFilePath, 'utf-8');
        const allLines = content.split('\n').filter(line => line.trim());
        return allLines.slice(-lines);
      }
      return ['Debug log file not found'];
    } catch (error) {
      return [`Error reading debug log: ${error instanceof Error ? error.message : String(error)}`];
    }
  }

  /**
   * Get a summary of current log state
   */
  getLogSummary(): {
    totalLogs: number;
    levels: Record<LogEntry['level'], number>;
    recentErrors: string[];
    debugFileExists: boolean;
  } {
    const levels: Record<LogEntry['level'], number> = {
      info: 0,
      error: 0,
      debug: 0,
      warn: 0
    };

    for (const log of this.logs) {
      levels[log.level]++;
    }

    const recentErrors = this.logs
      .filter(log => log.level === 'error')
      .slice(-5)
      .map(log => `${log.timestamp}: ${log.message}`);

    return {
      totalLogs: this.logs.length,
      levels,
      recentErrors,
      debugFileExists: fs.existsSync(this.logFilePath)
    };
  }

  /**
   * Clear in-memory logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

// Helper functions for easy logging
export const logManager = LogManager.getInstance();

function writeToDebugFile(message: string): void {
  try {
    const logLine = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync('/tmp/v0-mcp-debug.log', logLine);
  } catch (error) {
    // Silently fail if can't write to file
  }
}

export function logInfo(message: string, context?: any): void {
  logManager.addLog('info', message, context);
  const fullMessage = `[MCP] ${message}${context ? ' ' + JSON.stringify(context) : ''}`;
  console.error(fullMessage);
  writeToDebugFile(`INFO: ${message}${context ? ' ' + JSON.stringify(context) : ''}`);
}

export function logError(message: string, context?: any): void {
  logManager.addLog('error', message, context);
  const fullMessage = `[MCP] ERROR: ${message}${context ? ' ' + JSON.stringify(context) : ''}`;
  console.error(fullMessage);
  writeToDebugFile(`ERROR: ${message}${context ? ' ' + JSON.stringify(context) : ''}`);
}

export function logDebug(message: string, context?: any): void {
  logManager.addLog('debug', message, context);
  const fullMessage = `[MCP] DEBUG: ${message}${context ? ' ' + JSON.stringify(context) : ''}`;
  if (process.env.VERBOSE === 'true') {
    console.error(fullMessage);
  }
  writeToDebugFile(`DEBUG: ${message}${context ? ' ' + JSON.stringify(context) : ''}`);
}

export function logWarn(message: string, context?: any): void {
  logManager.addLog('warn', message, context);
  const fullMessage = `[MCP] WARN: ${message}${context ? ' ' + JSON.stringify(context) : ''}`;
  console.error(fullMessage);
  writeToDebugFile(`WARN: ${message}${context ? ' ' + JSON.stringify(context) : ''}`);
}