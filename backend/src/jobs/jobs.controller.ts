import { Controller, Post, Get, Param, UseInterceptors, UploadedFile, BadRequestException, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('api/v1/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.UPLOAD_DIR || './data/uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        // We do initial checking here but enforce with ParseFilePipe
        const allowedMimeTypes = ['application/pdf', 'text/plain'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(new BadRequestException('Only .pdf and .txt files are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required and cannot be empty.');
    }
    
    // Additional size checking. Although ParseFilePipe can do this, it's safe to enforce here too
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File exceeds 10MB limit.');
    }

    return this.jobsService.createJob(file);
  }

  @Get()
  async getJobs() {
    return this.jobsService.getJobs();
  }

  @Get(':id')
  async getJobStatus(@Param('id') id: string) {
    return this.jobsService.getJobStatus(id);
  }

  @Get(':id/report')
  async getJobReport(@Param('id') id: string) {
    return this.jobsService.getJobReport(id);
  }
}
