import { Injectable } from '@nestjs/common';
import { PipelineContext } from './pipeline.context';
import { IngestStage } from './stages/ingest.stage';
import { ExtractStage } from './stages/extract.stage';
import { StubbedStages } from './stages/stubbed.stages';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineStage, JobStatus } from '@prisma/client';

@Injectable()
export class PipelineOrchestrator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ingestStage: IngestStage,
    private readonly extractStage: ExtractStage,
    private readonly stubbedStages: StubbedStages,
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
      await this.stubbedStages.planQueries(context);

      // 4. RETRIEVE
      await this.updateJobStage(jobId, PipelineStage.RETRIEVE, 'Retrieving candidate documents...');
      await this.stubbedStages.retrieve(context);

      // 5. FILTER_DEDUP
      await this.updateJobStage(jobId, PipelineStage.FILTER_DEDUP, 'Filtering and deduplicating...');
      await this.stubbedStages.filterDedup(context);

      // 6. SCORE
      await this.updateJobStage(jobId, PipelineStage.SCORE, 'Scoring novelty...');
      await this.stubbedStages.score(context);

      // 7. EXPLAIN
      await this.updateJobStage(jobId, PipelineStage.EXPLAIN, 'Generating explanations...');
      await this.stubbedStages.explain(context);

      // 8. DELIVER
      await this.updateJobStage(jobId, PipelineStage.DELIVER, 'Finalizing report...');
      await this.stubbedStages.deliver(context); // This marks the job as COMPLETED

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
