import { Module } from '@nestjs/common';
import { LlmClient } from './llm.client';
import { ArxivClient } from './arxiv.client';
import { SemanticScholarClient } from './semantic-scholar.client';
import { EmbeddingClient } from './embedding.client';

@Module({
  providers: [LlmClient, ArxivClient, SemanticScholarClient, EmbeddingClient],
  exports: [LlmClient, ArxivClient, SemanticScholarClient, EmbeddingClient],
})
export class ClientsModule {}
