import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class EmbeddingClient implements OnModuleInit {
  private pipelineFn: any;

  async onModuleInit() {
    console.log("Loading all-MiniLM-L6-v2 model...");
    // Dynamic import to support ESM package in NestJS
    const { pipeline, env } = await import('@xenova/transformers');
    
    // Using quantized model for faster loading in Node environment
    this.pipelineFn = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
    });
    console.log("Model loaded successfully.");
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.pipelineFn) throw new Error('Embedding pipeline not initialized');
    
    const CHUNK_SIZE = 8;
    let allEmbeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i += CHUNK_SIZE) {
      const chunk = texts.slice(i, i + CHUNK_SIZE);
      const output = await this.pipelineFn(chunk, { pooling: 'mean', normalize: true });
      allEmbeddings = allEmbeddings.concat(output.tolist());
    }
    
    return allEmbeddings;
  }
}
