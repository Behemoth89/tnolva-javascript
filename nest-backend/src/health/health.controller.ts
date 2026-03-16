import { Controller, Get, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('health')
@Controller({
  version: '1',
  path: 'health',
})
export class HealthController {
  constructor(private dataSource: DataSource) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check',
    description: 'Check application and database health',
  })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  @ApiResponse({ status: 503, description: 'Application is unhealthy' })
  async check() {
    let dbStatus = 'unhealthy';

    try {
      // Check if database connection is initialized
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        dbStatus = 'healthy';
      }
    } catch {
      dbStatus = 'unhealthy';
    }

    const isHealthy = dbStatus === 'healthy';
    const status = isHealthy ? 'ok' : 'error';

    return {
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
      },
    };
  }
}
