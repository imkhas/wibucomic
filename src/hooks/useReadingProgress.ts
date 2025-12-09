import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ReadingProgress } from '../types/database';

export function useReadingProgress(userId: string | undefined, comicId?: string) {
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && comicId) {
      fetchProgress();
    }
  }, [userId, comicId]);

  async function fetchProgress() {
    if (!userId || !comicId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('comic_id', comicId)
        .maybeSingle();

      if (error) throw error;
      setProgress(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress');
    } finally {
      setLoading(false);
    }
  }

  async function updateProgress(comicId: string, currentPage: number) {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('reading_progress')
        .upsert({
          user_id: userId,
          comic_id: comicId,
          current_page: currentPage,
          last_read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      await fetchProgress();
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  }

  return { progress, loading, error, updateProgress };
}
