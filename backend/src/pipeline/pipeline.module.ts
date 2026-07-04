import { Module } from '@nestjs/common';
import { PipelineOrchestrator } from './pipeline.orchestrator';
import { IngestStage } from './stages/ingest.stage';
import { ExtractStage } from './stages/extract.stage';
import { StubbedStages } from './stages/stubbed.stages';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [PrismaModule, ClientsModule],
  providers: [PipelineOrchestrator, IngestStage, ExtractStage, StubbedStages],
  exports: [PipelineOrchestrator],
})
export class PipelineModule {}
