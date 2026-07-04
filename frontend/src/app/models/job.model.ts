export enum JobStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum PipelineStage {
  INGEST = 'INGEST',
  EXTRACT = 'EXTRACT',
  PLAN_QUERIES = 'PLAN_QUERIES',
  RETRIEVE = 'RETRIEVE',
  FILTER_DEDUP = 'FILTER_DEDUP',
  SCORE = 'SCORE',
  EXPLAIN = 'EXPLAIN',
  DELIVER = 'DELIVER'
}

export interface ScoredMatch {
  claimId: string;
  candidateId: string;
  similarityScore: number;
  tier: 'related_work' | 'significant_overlap';
  explanation: string;
  title: string;
  source: string;
  url: string;
}

export interface ClaimAnalysis {
  claimId: string;
  claimText: string;
  matches: ScoredMatch[];
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

export interface Job {
  jobId: string;
  status: JobStatus;
  stage: PipelineStage;
  progressMessage: string | null;
  originalFilename: string;
  errorMessage: string | null;
  report?: FinalReport | null;
  createdAt: string;
  completedAt?: string | null;
}
