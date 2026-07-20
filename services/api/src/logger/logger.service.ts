import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerService extends Logger {
  private logFile: string;
  private logDir: string = path.join(process.cwd(), 'logs');

  constructor() {
    super('FlyfreeAPI');
    this.ensureLogDir();
    this.logFile = path.join(this.logDir, 'server.log');
  }

  private ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeToFile(level: string, message: string, context?: string, stack?: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [${context || 'FlyfreeAPI'}] ${message}${
      stack ? '\n' + stack : ''
    }\n`;

    try {
      fs.appendFileSync(this.logFile, logMessage, 'utf-8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  log(message: string, context?: string) {
    super.log(message, context);
    this.writeToFile('LOG', message, context);
  }

  error(message: string, stack?: string, context?: string) {
    super.error(message, stack, context);
    this.writeToFile('ERROR', message, context, stack);
  }

  warn(message: string, context?: string) {
    super.warn(message, context);
    this.writeToFile('WARN', message, context);
  }

  debug(message: string, context?: string) {
    super.debug(message, context);
    this.writeToFile('DEBUG', message, context);
  }

  verbose(message: string, context?: string) {
    super.verbose(message, context);
    this.writeToFile('VERBOSE', message, context);
  }

  /**
   * Get server logs from file
   */
  getLogs(lines: number = 100): string {
    try {
      if (!fs.existsSync(this.logFile)) {
        return 'No logs available yet.';
      }

      const content = fs.readFileSync(this.logFile, 'utf-8');
      const logLines = content.split('\n').filter(line => line.trim());
      const recentLogs = logLines.slice(-lines).join('\n');

      return recentLogs || 'No logs available yet.';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `Error reading logs: ${message}`;
    }
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    try {
      if (fs.existsSync(this.logFile)) {
        fs.writeFileSync(this.logFile, '', 'utf-8');
        this.log('Logs cleared successfully');
      }
    } catch (error) {
      const stack = error instanceof Error ? error.stack : String(error);
      this.error('Failed to clear logs', stack);
    }
  }

  /**
   * Get log file path
   */
  getLogFilePath(): string {
    return this.logFile;
  }
}
