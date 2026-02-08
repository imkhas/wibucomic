export interface Comic {
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
}

export interface ComicPage {
  id: string;
  comic_id: string;
  page_number: number;
  image_url: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  comic_id: string;
  created_at: string;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  comic_id: string;
  current_page: number;
  last_read_at: string;
  updated_at: string;
}

export interface ComicWithProgress extends Comic {
  current_page?: number;
  is_bookmarked?: boolean;
}
