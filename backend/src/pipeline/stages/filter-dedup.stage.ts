import { Injectable } from '@nestjs/common';
import { PipelineContext, CandidateDocument } from '../pipeline.context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FilterDedupStage {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: PipelineContext): Promise<void> {
    const candidates = context.candidates || [];
    const beforeCount = candidates.length;

    if (beforeCount === 0) {
      console.log(`[Job ${context.jobId}] No candidates to filter/dedup.`);
      return;
    }

    // 1. CROSS-SOURCE DEDUPLICATION
    const uniqueCandidates = new Map<string, CandidateDocument>();

    for (const c of candidates) {
      const normTitle = this.normalizeText(c.title);
      
      // Attempt to find ArXiv ID in Semantic Scholar metadata
      let arxivId = null;
      if (c.source === 'semantic_scholar' && c.rawMetadata?.externalIds?.ArXiv) {
        arxivId = c.rawMetadata.externalIds.ArXiv;
      } else if (c.source === 'arxiv') {
        arxivId = c.externalId;
      }

      // Key prefers arxivId over normalized title
      const dedupKey = arxivId ? `arxiv:${arxivId}` : `title:${normTitle}`;

      if (uniqueCandidates.has(dedupKey)) {
        const existing = uniqueCandidates.get(dedupKey)!;
        // Prefer the one with the longer abstract
        if (c.abstractSnippet.length > existing.abstractSnippet.length) {
          uniqueCandidates.set(dedupKey, c);
        }
      } else {
        uniqueCandidates.set(dedupKey, c);
      }
    }

    const dedupedList = Array.from(uniqueCandidates.values());

    // 2. CHEAP PRE-FILTER (Overlap Scoring)
    const queryElementsMap = new Map<string, string[]>();
    
    if (context.queries && context.extractedClaims) {
      for (const q of context.queries) {
        const elements = new Set<string>();
        const claimsForQuery = context.extractedClaims.filter((c: any) => q.claimIds.includes(c.claimId));
        
        for (const claim of claimsForQuery) {
          if (claim.technicalElements && Array.isArray(claim.technicalElements)) {
            claim.technicalElements.forEach((e: string) => {
              elements.add(this.normalizeText(e));
            });
          }
        }
        queryElementsMap.set(q.hash, Array.from(elements).filter(e => e.length > 0));
      }
    }

    const scoredCandidates = dedupedList.map(c => {
      let score = 0;
      if (c.queryHash && queryElementsMap.has(c.queryHash)) {
        const elements = queryElementsMap.get(c.queryHash)!;
        const textToSearch = this.normalizeText(`${c.title} ${c.abstractSnippet}`);
        
        for (const el of elements) {
          if (textToSearch.includes(el)) {
            score++;
          }
        }
      }
      return { candidate: c, score };
    });

    // 3. CAP TOTAL CANDIDATES
    // Sort descending by overlap score
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Keep up to 100 candidates
    const MAX_CANDIDATES = 100;
    
    // We are conservative. We only drop candidates if we exceed 100 or if they have absolutely 0 overlap 
    // and we are trying to trim down. The instructions say: "If in doubt, keep the candidate."
    // So we'll just slice the top 100.
    const finalCandidates = scoredCandidates
      .slice(0, MAX_CANDIDATES)
      .map(sc => sc.candidate);

    context.candidates = finalCandidates;

    console.log(`[Job ${context.jobId}] Filtering and deduplicating...`);
    console.log(`[Job ${context.jobId}]   -> ${beforeCount} candidates before dedup/filter`);
    console.log(`[Job ${context.jobId}]   -> ${dedupedList.length} after dedup`);
    console.log(`[Job ${context.jobId}]   -> ${finalCandidates.length} after overlap cap`);
  }

  private normalizeText(text: string): string {
    if (!text) return '';
    return text.toLowerCase().replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ').trim();
  }
}
