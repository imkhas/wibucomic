import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ComicPage } from '../types/database';

export function useComicPages(comicId: string) {
  const [pages, setPages] = useState<ComicPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (comicId) {
      fetchPages();
    }
  }, [comicId]);

  async function fetchPages() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comic_pages')
        .select('*')
        .eq('comic_id', comicId)
        .order('page_number', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  }

  return { pages, loading, error };
}
