import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { CandidateDocument } from '../pipeline/pipeline.context';

@Injectable()
export class ArxivClient {
  private parser = new XMLParser({ ignoreAttributes: false });

  async search(query: string, maxResults: number = 10): Promise<CandidateDocument[]> {
    const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${maxResults}`;
    
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      throw new Error(`ArXiv API error: ${response.status} ${response.statusText}`);
    }
    
    const xml = await response.text();
    const parsed = this.parser.parse(xml);
    
    let entries = parsed.feed?.entry || [];
    if (!Array.isArray(entries)) {
      entries = [entries];
    }
    
    return entries.map((entry: any) => ({
      candidateId: crypto.randomUUID(),
      source: 'arxiv',
      externalId: entry.id?.split('/abs/').pop() || entry.id,
      title: entry.title?.replace(/\s+/g, ' ').trim() || 'No Title',
      abstractSnippet: entry.summary?.replace(/\s+/g, ' ').trim() || 'No Abstract',
      url: entry.id,
      rawMetadata: entry,
    }));
  }
}
