import { CandidateSource } from './candidate.interface';

export type OverlapTier = 'related_work' | 'significant_overlap';

export interface ReportMatch {
  claimId: string;
  candidateId: string;
  cosineSimilarity: number;
  tier: OverlapTier;
  explanation: string;
  title: string;
  source: CandidateSource | string;
  url: string;
}

export interface ClaimAnalysis {
  claimId: string;
  claimText: string;
  matches: ReportMatch[];
}

export interface FinalReport {
  disclaimer: string;
  documentSummary: string;
  truncationWarning: string | null;
  claimsAnalysis: ClaimAnalysis[];
  sourcesSearched: string[];
  sourcesSkipped: string[];
  generatedAt: string;
}
