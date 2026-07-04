import { Injectable } from '@nestjs/common';
import { PipelineContext, CandidateDocument } from '../pipeline.context';
import { PrismaService } from '../../prisma/prisma.service';
import { ArxivClient } from '../../clients/arxiv.client';
import { SemanticScholarClient } from '../../clients/semantic-scholar.client';

@Injectable()
export class RetrieveStage {
  constructor(
    private readonly prisma: PrismaService,
    private readonly arxivClient: ArxivClient,
    private readonly semanticScholarClient: SemanticScholarClient,
  ) {}

  async execute(context: PipelineContext): Promise<void> {
    if (!context.queries || context.queries.length === 0) {
      throw new Error('No queries to retrieve.');
    }

    const candidates: CandidateDocument[] = [];
    const sessionCache = new Map<string, CandidateDocument[]>();
    const sourcesSkipped = new Set<string>();

    for (const pq of context.queries) {
      const arxivPromise = this.fetchWithRetry('arxiv', pq.query, pq.hash, sessionCache, async (q) => {
        return this.arxivClient.search(q);
      });
      
      const ssPromise = this.fetchWithRetry('semantic_scholar', pq.query, pq.hash, sessionCache, async (q) => {
        return this.semanticScholarClient.search(q);
      });

      const results = await Promise.allSettled([arxivPromise, ssPromise]);

      // Handle arXiv result
      if (results[0].status === 'fulfilled') {
        candidates.push(...results[0].value);
      } else {
        sourcesSkipped.add('arxiv');
        console.error(`[Job ${context.jobId}] ArXiv completely failed for query ${pq.hash}`, results[0].reason);
      }

      // Handle Semantic Scholar result
      if (results[1].status === 'fulfilled') {
        candidates.push(...results[1].value);
      } else {
        sourcesSkipped.add('semantic_scholar');
        console.error(`[Job ${context.jobId}] Semantic Scholar completely failed for query ${pq.hash}`, results[1].reason);
      }
    }

    context.candidates = candidates;
    
    // NOTE: sourcesSkipped will be compiled into the final report during the Deliver stage.
  }

  private async fetchWithRetry(
    source: string, 
    query: string, 
    queryHash: string, 
    cache: Map<string, CandidateDocument[]>, 
    fetchFn: (q: string) => Promise<CandidateDocument[]>
  ): Promise<CandidateDocument[]> {
    const cacheKey = `${source}:${queryHash}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
      try {
        const results = await fetchFn(query);
        // Tag with queryHash for traceability
        const taggedResults = results.map(r => ({ ...r, queryHash }));
        cache.set(cacheKey, taggedResults);
        return taggedResults;
      } catch (error) {
        attempt++;
        if (attempt >= maxAttempts) {
          throw error;
        }
        // Wait 2 seconds before retry
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    return []; // Should not reach here
  }
}
