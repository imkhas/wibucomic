import { useState, useEffect } from 'react';
import * as MangaDexAPI from '../services/mangadex';
import { Comic } from '../types/database';
import { useLanguage } from '../contexts/LanguageContext';
import { searchAggregator, getAggregatorChapters } from '../services/aggregator';

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
      name?: string;
      fileName?: string;
    };
  }>;
}

export interface Chapter {
  id: string;
  chapter: string;
  title: string | null;
  pages: number;
  translatedLanguage: string;
  scanlatorGroup: string | null;
  source: 'mangadex' | 'aggregator';
}

function convertMangaDexToComic(manga: MangaDexManga, coverUrl?: string): Comic {
  const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Unknown';
  const description = manga.attributes.description.en || Object.values(manga.attributes.description)[0] || null;
  
  // Extract author name from relationships if available
  const authorRelation = manga.relationships.find(r => r.type === 'author');
  const author = authorRelation?.attributes?.name || authorRelation?.id || null;
  
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
      const response = await MangaDexAPI.searchManga(query) as any;

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
      const response = await MangaDexAPI.getPopularManga(limit) as any;

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
  const { selectedLanguage } = useLanguage();

  useEffect(() => {
    if (id) {
      fetchManga();
    }
  }, [id, selectedLanguage]); // Refetch when language changes (for total page count)

  async function fetchManga() {
    try {
      setLoading(true);
      setError(null);
      const response = await MangaDexAPI.getMangaById(id) as any;
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

      const feedResponse = await MangaDexAPI.getMangaFeed(id, selectedLanguage) as any;
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

export function useMangaDexChapters(mangaId: string, mangaTitle?: string) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedLanguage } = useLanguage();

  useEffect(() => {
    if (mangaId) {
      fetchChapters();
    }
  }, [mangaId, selectedLanguage, mangaTitle]);

  async function fetchChapters() {
    try {
      setLoading(true);
      setError(null);
      
      const fetchMangaDex = async () => {
        try {
          const response = await MangaDexAPI.getMangaFeed(mangaId, selectedLanguage) as any;
          if (!response.data) return [];
          
          return response.data.map((ch: any) => {
            const groupRelation = ch.relationships?.find((r: any) => r.type === 'scanlation_group');
            const groupName = groupRelation?.attributes?.name || 'Unknown Group';
            
            return {
              id: ch.id,
              chapter: ch.attributes.chapter,
              title: ch.attributes.title,
              pages: ch.attributes.pages,
              translatedLanguage: ch.attributes.translatedLanguage,
              scanlatorGroup: groupName,
              source: 'mangadex' as const,
            };
          });
        } catch (e) {
          console.error('MangaDex fetch error:', e);
          return [];
        }
      };

      const fetchAggregator = async () => {
        if (!mangaTitle) return [];
        try {
          // Get the full manga info to extract aliases
          const response = await MangaDexAPI.getMangaById(mangaId) as any;
          const mangaData = response.data;
          
          // Collect all potential search queries
          const queries = new Set<string>();
          queries.add(mangaTitle.replace(/\s*\([^)]*\)/g, '').trim());
          
          // Add English title if available and different
          if (mangaData.attributes.title.en) {
            queries.add(mangaData.attributes.title.en);
          }
          
          // Add alternative titles
          if (mangaData.attributes.altTitles) {
            mangaData.attributes.altTitles.forEach((alt: any) => {
              const engAlt = alt.en || alt['ja-ro'] || alt['ko-ro'];
              if (engAlt) queries.add(engAlt);
            });
          }

          console.log(`Attempting search with aliases: ${Array.from(queries).join(', ')}`);
          let searchResults: any[] = [];
          for (const query of queries) {
            console.log(`Searching aggregator for: "${query}"`);
            const results = await searchAggregator(query);
            if (results && results.length > 0) {
              searchResults = results;
              break; // Stop at first successful search
            }
          }

          if (searchResults.length === 0) {
            console.log('No aggregator results found for any alias');
            return [];
          }
          
          // Use the best match from the refined aggregator search
          const bestMatch = searchResults[0]; 
            
          const aggregatorChapters = await getAggregatorChapters(bestMatch.path);
          return aggregatorChapters.map((ch: any) => {
            const numMatch = ch.title.match(/Chapter\s+(\d+\.?\d*)/i);
            const chNum = numMatch ? numMatch[1] : '0';
            
            // Determine friendly source name
            const sourceName = bestMatch.source === 'mangareader' ? 'MangaReader' : 'MangaPill';
            
            return {
              id: ch.path,
              chapter: chNum,
              title: ch.title,
              pages: 0,
              translatedLanguage: 'en',
              scanlatorGroup: sourceName,
              source: 'aggregator' as const,
            };
          });
        } catch (e) {
          console.error('Aggregator fetch error:', e);
          return [];
        }
      };

      // Fetch in parallel
      const [mdChapters, aggChapters] = await Promise.all([
        fetchMangaDex(),
        fetchAggregator()
      ]);

      // Merge and de-duplicate
      // We keep everything but we'll flag duplicates in the UI through scanlator groups
      const combined = [...mdChapters, ...aggChapters];
      
      // Sort by chapter number
      const sorted = combined.sort((a, b) => {
        const numA = parseFloat(a.chapter || '0');
        const numB = parseFloat(b.chapter || '0');
        if (numA !== numB) return numA - numB;
        // If same chapter number, sub-sort by source
        return a.source === 'mangadex' ? -1 : 1;
      });

      setChapters(sorted);
    } catch (err) {
      console.error('Error in fetchChapters:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chapters');
    } finally {
      setLoading(false);
    }
  }

  return { chapters, loading, error };
}
