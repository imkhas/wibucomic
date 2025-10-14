const MANGADEX_API_BASE = 'https://api.mangadex.org';
const MANGADEX_UPLOADS_BASE = 'https://uploads.mangadex.org';

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

  const response = await fetch(`${MANGADEX_API_BASE}/manga?${params}`);
  if (!response.ok) throw new Error('Failed to search manga');

  const data = await response.json();
  return data;
}

export async function getMangaById(id: string) {
  const params = new URLSearchParams();
  params.append('includes[]', 'cover_art');
  params.append('includes[]', 'author');

  const response = await fetch(`${MANGADEX_API_BASE}/manga/${id}?${params}`);
  if (!response.ok) throw new Error('Failed to fetch manga');

  const data = await response.json();
  return data;
}

export async function getMangaFeed(mangaId: string, limit = 100, offset = 0) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    'translatedLanguage[]': 'en',
    'order[chapter]': 'asc',
  });

  const response = await fetch(`${MANGADEX_API_BASE}/manga/${mangaId}/feed?${params}`);
  if (!response.ok) throw new Error('Failed to fetch manga feed');

  const data = await response.json();
  return data;
}

export async function getChapterPages(chapterId: string): Promise<MangaDexChapterPages> {
  const response = await fetch(`${MANGADEX_API_BASE}/at-home/server/${chapterId}`);
  if (!response.ok) throw new Error('Failed to fetch chapter pages');

  const data = await response.json();
  return data;
}

export function getChapterImageUrl(baseUrl: string, chapterHash: string, fileName: string, quality: 'data' | 'data-saver' = 'data') {
  return `${baseUrl}/${quality}/${chapterHash}/${fileName}`;
}

export async function getCoverImageUrl(mangaId: string, coverId: string, size: '256' | '512' = '512'): Promise<string> {
  const response = await fetch(`${MANGADEX_API_BASE}/cover/${coverId}`);
  if (!response.ok) throw new Error('Failed to fetch cover');

  const data = await response.json();
  const fileName = data.data.attributes.fileName;

  return `${MANGADEX_UPLOADS_BASE}/covers/${mangaId}/${fileName}.${size}.jpg`;
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

  const response = await fetch(`${MANGADEX_API_BASE}/manga?${params}`);
  if (!response.ok) throw new Error('Failed to fetch popular manga');

  const data = await response.json();
  return data;
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

  const response = await fetch(`${MANGADEX_API_BASE}/manga?${params}`);
  if (!response.ok) throw new Error('Failed to fetch recent manga');

  const data = await response.json();
  return data;
}

export function extractGenreFromTags(tags: MangaDexManga['attributes']['tags']): string | null {
  if (!tags || tags.length === 0) return null;
  return tags[0]?.attributes?.name?.en || null;
}
