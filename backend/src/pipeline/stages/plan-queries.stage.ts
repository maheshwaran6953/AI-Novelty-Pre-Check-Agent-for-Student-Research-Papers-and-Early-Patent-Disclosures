import { Injectable } from '@nestjs/common';
import { PipelineContext, PipelineQuery } from '../pipeline.context';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class PlanQueriesStage {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: PipelineContext): Promise<void> {
    if (!context.extractedClaims || context.extractedClaims.length === 0) {
      throw new Error('No claims extracted to plan queries.');
    }

    const queryMap = new Map<string, PipelineQuery>();

    for (const claim of context.extractedClaims) {
      // Build query string: problem + method + technical elements
      const elements = claim.technicalElements?.join(' ') || '';
      const rawQuery = `${claim.problem || ''} ${claim.method || ''} ${elements}`.trim();
      
      // Clean up multiple spaces
      const query = rawQuery.replace(/\s+/g, ' ');
      
      // Create hash to deduplicate
      const hash = createHash('sha256').update(query.toLowerCase()).digest('hex');
      
      if (queryMap.has(hash)) {
        const existing = queryMap.get(hash)!;
        existing.claimIds.push(claim.claimId);
      } else {
        queryMap.set(hash, {
          query,
          hash,
          claimIds: [claim.claimId]
        });
      }
    }

    context.queries = Array.from(queryMap.values());
  }
}
