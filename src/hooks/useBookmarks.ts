import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Bookmark } from '../types/database';

export function useBookmarks(userId: string | undefined) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchBookmarks();
    }
  }, [userId]);

  async function fetchBookmarks() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookmarks');
    } finally {
      setLoading(false);
    }
  }

  async function addBookmark(comicId: string) {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('bookmarks')
        .insert({ user_id: userId, comic_id: comicId });

      if (error) throw error;
      await fetchBookmarks();
    } catch (err) {
      console.error('Failed to add bookmark:', err);
    }
  }

  async function removeBookmark(comicId: string) {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('comic_id', comicId);

      if (error) throw error;
      await fetchBookmarks();
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  }

  function isBookmarked(comicId: string): boolean {
    return bookmarks.some(b => b.comic_id === comicId);
  }

  return { bookmarks, loading, error, addBookmark, removeBookmark, isBookmarked };
}
