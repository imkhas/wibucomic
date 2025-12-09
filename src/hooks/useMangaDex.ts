import { useState, useEffect } from 'react';
import * as MangaDexAPI from '../services/mangadex';
import type { Comic } from '../types/database';


interface MangaDexManga {
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

function convertMangaDexToComic(manga: MangaDexManga, coverUrl?: string): Comic {
  const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Unknown';
  const description = manga.attributes.description.en || Object.values(manga.attributes.description)[0] || null;
  const author = manga.relationships.find(r => r.type === 'author')?.id || null;
  const status = manga.attributes.status === 'completed' ? 'completed' : 'ongoing';
  const genre = MangaDexAPI.extractGenreFromTags(manga.attributes.tags);

  return {
    id: manga.id,
    title,
    description,
    author,
    cover_image: coverUrl || null,
    genre,
    status,
    total_pages: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Helper function to get cover URL directly from manga data
function getCoverUrlFromManga(manga: MangaDexManga): string | undefined {
  const coverRelation = manga.relationships.find((r: any) => r.type === 'cover_art');

  if (!coverRelation) return undefined;

  // Check if fileName is already in the relationship (includes[] parameter)
  if (coverRelation.attributes?.fileName) {
    const fileName = coverRelation.attributes.fileName;
    return `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.512.jpg`;
  }

  return undefined;
}

export function useMangaDexSearch(query: string) {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim()) {
      searchManga();
    } else {
      setComics([]);
    }
  }, [query]);

  async function searchManga() {
    try {
      setLoading(true);
      setError(null);
      const response = await MangaDexAPI.searchManga(query);

      const mangaWithCovers = await Promise.all(
        response.data.map(async (manga: MangaDexManga) => {
          // Try to get cover from included data first
          let coverUrl = getCoverUrlFromManga(manga);

          // If not available, fetch it separately
          if (!coverUrl) {
            const coverRelation = manga.relationships.find((r: any) => r.type === 'cover_art');
            if (coverRelation) {
              try {
                coverUrl = await MangaDexAPI.getCoverImageUrl(manga.id, coverRelation.id);
              } catch (err) {
                console.error('Failed to fetch cover for', manga.id, err);
              }
            }
          }

          return convertMangaDexToComic(manga, coverUrl);
        })
      );

      setComics(mangaWithCovers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search manga');
      setComics([]);
    } finally {
      setLoading(false);
    }
  }

  return { comics, loading, error };
}

export function useMangaDexPopular(limit = 20) {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPopular();
  }, [limit]);

  async function fetchPopular() {
    try {
      setLoading(true);
      setError(null);
      const response = await MangaDexAPI.getPopularManga(limit);

      console.log('First manga response:', response.data[0]); // Debug log

      const mangaWithCovers = await Promise.all(
        response.data.map(async (manga: MangaDexManga) => {
          // Try to get cover from included data first
          let coverUrl = getCoverUrlFromManga(manga);

          // If not available, fetch it separately
          if (!coverUrl) {
            const coverRelation = manga.relationships.find((r: any) => r.type === 'cover_art');
            if (coverRelation) {
              try {
                coverUrl = await MangaDexAPI.getCoverImageUrl(manga.id, coverRelation.id);
              } catch (err) {
                console.error('Failed to fetch cover for', manga.id, err);
              }
            }
          }

          return convertMangaDexToComic(manga, coverUrl);
        })
      );

      setComics(mangaWithCovers);
    } catch (err) {
      console.error('Error in fetchPopular:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch popular manga');
      setComics([]);
    } finally {
      setLoading(false);
    }
  }

  return { comics, loading, error, refetch: fetchPopular };
}

export function useMangaDexManga(id: string) {
  const [comic, setComic] = useState<Comic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchManga();
    }
  }, [id]);

  async function fetchManga() {
    try {
      setLoading(true);
      setError(null);
      const response = await MangaDexAPI.getMangaById(id);
      const manga = response.data;

      // Try direct cover URL first
      let coverUrl = getCoverUrlFromManga(manga);

      // Fallback to separate fetch
      if (!coverUrl) {
        const coverRelation = manga.relationships.find((r: any) => r.type === 'cover_art');
        if (coverRelation) {
          try {
            coverUrl = await MangaDexAPI.getCoverImageUrl(manga.id, coverRelation.id);
          } catch (err) {
            console.error('Failed to fetch cover', err);
          }
        }
      }

      const feedResponse = await MangaDexAPI.getMangaFeed(id);
      const totalPages = feedResponse.data.length;

      const convertedComic = convertMangaDexToComic(manga, coverUrl);
      convertedComic.total_pages = totalPages;

      setComic(convertedComic);
    } catch (err) {
      console.error('Error in fetchManga:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch manga');
    } finally {
      setLoading(false);
    }
  }

  return { comic, loading, error };
}

export function useMangaDexChapters(mangaId: string) {
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mangaId) {
      fetchChapters();
    }
  }, [mangaId]);

  async function fetchChapters() {
    try {
      setLoading(true);
      setError(null);
      const response = await MangaDexAPI.getMangaFeed(mangaId);
      setChapters(response.data);
    } catch (err) {
      console.error('Error in fetchChapters:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chapters');
    } finally {
      setLoading(false);
    }
  }

  return { chapters, loading, error };
}