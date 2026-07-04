import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineOrchestrator } from '../pipeline/pipeline.orchestrator';
import { JobStatus, PipelineStage } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JobsService {
  private uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: PipelineOrchestrator,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './data/uploads';
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async createJob(file: Express.Multer.File) {
    const originalFilename = file.originalname;
    
    // Create DB record
    const job = await this.prisma.job.create({
      data: {
        originalFilename,
        uploadPath: file.path, // multer handles the save via dest
        status: JobStatus.QUEUED,
        stage: PipelineStage.INGEST,
      },
    });

    // Start pipeline asynchronously
    // We don't await this so the HTTP response returns immediately
    this.orchestrator.startPipeline(job.id, file.path).catch(err => {
      console.error(`Pipeline failed for job ${job.id}:`, err);
    });

    return { jobId: job.id, status: job.status };
  }

  async getJobStatus(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        stage: true,
        progressMessage: true,
        errorMessage: true,
        inputTruncated: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return {
      jobId: job.id,
      status: job.status,
      stage: job.stage,
      progressMessage: job.progressMessage,
      errorMessage: job.errorMessage,
      inputTruncated: job.inputTruncated,
    };
  }

  async getJobs() {
    const jobs = await this.prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalFilename: true,
        status: true,
        stage: true,
        createdAt: true,
        completedAt: true,
      },
    });
    return jobs.map(job => ({
      jobId: job.id,
      originalFilename: job.originalFilename,
      status: job.status,
      stage: job.stage,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    }));
  }

  async getJobReport(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      select: { id: true, status: true, report: true },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (job.status !== JobStatus.COMPLETED) {
      throw new ConflictException('Job not yet complete.');
    }

    return job.report;
  }
}
