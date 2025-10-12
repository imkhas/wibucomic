import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Comic = {
  id: string;
  title: string;
  description: string;
  type: 'manga' | 'manhwa' | 'comic' | 'manhua';
  cover_image: string;
  banner_image: string;
  rating: number;
  release_year: number;
  status: 'ongoing' | 'completed' | 'hiatus';
  genres: string[];
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type Chapter = {
  id: string;
  comic_id: string;
  chapter_number: number;
  title: string;
  release_date: string;
  created_at: string;
};
