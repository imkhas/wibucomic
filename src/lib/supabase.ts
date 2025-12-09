/**
 * Supabase Client Configuration
 * 
 * This module initializes and exports the Supabase client for database operations.
 * Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    );
}

// Create and export the Supabase client
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

/**
 * Type definitions for Supabase tables
 * These should match your database schema
 */
export type Database = {
    public: {
        Tables: {
            comics: {
                Row: {
                    id: string;
                    title: string;
                    description: string | null;
                    author: string | null;
                    cover_image: string | null;
                    genre: string | null;
                    status: 'ongoing' | 'completed';
                    total_pages: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['comics']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['comics']['Insert']>;
            };
            comic_pages: {
                Row: {
                    id: string;
                    comic_id: string;
                    page_number: number;
                    image_url: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['comic_pages']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['comic_pages']['Insert']>;
            };
            bookmarks: {
                Row: {
                    id: string;
                    user_id: string;
                    comic_id: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['bookmarks']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['bookmarks']['Insert']>;
            };
            reading_progress: {
                Row: {
                    id: string;
                    user_id: string;
                    comic_id: string;
                    current_page: number;
                    last_read_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['reading_progress']['Row'], 'id'>;
                Update: Partial<Database['public']['Tables']['reading_progress']['Insert']>;
            };
        };
    };
};
