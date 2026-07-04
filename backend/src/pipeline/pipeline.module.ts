import { Module } from '@nestjs/common';
import { PipelineOrchestrator } from './pipeline.orchestrator';
import { IngestStage } from './stages/ingest.stage';
import { ExtractStage } from './stages/extract.stage';
import { PlanQueriesStage } from './stages/plan-queries.stage';
import { RetrieveStage } from './stages/retrieve.stage';
import { FilterDedupStage } from './stages/filter-dedup.stage';
import { ScoreStage } from './stages/score.stage';
import { ExplainStage } from './stages/explain.stage';
import { DeliverStage } from './stages/deliver.stage';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [PrismaModule, ClientsModule],
  providers: [
    PipelineOrchestrator, 
    IngestStage, 
    ExtractStage, 
    PlanQueriesStage,
    RetrieveStage,
    FilterDedupStage,
    ScoreStage,
    ExplainStage,
    DeliverStage
  ],
  exports: [PipelineOrchestrator],
})
export class PipelineModule {}
