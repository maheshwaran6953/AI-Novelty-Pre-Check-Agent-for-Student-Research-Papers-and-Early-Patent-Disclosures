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
    
    // Pass texts as batch, request mean pooling and normalization (required for cosine similarity)
    const output = await this.pipelineFn(texts, { pooling: 'mean', normalize: true });
    
    // output is a Tensor, tolist() converts it to nested JS arrays
    return output.tolist();
  }
}
