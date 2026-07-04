import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthResponse {
  status: 'ok';
  db: 'connected';
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResponse> {
    try {
      await this.prisma.ping();
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        db: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
