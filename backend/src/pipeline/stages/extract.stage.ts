import { Injectable } from '@nestjs/common';
import { PipelineContext } from '../pipeline.context';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmClient } from '../../clients/llm.client';
import { z } from 'zod';

const ClaimSchema = z.object({
  claimId: z.string(),
  text: z.string(),
  technicalElements: z.array(z.string()),
  problem: z.string(),
  method: z.string(),
});

const ClaimsResponseSchema = z.object({
  claims: z.array(ClaimSchema).max(10),
});

@Injectable()
export class ExtractStage {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmClient: LlmClient,
  ) {}

  async execute(context: PipelineContext): Promise<void> {
    if (!context.extractedText) {
      throw new Error('No extracted text available for claim extraction.');
    }

    const basePrompt = `
You are an expert technical patent analyst and academic reviewer.
Extract up to 10 core technical claims from the following text. 
Focus strictly on what is asserted as new/technical, not background or related-work sections.
The document may be a research paper or an early patent disclosure.
Output strictly in English, and in JSON format matching the following schema exactly:
{
  "claims": [
    {
      "claimId": "string (e.g. claim-1)",
      "text": "string (the full text of the claim)",
      "technicalElements": ["string", "short phrases"],
      "problem": "string (1 sentence describing the problem solved)",
      "method": "string (1 sentence describing the method used)"
    }
  ]
}

Document Text:
${context.extractedText}
    `.trim();

    let extractedClaims;
    
    try {
      // First attempt
      const response = await this.llmClient.generateJson(basePrompt, ClaimsResponseSchema);
      extractedClaims = response.claims;
    } catch (error) {
      // Retry once on failure (Zod validation or JSON parse error)
      const followUpPrompt = `
${basePrompt}

WARNING: Your previous response failed JSON validation with the following error:
${(error as Error).message}

Please fix the error and resend exactly in the requested JSON schema.
      `.trim();
      
      try {
        const retryResponse = await this.llmClient.generateJson(followUpPrompt, ClaimsResponseSchema);
        extractedClaims = retryResponse.claims;
      } catch (retryError) {
        throw new Error(`Failed to extract claims after retry. Last error: ${(retryError as Error).message}`);
      }
    }

    // Update the DB
    await this.prisma.job.update({
      where: { id: context.jobId },
      data: {
        claims: extractedClaims as any,
      },
    });

    // Make available in context for later stages
    context.extractedClaims = extractedClaims;
  }
}
