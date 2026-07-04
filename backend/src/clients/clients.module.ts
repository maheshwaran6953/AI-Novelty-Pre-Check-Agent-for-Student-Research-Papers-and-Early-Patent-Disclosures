import { Module } from '@nestjs/common';
import { LlmClient } from './llm.client';
import { ArxivClient } from './arxiv.client';
import { SemanticScholarClient } from './semantic-scholar.client';

@Module({
  providers: [LlmClient, ArxivClient, SemanticScholarClient],
  exports: [LlmClient, ArxivClient, SemanticScholarClient],
})
export class ClientsModule {}
