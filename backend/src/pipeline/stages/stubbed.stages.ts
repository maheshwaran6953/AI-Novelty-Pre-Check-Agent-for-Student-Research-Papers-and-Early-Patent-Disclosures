import { Injectable } from '@nestjs/common';
import { PipelineContext } from '../pipeline.context';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStatus } from '@prisma/client';

@Injectable()
export class StubbedStages {
  constructor(private readonly prisma: PrismaService) {}

  async filterDedup(context: PipelineContext): Promise<void> {
    console.log(`\n\n[Job ${context.jobId}] filterDedup stage: not yet implemented`);
    console.log(`[Job ${context.jobId}] --- PIPELINE STATE SUMMARY ---`);
    console.log(`[Job ${context.jobId}] Queries Planned: ${context.queries?.length || 0}`);
    context.queries?.forEach((q, i) => {
      console.log(`  Query ${i + 1}: ${q.query}`);
    });
    console.log(`[Job ${context.jobId}] Candidates Retrieved: ${context.candidates?.length || 0}`);
    
    // Sample first 3 candidates
    context.candidates?.slice(0, 3).forEach((c, i) => {
      console.log(`  Sample ${i + 1}: [${c.source}] ${c.title}`);
    });
    console.log(`\n\n`);
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
