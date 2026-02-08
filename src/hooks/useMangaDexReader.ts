import { useState, useEffect } from 'react';
import * as MangaDexAPI from '../services/mangadex';
import { getAggregatorPages } from '../services/aggregator';
import { ComicPage } from '../types/database';

export function useMangaDexReader(chapterId: string, source: 'mangadex' | 'aggregator' = 'mangadex') {
  const [pages, setPages] = useState<ComicPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chapterId) {
      fetchPages();
    } else {
      setPages([]);
      setLoading(false);
    }
  }, [chapterId, source]);

  async function fetchPages() {
    try {
      setLoading(true);
      setError(null);

      if (source === 'mangadex') {
        const chapterData = await MangaDexAPI.getChapterPages(chapterId);
        const { baseUrl, chapter } = chapterData;

        const pageList: ComicPage[] = chapter.data.map((fileName, index) => ({
          id: `${chapterId}-${index}`,
          comic_id: chapterId,
          page_number: index + 1,
          image_url: MangaDexAPI.getChapterImageUrl(baseUrl, chapter.hash, fileName),
          created_at: new Date().toISOString(),
        }));
        setPages(pageList);
      } else {
        // Aggregator source
        const aggregatorPages = await getAggregatorPages(chapterId);
        const pageList: ComicPage[] = aggregatorPages.map((url, index) => ({
          id: `${chapterId}-${index}`,
          comic_id: chapterId,
          page_number: index + 1,
          image_url: url,
          created_at: new Date().toISOString(),
        }));
        setPages(pageList);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chapter pages');
      setPages([]);
    } finally {
      setLoading(false);
    }
  }

  return { pages, loading, error };
}