import { Module } from '@nestjs/common';
import { PipelineOrchestrator } from './pipeline.orchestrator';
import { IngestStage } from './stages/ingest.stage';
import { StubbedStages } from './stages/stubbed.stages';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PipelineOrchestrator, IngestStage, StubbedStages],
  exports: [PipelineOrchestrator],
})
export class PipelineModule {}
