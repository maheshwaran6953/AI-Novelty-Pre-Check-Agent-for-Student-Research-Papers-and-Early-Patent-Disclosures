import { Controller, Get } from '@nestjs/common';
import { HealthService, HealthResponse } from './health.service';

@Controller('api/v1/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): Promise<HealthResponse> {
    return this.healthService.check();
  }
}
