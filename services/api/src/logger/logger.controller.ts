import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { LoggerService } from './logger.service';

@ApiTags('📊 Admin Logs')
@Controller('admin/logs')
export class LoggerController {
  constructor(private readonly loggerService: LoggerService) {}

  /**
   * Get server logs
   */
  @Get()
  @ApiQuery({ name: 'lines', type: Number, required: false, description: 'Number of recent log lines to return' })
  getLogs(@Query('lines') lines?: string) {
    const lineCount = lines ? parseInt(lines) : 100;
    const logs = this.loggerService.getLogs(Math.min(lineCount, 1000));

    return {
      timestamp: new Date().toISOString(),
      logFile: this.loggerService.getLogFilePath(),
      lines: lineCount,
      logs,
    };
  }

  /**
   * Clear server logs (use with caution)
   */
  @Post('clear')
  clearLogs() {
    this.loggerService.clearLogs();
    return {
      message: 'Logs cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get log file status
   */
  @Get('status')
  getLogStatus() {
    return {
      logFile: this.loggerService.getLogFilePath(),
      timestamp: new Date().toISOString(),
      status: 'active',
    };
  }
}
