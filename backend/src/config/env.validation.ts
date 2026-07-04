import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required().messages({
    'any.required':
      'DATABASE_URL is required. Copy .env.example to .env and start Postgres via docker compose up -d.',
  }),
  UPLOAD_DIR: Joi.string().default('./data/uploads'),
  MAX_PAGES: Joi.number().integer().min(1).default(15),
  MAX_TOKENS: Joi.number().integer().min(1).default(8000),
  SIM_THRESHOLD_RELATED: Joi.number().min(0).max(1).default(0.6),
  SIM_THRESHOLD_SIGNIFICANT: Joi.number().min(0).max(1).default(0.8),
  TOP_K_PER_QUERY: Joi.number().integer().min(1).default(10),
  TOP_MATCHES_PER_CLAIM: Joi.number().integer().min(1).default(5),
  ARXIV_RETRY_COUNT: Joi.number().integer().min(0).default(1),
  LLM_API_KEY: Joi.string().allow('').optional(),
  LLM_MODEL: Joi.string().allow('').optional(),
  EMBEDDING_MODEL: Joi.string().allow('').optional(),
  SERPAPI_KEY: Joi.string().allow('').optional(),
});
