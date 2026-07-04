import { Injectable } from '@nestjs/common';
import { PipelineContext } from '../pipeline.context';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStatus } from '@prisma/client';

@Injectable()
export class StubbedStages {
  constructor(private readonly prisma: PrismaService) {}

  async extract(context: PipelineContext): Promise<void> {
    console.log(`[Job ${context.jobId}] extract stage: not yet implemented`);
  }

  async planQueries(context: PipelineContext): Promise<void> {
    console.log(`[Job ${context.jobId}] planQueries stage: not yet implemented`);
  }

  async retrieve(context: PipelineContext): Promise<void> {
    console.log(`[Job ${context.jobId}] retrieve stage: not yet implemented`);
  }

  async filterDedup(context: PipelineContext): Promise<void> {
    console.log(`[Job ${context.jobId}] filterDedup stage: not yet implemented`);
  }

  async score(context: PipelineContext): Promise<void> {
    console.log(`[Job ${context.jobId}] score stage: not yet implemented`);
  }

  async explain(context: PipelineContext): Promise<void> {
    console.log(`[Job ${context.jobId}] explain stage: not yet implemented`);
  }

  async deliver(context: PipelineContext): Promise<void> {
    console.log(`[Job ${context.jobId}] deliver stage: not yet implemented. Creating stub report.`);
    
    const placeholderReport = {
      disclaimer: "This is a placeholder report. Actual novelty check is not yet implemented.",
      documentSummary: "Extracted " + (context.extractedText?.length || 0) + " characters of text.",
      truncationWarning: null,
      claimsAnalysis: [],
      sourcesSearched: [],
      sourcesSkipped: [],
      generatedAt: new Date().toISOString()
    };

    await this.prisma.job.update({
      where: { id: context.jobId },
      data: {
        report: placeholderReport as any,
        status: JobStatus.COMPLETED,
        progressMessage: 'Report generated successfully.',
      },
    });
  }
}
