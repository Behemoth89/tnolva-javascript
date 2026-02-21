/**
 * Logger Utility
 * Provides logging functionality for AI interactions
 * Logs to ai_interactions.log file
 */

import { appendFileSync, existsSync, mkdirSync } from 'node:fs';

// Log file path
const LOG_FILE = 'ai_interactions.log';

/**
 * Ensure log directory exists
 */
function ensureLogDir(): void {
  const logDir = '.';
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
}

/**
 * Format log message with timestamp
 */
function formatMessage(level: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
}

/**
 * Log an info message
 */
export function info(message: string): void {
  const formatted = formatMessage('INFO', message);
  ensureLogDir();
  try {
    appendFileSync(LOG_FILE, formatted);
  } catch {
    // Silently fail if logging fails
  }
  console.log(formatted.trim());
}

/**
 * Log a warning message
 */
export function warn(message: string): void {
  const formatted = formatMessage('WARN', message);
  ensureLogDir();
  try {
    appendFileSync(LOG_FILE, formatted);
  } catch {
    // Silently fail if logging fails
  }
  console.warn(formatted.trim());
}

/**
 * Log an error message
 */
export function error(message: string): void {
  const formatted = formatMessage('ERROR', message);
  ensureLogDir();
  try {
    appendFileSync(LOG_FILE, formatted);
  } catch {
    // Silently fail if logging fails
  }
  console.error(formatted.trim());
}

/**
 * Log a debug message
 */
export function debug(message: string): void {
  const formatted = formatMessage('DEBUG', message);
  ensureLogDir();
  try {
    appendFileSync(LOG_FILE, formatted);
  } catch {
    // Silently fail if logging fails
  }
  console.debug(formatted.trim());
}

export const logger = {
  info,
  warn,
  error,
  debug,
};
