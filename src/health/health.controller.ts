import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';

import { Roles } from '@lib/guards/roles.guard';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get()
  @ApiExcludeEndpoint()
  @HealthCheck({ swaggerDocumentation: false })
  async check(): Promise<HealthCheckResult> {
    return await this.health.check([]);
  }

  @Get('test')
  @Roles({
    roleIds: [1],
  })
  async test(): Promise<HealthCheckResult> {
    return await this.health.check([]);
  }
}
