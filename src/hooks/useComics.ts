import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Comic } from '../types/database';

export function useComics(genre?: string | null, search?: string) {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComics();
  }, [genre, search]);

  async function fetchComics() {
    try {
      setLoading(true);
      let query = supabase
        .from('comics')
        .select('*')
        .order('created_at', { ascending: false });

      if (genre) {
        query = query.eq('genre', genre);
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setComics(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comics');
    } finally {
      setLoading(false);
    }
  }

  return { comics, loading, error, refetch: fetchComics };
}

export function useComic(id: string) {
  const [comic, setComic] = useState<Comic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComic();
  }, [id]);

  async function fetchComic() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comics')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setComic(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comic');
    } finally {
      setLoading(false);
    }
  }

  return { comic, loading, error };
}
