import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ComicPage } from '../types/database';

export function useComicPages(comicId: string) {
  const [pages, setPages] = useState<ComicPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!comicId) {
      setPages([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    async function fetchPages() {
      try {
        const { data, error } = await supabase
          .from('comic_pages')
          .select('*')
          .eq('comic_id', comicId)
          .order('page_number', { ascending: true });

        if (error) throw error;
        setPages(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pages');
        setPages([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPages();
  }, [comicId]);

  return { pages, loading, error };
}