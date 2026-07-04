export type CandidateSource = 'arxiv' | 'semantic_scholar' | 'google_patents';

export interface Candidate {
  candidateId: string;
  source: CandidateSource;
  externalId: string;
  title: string;
  abstractSnippet: string;
  url: string;
  rawMetadata?: Record<string, unknown>;
}
