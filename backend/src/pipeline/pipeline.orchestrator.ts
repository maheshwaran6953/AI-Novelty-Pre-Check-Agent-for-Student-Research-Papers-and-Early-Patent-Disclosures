import { Injectable } from '@nestjs/common';
import { PipelineContext } from './pipeline.context';
import { IngestStage } from './stages/ingest.stage';
import { ExtractStage } from './stages/extract.stage';
import { PlanQueriesStage } from './stages/plan-queries.stage';
import { RetrieveStage } from './stages/retrieve.stage';
import { FilterDedupStage } from './stages/filter-dedup.stage';
import { ScoreStage } from './stages/score.stage';
import { ExplainStage } from './stages/explain.stage';
import { DeliverStage } from './stages/deliver.stage';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineStage, JobStatus } from '@prisma/client';

@Injectable()
export class PipelineOrchestrator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ingestStage: IngestStage,
    private readonly extractStage: ExtractStage,
    private readonly planQueriesStage: PlanQueriesStage,
    private readonly retrieveStage: RetrieveStage,
    private readonly filterDedupStage: FilterDedupStage,
    private readonly scoreStage: ScoreStage,
    private readonly explainStage: ExplainStage,
    private readonly deliverStage: DeliverStage,
  ) {}

  async startPipeline(jobId: string, filePath: string) {
    const context: PipelineContext = { jobId, filePath };

    try {
      // 1. INGEST
      await this.updateJobStage(jobId, PipelineStage.INGEST, 'Extracting text from document...');
      await this.ingestStage.execute(context);

      // 2. EXTRACT
      await this.updateJobStage(jobId, PipelineStage.EXTRACT, 'Extracting technical claims...');
      await this.extractStage.execute(context);

      // 3. PLAN_QUERIES
      await this.updateJobStage(jobId, PipelineStage.PLAN_QUERIES, 'Planning search queries...');
      await this.planQueriesStage.execute(context);

      // 4. RETRIEVE
      await this.updateJobStage(jobId, PipelineStage.RETRIEVE, 'Searching arXiv and Semantic Scholar...');
      await this.retrieveStage.execute(context);

      // 5. FILTER_DEDUP
      await this.updateJobStage(jobId, PipelineStage.FILTER_DEDUP, 'Filtering and deduplicating...');
      await this.filterDedupStage.execute(context);

      // 6. SCORE
      await this.updateJobStage(jobId, PipelineStage.SCORE, 'Scoring similarity against retrieved candidates...');
      await this.scoreStage.execute(context);

      // 7. EXPLAIN
      await this.updateJobStage(jobId, PipelineStage.EXPLAIN, 'Generating explanations...');
      await this.explainStage.execute(context);

      // 8. DELIVER
      await this.deliverStage.execute(context);

    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  private async updateJobStage(jobId: string, stage: PipelineStage, progressMessage: string) {
    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        stage,
        progressMessage,
        status: JobStatus.RUNNING,
      },
    });
  }
}
