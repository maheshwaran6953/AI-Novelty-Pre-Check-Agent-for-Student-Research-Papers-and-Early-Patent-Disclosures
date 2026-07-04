export interface CandidateDocument {
  candidateId: string;
  source: 'arxiv' | 'semantic_scholar' | 'google_patents';
  externalId: string;
  title: string;
  abstractSnippet: string;
  url: string;
  rawMetadata: any;
  queryHash?: string;
}

export interface PipelineQuery {
  query: string;
  hash: string;
  claimIds: string[];
}

export interface ClaimMatch {
  candidateId: string;
  cosineSimilarity: number;
  tier: 'significant_overlap' | 'related_work';
  explanation?: string;
}

export interface ClaimScoring {
  claimId: string;
  matches: ClaimMatch[];
}

export interface PipelineContext {
  jobId: string;
  filePath: string;
  extractedText?: string;
  extractedClaims?: any[];
  queries?: PipelineQuery[];
  candidates?: CandidateDocument[];
  scoredClaims?: ClaimScoring[];
  documentSummary?: string;
}
