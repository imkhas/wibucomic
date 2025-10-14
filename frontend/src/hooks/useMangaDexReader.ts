import { useState, useEffect } from 'react';
import * as MangaDexAPI from '../services/mangadex';

export interface MangaDexPage {
  id: string;
  page_number: number;
  image_url: string;
}

export function useMangaDexReader(chapterId: string) {
  const [pages, setPages] = useState<MangaDexPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chapterId) {
      fetchPages();
    }
  }, [chapterId]);

  async function fetchPages() {
    try {
      setLoading(true);
      setError(null);

      const chapterData = await MangaDexAPI.getChapterPages(chapterId);
      const { baseUrl, chapter } = chapterData;

      const pageList: MangaDexPage[] = chapter.data.map((fileName, index) => ({
        id: `${chapterId}-${index}`,
        page_number: index + 1,
        image_url: MangaDexAPI.getChapterImageUrl(baseUrl, chapter.hash, fileName),
      }));

      setPages(pageList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chapter pages');
      setPages([]);
    } finally {
      setLoading(false);
    }
  }

  return { pages, loading, error };
}
