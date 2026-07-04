import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PipelineModule } from '../pipeline/pipeline.module';

@Module({
  imports: [PrismaModule, PipelineModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
