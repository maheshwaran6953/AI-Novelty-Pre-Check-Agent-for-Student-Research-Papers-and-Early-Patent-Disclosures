export interface PipelineContext {
  jobId: string;
  filePath: string;
  extractedText?: string;
  extractedClaims?: any[];
}
