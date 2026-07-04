import { Injectable } from '@nestjs/common';
import { PipelineContext } from '../pipeline.context';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';

@Injectable()
export class IngestStage {
  constructor(private readonly prisma: PrismaService) {}

  async execute(context: PipelineContext): Promise<void> {
    const ext = path.extname(context.filePath).toLowerCase();
    let text = '';

    if (ext === '.txt') {
      text = fs.readFileSync(context.filePath, 'utf-8');
    } else if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(context.filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } else {
      throw new Error(`Unsupported file extension: ${ext}`);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('This PDF appears to be scanned/image-based with no extractable text. Please upload a text-based PDF or .txt file.');
    }

    // Truncation heuristic: ~15 pages OR ~8000 tokens (4 chars/token = 32,000 chars)
    const MAX_CHARS = 32000;
    if (text.length > MAX_CHARS) {
      text = text.substring(0, MAX_CHARS);
      await this.prisma.job.update({
        where: { id: context.jobId },
        data: {
          inputTruncated: true,
          truncationNote: 'Document truncated to roughly 15 pages (8000 tokens) to fit processing limits.',
        },
      });
    }

    context.extractedText = text;
  }
}
