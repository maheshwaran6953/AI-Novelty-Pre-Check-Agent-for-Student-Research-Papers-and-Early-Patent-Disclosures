# Novelty Pre-Check Agent — Architecture (v1)

Stack: **Angular + NestJS + PostgreSQL (Docker) + Prisma**. Locked pipeline, retrieval, and scoring decisions are documented in project briefs; this file covers system structure only.

## Tech stack

| Layer | Choice | Rationale |
|--------|--------|-----------|
| Frontend | Angular 19+ (standalone components) | Required; pairs naturally with NestJS patterns |
| Backend | **Node.js + NestJS (TypeScript)** | Single language with Angular; module/service/DI structure mirrors Angular |
| ORM | **Prisma** | Schema-first, generated types, simple migrations — faster to scaffold correctly in one week than TypeORM |
| Database | **PostgreSQL 16** via Docker Compose (Port 5433) | One-command local setup; production-ready vs SQLite |
| Embeddings storage | **Application-level cosine similarity** | No pgvector in v1 — see recommendation below |
| Job execution | In-process background tasks (`@nestjs/bull` optional later; start with `EventEmitter` + async service) | Single-user demo; no Redis required initially |
| File storage | Local `./data/uploads/` | Path stored in DB |
| PDF parsing | `pdf-parse` or `pdfjs-dist` | Text extraction with page boundaries |
| HTTP client | `@nestjs/axios` / `axios` | arXiv + Semantic Scholar |
| LLM / embeddings | Single cloud provider (direct client, no multi-provider abstraction) | Extraction + explanation only |

### pgvector recommendation

**Do not enable pgvector for v1.** Each job scores a handful of claims against at most ~100 deduplicated candidates — hundreds of cosine similarities total, computed in memory in milliseconds. Application-level cosine on embedding arrays is simpler, avoids extension setup, and matches the locked “embeddings + cosine only” scoring stage. Persist final matches and report JSON in Postgres; optionally store embedding vectors as `Json` columns for debugging, not for vector search.

Revisit pgvector only if you add cross-job semantic search or scale to thousands of candidates per run.

## Repository layout

```
AI-Novelty-Pre-Check-Agent/
├── docker-compose.yml          # Postgres only (backend runs on host for dev)
├── .env.example
├── docs/
│   ├── ARCHITECTURE.md
│   └── FUTURE_WORK.md          # Google Patents, PDF export, pgvector, retention policy
├── frontend/                   # Angular app
│   └── src/app/
│       ├── pages/
│       │   ├── upload/
│       │   ├── job-status/
│       │   ├── report/
│       │   └── history/
│       ├── services/
│       │   └── job.service.ts
│       └── models/
│           └── report.model.ts
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/
│   │   │   └── configuration.ts
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── jobs/
│   │   │   ├── jobs.module.ts
│   │   │   ├── jobs.controller.ts
│   │   │   ├── jobs.service.ts
│   │   │   └── dto/
│   │   ├── pipeline/
│   │   │   ├── pipeline.module.ts
│   │   │   ├── pipeline.orchestrator.ts
│   │   │   ├── pipeline.context.ts
│   │   │   └── stages/
│   │   │       ├── ingest.stage.ts
│   │   │       ├── extract.stage.ts
│   │   │       ├── plan-queries.stage.ts
│   │   │       ├── retrieve.stage.ts
│   │   │       ├── filter-dedup.stage.ts
│   │   │       ├── score.stage.ts
│   │   │       ├── explain.stage.ts
│   │   │       └── deliver.stage.ts
│   │   ├── clients/
│   │   │   ├── llm.client.ts
│   │   │   ├── embeddings.client.ts
│   │   │   ├── arxiv.client.ts
│   │   │   └── semantic-scholar.client.ts
│   │   ├── common/
│   │   │   ├── constants/
│   │   │   │   └── disclaimer.constant.ts
│   │   │   ├── interfaces/
│   │   │   │   ├── claim.interface.ts
│   │   │   │   ├── candidate.interface.ts
│   │   │   │   └── report.interface.ts
│   │   │   └── utils/
│   │   │       └── cosine-similarity.util.ts
│   │   └── cache/
│   │       └── query-cache.service.ts
│   ├── data/                   # gitignored uploads
│   ├── package.json
│   ├── nest-cli.json
│   └── tsconfig.json
└── README.md
```

## Docker Compose

Postgres only for v1 dev workflow (backend and Angular run on host):

```bash
docker compose up -d
cp .env.example .env
cd backend && npx prisma migrate dev
```

See root `docker-compose.yml`. Optional future addition: `backend` service in Compose once Dockerfile exists — not required for week-one demo.

## Data models (Prisma / TypeScript)

API JSON uses **camelCase** (NestJS convention). Prisma models map to snake_case columns where useful.

### Enums

- `JobStatus`: `QUEUED` | `RUNNING` | `COMPLETED` | `FAILED`
- `PipelineStage`: `INGEST` | `EXTRACT` | `PLAN_QUERIES` | `RETRIEVE` | `FILTER_DEDUP` | `SCORE` | `EXPLAIN` | `DELIVER`

### Claim (JSON in `Job.claims`, TypeScript interface)

```typescript
interface Claim {
  claimId: string;
  text: string;
  technicalElements: string[];
  problem: string;
  method: string;
}
```

### Candidate (pipeline context + optional debug JSON)

```typescript
interface Candidate {
  candidateId: string;
  source: 'arxiv' | 'semantic_scholar' | 'google_patents';
  externalId: string;
  title: string;
  abstractSnippet: string;
  url: string;
  rawMetadata?: Record<string, unknown>;
}
```

### Scored match (inside report JSON)

```typescript
interface ScoredMatch {
  claimId: string;
  candidateId: string;
  cosineSimilarity: number;
  tier: 'related_work' | 'significant_overlap';
  explanation: string;
  title: string;
  source: string;
  url: string;
}
```

### Job (Prisma `Job` table)

| Field | Type | Notes |
|--------|------|--------|
| `id` | `String @id @default(uuid())` | `jobId` in API |
| `status` | `JobStatus` | |
| `stage` | `PipelineStage` | |
| `progressMessage` | `String?` | |
| `originalFilename` | `String` | |
| `uploadPath` | `String` | Local file path |
| `inputTruncated` | `Boolean @default(false)` | |
| `truncationNote` | `String?` | |
| `errorMessage` | `String?` | |
| `claims` | `Json?` | `Claim[]` after extract |
| `report` | `Json?` | Final report object |
| `sourcesSearched` | `String[]` | |
| `sourcesSkipped` | `String[]` | |
| `createdAt` | `DateTime` | |
| `completedAt` | `DateTime?` | |

### Final report (JSON in `Job.report`)

```typescript
interface FinalReport {
  disclaimer: string;
  documentSummary: string;
  truncationWarning: string | null;
  claimsAnalysis: Array<{
    claimId: string;
    claimText: string;
    matches: ScoredMatch[];
  }>;
  sourcesSearched: string[];
  sourcesSkipped: string[];
  generatedAt: string;
}
```

## API (unchanged)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/jobs` | Upload → `{ jobId, status }` |
| `GET` | `/api/v1/jobs/:id` | Poll status |
| `GET` | `/api/v1/jobs/:id/report` | Report when completed |
| `GET` | `/api/v1/jobs` | History list |
| `GET` | `/api/v1/health` | Liveness |

## Pipeline stages

Eight stages (locked): Ingest → Extract → Plan Queries → Retrieve → Filter/Dedup → Score → Explain → Deliver. See project brief for behavior; implementation lives under `backend/src/pipeline/stages/`.
