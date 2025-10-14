import { useState, useEffect } from 'react';
import * as MangaDexAPI from '../services/mangadex';
import { Comic } from '../types/database';

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
          const coverRelation = manga.relationships.find((r: any) => r.type === 'cover_art');
          let coverUrl: string | undefined;

          if (coverRelation) {
            try {
              coverUrl = await MangaDexAPI.getCoverImageUrl(manga.id, coverRelation.id);
            } catch (err) {
              console.error('Failed to fetch cover for', manga.id);
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

      const mangaWithCovers = await Promise.all(
        response.data.map(async (manga: MangaDexManga) => {
          const coverRelation = manga.relationships.find((r: any) => r.type === 'cover_art');
          let coverUrl: string | undefined;

          if (coverRelation) {
            try {
              coverUrl = await MangaDexAPI.getCoverImageUrl(manga.id, coverRelation.id);
            } catch (err) {
              console.error('Failed to fetch cover for', manga.id);
            }
          }

          return convertMangaDexToComic(manga, coverUrl);
        })
      );

      setComics(mangaWithCovers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch popular manga');
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

      const coverRelation = manga.relationships.find((r: any) => r.type === 'cover_art');
      let coverUrl: string | undefined;

      if (coverRelation) {
        try {
          coverUrl = await MangaDexAPI.getCoverImageUrl(manga.id, coverRelation.id);
        } catch (err) {
          console.error('Failed to fetch cover');
        }
      }

      const feedResponse = await MangaDexAPI.getMangaFeed(id);
      const totalPages = feedResponse.data.length;

      const convertedComic = convertMangaDexToComic(manga, coverUrl);
      convertedComic.total_pages = totalPages;

      setComic(convertedComic);
    } catch (err) {
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
      setError(err instanceof Error ? err.message : 'Failed to fetch chapters');
    } finally {
      setLoading(false);
    }
  }

  return { chapters, loading, error };
}
