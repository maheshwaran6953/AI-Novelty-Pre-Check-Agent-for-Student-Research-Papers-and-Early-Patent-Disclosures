-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('INGEST', 'EXTRACT', 'PLAN_QUERIES', 'RETRIEVE', 'FILTER_DEDUP', 'SCORE', 'EXPLAIN', 'DELIVER');

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "stage" "PipelineStage" NOT NULL DEFAULT 'INGEST',
    "progress_message" TEXT,
    "original_filename" TEXT NOT NULL,
    "upload_path" TEXT NOT NULL,
    "input_truncated" BOOLEAN NOT NULL DEFAULT false,
    "truncation_note" TEXT,
    "error_message" TEXT,
    "claims" JSONB,
    "report" JSONB,
    "sources_searched" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sources_skipped" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);
