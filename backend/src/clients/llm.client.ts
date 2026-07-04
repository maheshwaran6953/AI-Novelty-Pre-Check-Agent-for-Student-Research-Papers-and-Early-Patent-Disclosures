import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

@Injectable()
export class LlmClient {
  private geminiAi?: GoogleGenAI;
  private geminiModel: string;
  private groqApiKey?: string;
  private groqModel: string;
  private useGroq: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const defaultApiKey = this.configService.get<string>('LLM_API_KEY');
    this.groqApiKey = this.configService.get<string>('GROQ_API_KEY') || (defaultApiKey?.startsWith('gsk_') ? defaultApiKey : undefined);
    this.groqModel = this.configService.get<string>('GROQ_MODEL') || 'llama-3.1-8b-instant';
    
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || (defaultApiKey?.startsWith('gsk_') ? undefined : defaultApiKey);
    this.geminiModel = this.configService.get<string>('LLM_MODEL') || 'gemini-2.0-flash';
    
    if (this.groqApiKey) {
      this.useGroq = true;
    } else if (geminiApiKey) {
      this.geminiAi = new GoogleGenAI({ apiKey: geminiApiKey });
      this.useGroq = false;
    } else {
      throw new InternalServerErrorException('Neither GROQ_API_KEY nor LLM_API_KEY is defined in environment variables.');
    }
  }

  /**
   * Generates structured JSON output from the active LLM provider and validates it against a Zod schema.
   */
  async generateJson<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    let text = '';
    
    if (this.useGroq) {
      text = await this.generateWithGroq(prompt);
    } else if (this.geminiAi) {
      text = await this.generateWithGemini(prompt);
    } else {
      throw new Error("No LLM client is initialized.");
    }

    if (!text) {
      throw new Error("Empty response received from LLM.");
    }

    // Try to parse the JSON returned
    let jsonParsed;
    try {
      jsonParsed = JSON.parse(text);
    } catch (err) {
      throw new Error(`LLM returned invalid JSON string: ${(err as Error).message}\nResponse text: ${text}`);
    }

    // Validate against the Zod schema
    const result = schema.safeParse(jsonParsed);
    if (!result.success) {
      // We throw the zod error specifically so the caller knows it was a schema validation failure
      throw result.error;
    }

    return result.data;
  }

  private async generateWithGroq(prompt: string): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.groqModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private async generateWithGemini(prompt: string): Promise<string> {
    const response = await this.geminiAi!.models.generateContent({
      model: this.geminiModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return response.text || '';
  }
}
