import { apiRequest } from '../lib/apiConfig';

const AGGREGATOR_API_BASE = '/.netlify/functions/aggregator';

function buildAggregatorUrl(params: URLSearchParams): string {
  const url = new URL(AGGREGATOR_API_BASE, window.location.origin);
  params.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

export interface AggregatorResult {
  path: string;
  title: string;
}

export interface AggregatorChapter {
  path: string;
  title: string;
}

export async function searchAggregator(query: string): Promise<AggregatorResult[]> {
  const params = new URLSearchParams({ action: 'search', query });
  return apiRequest<AggregatorResult[]>(buildAggregatorUrl(params));
}

export async function getAggregatorChapters(mangaPath: string): Promise<AggregatorChapter[]> {
  const params = new URLSearchParams({ action: 'chapters', mangaPath });
  return apiRequest<AggregatorChapter[]>(buildAggregatorUrl(params));
}

export async function getAggregatorPages(chapterPath: string): Promise<string[]> {
  const params = new URLSearchParams({ action: 'pages', chapterPath });
  return apiRequest<string[]>(buildAggregatorUrl(params));
}
