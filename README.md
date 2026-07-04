# AI Novelty Pre-Check Agent

Academic pre-screening tool for student research papers and early patent-style disclosures. Extracts technical claims, searches arXiv and Semantic Scholar, scores similarity with embeddings, and produces a plain-language overlap report.

**Not legal patentability advice.**

## Stack

- **Frontend:** Angular
- **Backend:** NestJS (TypeScript)
- **Database:** PostgreSQL (Docker Compose)
- **ORM:** Prisma

## Local setup

```bash
# Start PostgreSQL
docker compose up -d

# Copy environment template (edit with your API keys)
cp .env.example .env

# Backend (after NestJS scaffold is added in a later stage)
cd backend
npm install
npx prisma migrate dev
npm run start:dev

# Frontend (after Angular scaffold is added in a later stage)
cd frontend
npm install
npm start
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design.
