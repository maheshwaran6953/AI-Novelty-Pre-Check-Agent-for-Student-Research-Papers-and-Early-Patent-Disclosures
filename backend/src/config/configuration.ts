export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  uploadDir: process.env.UPLOAD_DIR ?? './data/uploads',
  maxPages: parseInt(process.env.MAX_PAGES ?? '15', 10),
  maxTokens: parseInt(process.env.MAX_TOKENS ?? '8000', 10),
  simThresholdRelated: parseFloat(process.env.SIM_THRESHOLD_RELATED ?? '0.60'),
  simThresholdSignificant: parseFloat(
    process.env.SIM_THRESHOLD_SIGNIFICANT ?? '0.80',
  ),
  topKPerQuery: parseInt(process.env.TOP_K_PER_QUERY ?? '10', 10),
  topMatchesPerClaim: parseInt(process.env.TOP_MATCHES_PER_CLAIM ?? '5', 10),
  arxivRetryCount: parseInt(process.env.ARXIV_RETRY_COUNT ?? '1', 10),
  llmApiKey: process.env.LLM_API_KEY,
  llmModel: process.env.LLM_MODEL,
  embeddingModel: process.env.EMBEDDING_MODEL,
  serpApiKey: process.env.SERPAPI_KEY,
});
