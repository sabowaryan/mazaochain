import { MazaoChainError } from './MazaoChainError';
import { ErrorSeverity, ErrorContext } from './types';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: ErrorContext;
  error?: MazaoChainError;
  metadata?: Record<string, any>;
}

/**
 * Comprehensive logging system for MazaoChain
 * Handles error tracking, user activity, and system monitoring
 */
export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log debug information
   */
  debug(message: string, metadata?: Record<string, any>, context?: ErrorContext) {
    this.log(LogLevel.DEBUG, message, { metadata, context });
  }

  /**
   * Log general information
   */
  info(message: string, metadata?: Record<string, any>, context?: ErrorContext) {
    this.log(LogLevel.INFO, message, { metadata, context });
  }

  /**
   * Log warnings
   */
  warn(message: string, metadata?: Record<string, any>, context?: ErrorContext) {
    this.log(LogLevel.WARN, message, { metadata, context });
  }

  /**
   * Log errors
   */
  error(message: string, error?: MazaoChainError | Error, context?: ErrorContext) {
    const mazaoError = error instanceof MazaoChainError 
      ? error 
      : error instanceof Error 
        ? MazaoChainError.fromUnknown(error)
        : undefined;

    this.log(LogLevel.ERROR, message, { error: mazaoError, context });
    
    // Send critical errors to external monitoring
    if (mazaoError?.severity === ErrorSeverity.CRITICAL) {
      this.sendToExternalMonitoring(mazaoError, context);
    }
  }

  /**
   * Log fatal errors
   */
  fatal(message: string, error?: MazaoChainError | Error, context?: ErrorContext) {
    const mazaoError = error instanceof MazaoChainError 
      ? error 
      : error instanceof Error 
        ? MazaoChainError.fromUnknown(error)
        : undefined;

    this.log(LogLevel.FATAL, message, { error: mazaoError, context });
    this.sendToExternalMonitoring(mazaoError, context);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, options: {
    metadata?: Record<string, any>;
    error?: MazaoChainError;
    context?: ErrorContext;
  } = {}) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: options.context,
      error: options.error,
      metadata: options.metadata,
    };

    // Add to in-memory logs
    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(entry);
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(entry);
    }
  }

  /**
   * Console logging for development
   */
  private consoleLog(entry: LogEntry) {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.metadata);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, entry.error?.toJSON(), entry.metadata);
        break;
    }
  }

  /**
   * Send logs to external logging service (placeholder)
   */
  private async sendToLoggingService(entry: LogEntry) {
    try {
      // In a real implementation, this would send to services like:
      // - Supabase Edge Functions for logging
      // - External services like LogRocket, Sentry, etc.
      
      // For now, we'll store in Supabase if available
      if (typeof window !== 'undefined' && entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
        // Only log errors and fatal errors to reduce noise
        await this.storeInSupabase(entry);
      }
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  /**
   * Store error logs in Supabase
   */
  private async storeInSupabase(entry: LogEntry) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      await supabase.from('error_logs').insert({
        level: entry.level,
        message: entry.message,
        error_data: entry.error?.toJSON(),
        context: entry.context,
        metadata: entry.metadata,
        created_at: entry.timestamp.toISOString(),
      });
    } catch (error) {
      console.error('Failed to store log in Supabase:', error);
    }
  }

  /**
   * Send critical errors to external monitoring
   */
  private async sendToExternalMonitoring(error?: MazaoChainError, context?: ErrorContext) {
    try {
      // In production, integrate with monitoring services like:
      // - Sentry for error tracking
      // - DataDog for monitoring
      // - Custom webhook for alerts
      
      console.error('CRITICAL ERROR:', error?.toJSON(), context);
      
      // For now, we'll just ensure it's logged prominently
      if (process.env.NODE_ENV === 'production') {
        // Could send to webhook, email alert, etc.
      }
    } catch (monitoringError) {
      console.error('Failed to send to external monitoring:', monitoringError);
    }
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear logs (for testing)
   */
  clearLogs() {
    this.logs = [];
  }
}

// Export singleton instance
export const logger = Logger.getInstance();