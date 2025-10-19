import { API_CONFIG, apiRequest, rateLimiter } from '../lib/apiConfig';

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

  return rateLimiter.add(() => 
    apiRequest(`${MANGADEX_API_BASE}/manga?${params}`)
  );
}

export async function getMangaById(id: string) {
  const params = new URLSearchParams();
  params.append('includes[]', 'cover_art');
  params.append('includes[]', 'author');
  params.append('includes[]', 'artist');

  return rateLimiter.add(() =>
    apiRequest(`${MANGADEX_API_BASE}/manga/${id}?${params}`)
  );
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

  return rateLimiter.add(() =>
    apiRequest(`${MANGADEX_API_BASE}/manga/${mangaId}/feed?${params}`)
  );
}

export async function getChapterPages(chapterId: string): Promise<MangaDexChapterPages> {
  return rateLimiter.add(() =>
    apiRequest(`${MANGADEX_API_BASE}/at-home/server/${chapterId}`)
  );
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
    const response = await rateLimiter.add(() =>
      apiRequest(`${MANGADEX_API_BASE}/cover/${coverId}`)
    );
    
    const fileName = response.data.attributes.fileName;
    return `${MANGADEX_UPLOADS_BASE}/covers/${mangaId}/${fileName}.${size}.jpg`;
  } catch (error) {
    console.error('Failed to fetch cover:', error);
    // Return placeholder or throw
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

  return rateLimiter.add(() =>
    apiRequest(`${MANGADEX_API_BASE}/manga?${params}`)
  );
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

  return rateLimiter.add(() =>
    apiRequest(`${MANGADEX_API_BASE}/manga?${params}`)
  );
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

  return rateLimiter.add(() =>
    apiRequest(`${MANGADEX_API_BASE}/manga?${params}`)
  );
}

export function extractGenreFromTags(tags: MangaDexManga['attributes']['tags']): string | null {
  if (!tags || tags.length === 0) return null;
  
  // Get first genre tag
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

// Helper to extract author name from relationships
export function extractAuthorName(relationships: MangaDexManga['relationships']): string | null {
  const author = relationships.find(r => r.type === 'author');
  return author?.id || null;
}