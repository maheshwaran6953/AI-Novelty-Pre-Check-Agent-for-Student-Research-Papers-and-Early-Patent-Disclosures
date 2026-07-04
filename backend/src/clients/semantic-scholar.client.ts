import { Injectable } from '@nestjs/common';
import { CandidateDocument } from '../pipeline/pipeline.context';

@Injectable()
export class SemanticScholarClient {
  private lastRequestPromise: Promise<void> = Promise.resolve();
  private readonly delayMs = 1500;

  async search(query: string, limit: number = 10): Promise<CandidateDocument[]> {
    await this.lastRequestPromise;
    
    let resolveCurrent!: () => void;
    this.lastRequestPromise = new Promise(resolve => {
      resolveCurrent = resolve;
    });

    try {
      const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,abstract,url,externalIds`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const papers = data.data || [];
      
      return papers.map((paper: any) => ({
        candidateId: crypto.randomUUID(),
        source: 'semantic_scholar',
        externalId: paper.externalIds?.CorpusId?.toString() || paper.paperId,
        title: paper.title || 'No Title',
        abstractSnippet: paper.abstract || 'No Abstract',
        url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
        rawMetadata: paper,
      }));
    } finally {
      setTimeout(() => resolveCurrent(), this.delayMs);
    }
  }
}
