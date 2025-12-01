import { API_CONFIG, apiRequest, rateLimiter } from '../lib/apiConfig';

// Always use direct API - proxy has CORS issues
const MANGADEX_API_BASE = API_CONFIG.MANGADEX_BASE_URL;
const MANGADEX_UPLOADS_BASE = API_CONFIG.MANGADEX_UPLOADS_URL;

export interface MangaDexManga {
  id: string;
  attributes: {
    title: { [key: string]: string };
    description: { [key: string]: string };
    status: string;
    tags: Array<{
      attributes: {
        name: { [key: string]: string };
      };
    }>;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: {
      fileName?: string;
    };
  }>;
}

export interface MangaDexChapter {
  id: string;
  attributes: {
    chapter: string;
    title: string | null;
    pages: number;
    translatedLanguage: string;
  };
}

export interface MangaDexChapterPages {
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

interface CoverResponse {
  data: {
    attributes: {
      fileName: string;
    };
  };
}

function buildUrl(path: string, params?: URLSearchParams): string {
  return `${MANGADEX_API_BASE}/${path}${params ? `?${params}` : ''}`;
}

export async function searchManga(query: string, limit = 20, offset = 0) {
  const params = new URLSearchParams({
    title: query,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  params.append('includes[]', 'cover_art');
  params.append('includes[]', 'author');
  params.append('contentRating[]', 'safe');
  params.append('contentRating[]', 'suggestive');
  params.append('order[relevance]', 'desc');

  const url = buildUrl('manga', params);
  return rateLimiter.add(() => apiRequest(url));
}

export async function getMangaById(id: string) {
  const params = new URLSearchParams();
  params.append('includes[]', 'cover_art');
  params.append('includes[]', 'author');
  params.append('includes[]', 'artist');

  const url = buildUrl(`manga/${id}`, params);
  return rateLimiter.add(() => apiRequest(url));
}

export async function getMangaFeed(mangaId: string, limit = 100, offset = 0) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    'translatedLanguage[]': 'en',
    'order[chapter]': 'asc',
    'order[volume]': 'asc',
  });

  params.append('includes[]', 'scanlation_group');

  const url = buildUrl(`manga/${mangaId}/feed`, params);
  return rateLimiter.add(() => apiRequest(url));
}

export async function getChapterPages(chapterId: string): Promise<MangaDexChapterPages> {
  const url = buildUrl(`at-home/server/${chapterId}`);
  return rateLimiter.add(() => apiRequest<MangaDexChapterPages>(url));
}

export function getChapterImageUrl(
  baseUrl: string, 
  chapterHash: string, 
  fileName: string, 
  quality: 'data' | 'data-saver' = 'data'
): string {
  return `${baseUrl}/${quality}/${chapterHash}/${fileName}`;
}

export async function getCoverImageUrl(
  mangaId: string, 
  coverId: string, 
  size: '256' | '512' = '512'
): Promise<string> {
  try {
    const url = buildUrl(`cover/${coverId}`);
    const response = await rateLimiter.add(() =>
      apiRequest<CoverResponse>(url)
    );
    
    const fileName = response.data.attributes.fileName;
    return `${MANGADEX_UPLOADS_BASE}/covers/${mangaId}/${fileName}.${size}.jpg`;
  } catch (error) {
    console.error('Failed to fetch cover:', error);
    throw error;
  }
}

export async function getPopularManga(limit = 20, offset = 0) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    'order[followedCount]': 'desc',
  });

  params.append('includes[]', 'cover_art');
  params.append('includes[]', 'author');
  params.append('contentRating[]', 'safe');
  params.append('contentRating[]', 'suggestive');
  params.append('hasAvailableChapters', 'true');

  const url = buildUrl('manga', params);
  return rateLimiter.add(() => apiRequest(url));
}

export async function getRecentlyAddedManga(limit = 20, offset = 0) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    'order[createdAt]': 'desc',
  });

  params.append('includes[]', 'cover_art');
  params.append('includes[]', 'author');
  params.append('contentRating[]', 'safe');
  params.append('contentRating[]', 'suggestive');
  params.append('hasAvailableChapters', 'true');

  const url = buildUrl('manga', params);
  return rateLimiter.add(() => apiRequest(url));
}

export async function getLatestUpdates(limit = 20, offset = 0) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    'order[updatedAt]': 'desc',
  });

  params.append('includes[]', 'cover_art');
  params.append('includes[]', 'author');
  params.append('contentRating[]', 'safe');
  params.append('contentRating[]', 'suggestive');
  params.append('hasAvailableChapters', 'true');

  const url = buildUrl('manga', params);
  return rateLimiter.add(() => apiRequest(url));
}

export function extractGenreFromTags(tags: MangaDexManga['attributes']['tags']): string | null {
  if (!tags || tags.length === 0) return null;
  
  const genreTag = tags.find(tag => {
    const name = tag.attributes?.name?.en?.toLowerCase();
    return name && [
      'action', 'adventure', 'comedy', 'drama', 'fantasy', 
      'horror', 'mystery', 'romance', 'sci-fi', 'slice of life',
      'sports', 'supernatural', 'thriller'
    ].includes(name);
  });

  return genreTag?.attributes?.name?.en || tags[0]?.attributes?.name?.en || null;
}

export function extractAuthorName(relationships: MangaDexManga['relationships']): string | null {
  const author = relationships.find(r => r.type === 'author');
  return author?.id || null;
}