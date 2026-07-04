import { Injectable } from '@nestjs/common';
import { PipelineContext } from '../pipeline.context';
import { LlmClient } from '../../clients/llm.client';
import { z } from 'zod';

@Injectable()
export class ExplainStage {
  constructor(private readonly llm: LlmClient) {}

  async execute(context: PipelineContext): Promise<void> {
    const claims = context.extractedClaims || [];
    const scoredClaims = context.scoredClaims || [];
    const candidates = context.candidates || [];

    if (claims.length === 0 || scoredClaims.length === 0) {
      console.log(`[Job ${context.jobId}] No scored claims to explain.`);
      return;
    }

    console.log(`[Job ${context.jobId}] Generating explanations for ${scoredClaims.length} claims sequentially to respect rate limits...`);

    // 1. Summarize document
    if (context.extractedText) {
      await this.generateSummary(context);
    }

    // 2. Explain Matches
    for (const sc of scoredClaims) {
      if (sc.matches.length > 0) {
        await this.explainClaimMatches(context, sc, claims, candidates);
        // Add a tiny delay between LLM calls just in case
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    console.log(`[Job ${context.jobId}] Explanations generated successfully.`);
  }

  private async generateSummary(context: PipelineContext): Promise<void> {
    const prompt = `You are an expert technical patent analyst. Summarize the following document into a single, concise paragraph (max 3-4 sentences) outlining its core invention or technical topic. Output valid JSON exactly matching this schema:
    { "summary": "string" }
    
    Document text:
    ${context.extractedText?.slice(0, 15000)} // safely trim if massive
    `;

    const schema = z.object({
      summary: z.string()
    });

    try {
      const result = await this.llm.generateJson(prompt, schema);
      context.documentSummary = result.summary;
    } catch (err) {
      console.error(`[Job ${context.jobId}] Failed to generate document summary`, err);
      context.documentSummary = "A technical document analyzed for novelty.";
    }
  }

  private async explainClaimMatches(
    context: PipelineContext,
    scoredClaim: any,
    allClaims: any[],
    allCandidates: any[]
  ): Promise<void> {
    const claimData = allClaims.find(c => c.claimId === scoredClaim.claimId);
    if (!claimData) return;

    const claimText = `${claimData.problem || ''} ${claimData.method || ''} ${claimData.technicalElements?.join(', ') || ''}`;
    
    const candidateContexts = scoredClaim.matches.map((m: any, i: number) => {
      const c = allCandidates.find(cand => cand.candidateId === m.candidateId);
      return `Candidate [ID: ${m.candidateId}]:
Title: ${c?.title}
Abstract: ${c?.abstractSnippet}
Score/Tier: ${m.cosineSimilarity.toFixed(3)} (${m.tier})`;
    }).join('\n\n');

    const prompt = `You are a technical analyst reviewing academic papers and patents.
I am providing you a core "Claim" extracted from an invention disclosure, followed by several retrieved "Candidates" (academic papers or patents) that have high semantic overlap with the claim.

For each candidate, write a 1-2 sentence explanation of WHY this candidate is relevant to the claim.
CRITICAL CALIBRATION INSTRUCTIONS:
- NEVER say "this is not novel", "already patented", or "this idea is already known".
- ALWAYS use neutral, analytical phrasing.
- GOOD: "This paper describes a related approach to..." or "This work explores a similar concept regarding..." or "This research investigates..."
- BAD: "This candidate proves the claim is not novel."

Output valid JSON exactly matching this schema:
{
  "explanations": [
    { "candidateId": "string", "explanation": "string" }
  ]
}

Claim:
${claimText}

Retrieved Candidates:
${candidateContexts}
`;

    const schema = z.object({
      explanations: z.array(z.object({
        candidateId: z.string(),
        explanation: z.string()
      }))
    });

    try {
      const result = await this.llm.generateJson(prompt, schema);
      // Map explanations back
      for (const match of scoredClaim.matches) {
        const exp = result.explanations.find((e: any) => e.candidateId === match.candidateId);
        if (exp) {
          match.explanation = exp.explanation;
        } else {
          match.explanation = "This document shares semantic overlap with the claim concepts.";
        }
      }
    } catch (err) {
      console.error(`[Job ${context.jobId}] Failed to generate explanations for claim ${scoredClaim.claimId}`, err);
      for (const match of scoredClaim.matches) {
        match.explanation = "Failed to generate explanation due to an LLM error.";
      }
    }
  }
}
