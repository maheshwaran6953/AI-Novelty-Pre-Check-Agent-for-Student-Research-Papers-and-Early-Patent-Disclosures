import { Injectable } from '@nestjs/common';
import { PipelineContext } from '../pipeline.context';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingClient } from '../../clients/embedding.client';

@Injectable()
export class ScoreStage {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingClient: EmbeddingClient,
  ) {}

  async execute(context: PipelineContext): Promise<void> {
    const candidates = context.candidates || [];
    const claims = context.extractedClaims || [];

    if (candidates.length === 0 || claims.length === 0) {
      console.log(`[Job ${context.jobId}] No candidates or claims to score.`);
      return;
    }

    // 1. Prepare texts for embedding
    const claimTexts = claims.map(c => {
      const elements = c.technicalElements?.join(' ') || '';
      return `${c.problem || ''} ${c.method || ''} ${elements}`.replace(/\s+/g, ' ').trim();
    });

    const candidateTexts = candidates.map(c => {
      return `${c.title || ''} ${c.abstractSnippet || ''}`.replace(/\s+/g, ' ').trim();
    });

    // 2. Generate embeddings
    console.log(`[Job ${context.jobId}] Generating embeddings for ${claims.length} claims and ${candidates.length} candidates...`);
    
    // Depending on batch size limit of onnxruntime-node, we might need to chunk this if candidateTexts is > 100
    // But since we capped at 100, a single batch of 100 is perfectly fine for all-mpnet-base-v2
    const claimEmbeddings = await this.embeddingClient.embed(claimTexts);
    const candidateEmbeddings = await this.embeddingClient.embed(candidateTexts);

    // 3. Score and threshold
    context.scoredClaims = [];
    
    const SIM_THRESHOLD_RELATED = 0.60;
    const SIM_THRESHOLD_SIGNIFICANT = 0.80;
    const TOP_MATCHES_PER_CLAIM = 5;
    
    let allValidScores: number[] = [];
    let discardedCount = 0;

    for (let i = 0; i < claims.length; i++) {
      const claim = claims[i];
      const claimEmb = claimEmbeddings[i];
      const matches: { candidateId: string; cosineSimilarity: number; tier: 'significant_overlap' | 'related_work' }[] = [];

      for (let j = 0; j < candidates.length; j++) {
        const candidate = candidates[j];
        const candEmb = candidateEmbeddings[j];
        const score = this.cosineSimilarity(claimEmb, candEmb);

        if (score >= SIM_THRESHOLD_RELATED) {
          allValidScores.push(score);
          matches.push({
            candidateId: candidate.candidateId,
            cosineSimilarity: score,
            tier: score >= SIM_THRESHOLD_SIGNIFICANT ? 'significant_overlap' : 'related_work'
          });
        } else {
          discardedCount++;
        }
      }

      // Sort by score desc and take top matches
      matches.sort((a, b) => b.cosineSimilarity - a.cosineSimilarity);
      context.scoredClaims.push({
        claimId: claim.claimId,
        matches: matches.slice(0, TOP_MATCHES_PER_CLAIM)
      });
    }

    // 4. Log Distribution Stats
    if (allValidScores.length > 0) {
      const min = Math.min(...allValidScores).toFixed(3);
      const max = Math.max(...allValidScores).toFixed(3);
      const mean = (allValidScores.reduce((a, b) => a + b, 0) / allValidScores.length).toFixed(3);
      console.log(`[Job ${context.jobId}] Score Distribution (Above 0.60): Min=${min}, Max=${max}, Mean=${mean}`);
    } else {
      console.log(`[Job ${context.jobId}] No matches scored above the 0.60 threshold.`);
    }
    console.log(`[Job ${context.jobId}] Discarded ${discardedCount} (claim, candidate) pairs scoring below 0.60.`);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
