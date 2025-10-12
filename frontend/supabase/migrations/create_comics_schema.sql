/*
  # Create Comics Web App Schema

  1. New Tables
    - `comics`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text)
      - `author` (text)
      - `cover_image` (text, url to cover)
      - `genre` (text)
      - `status` (text, e.g., ongoing, completed)
      - `total_pages` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `comic_pages`
      - `id` (uuid, primary key)
      - `comic_id` (uuid, foreign key to comics)
      - `page_number` (integer, not null)
      - `image_url` (text, not null)
      - `created_at` (timestamp)
    
    - `bookmarks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `comic_id` (uuid, foreign key to comics)
      - `created_at` (timestamp)
    
    - `reading_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `comic_id` (uuid, foreign key to comics)
      - `current_page` (integer, default 1)
      - `last_read_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Comics and comic_pages are publicly readable
    - Only authenticated users can create bookmarks and reading progress
    - Users can only access their own bookmarks and reading progress
*/

-- Create comics table
CREATE TABLE IF NOT EXISTS comics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  author text,
  cover_image text,
  genre text,
  status text DEFAULT 'ongoing',
  total_pages integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comic_pages table
CREATE TABLE IF NOT EXISTS comic_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comic_id uuid NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comic_id, page_number)
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comic_id uuid NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, comic_id)
);

-- Create reading_progress table
CREATE TABLE IF NOT EXISTS reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comic_id uuid NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
  current_page integer DEFAULT 1,
  last_read_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, comic_id)
);

-- Enable RLS
ALTER TABLE comics ENABLE ROW LEVEL SECURITY;
ALTER TABLE comic_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- Comics policies (public read)
CREATE POLICY "Comics are publicly readable"
  ON comics FOR SELECT
  TO public
  USING (true);

-- Comic pages policies (public read)
CREATE POLICY "Comic pages are publicly readable"
  ON comic_pages FOR SELECT
  TO public
  USING (true);

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reading progress policies
CREATE POLICY "Users can view own reading progress"
  ON reading_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reading progress"
  ON reading_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading progress"
  ON reading_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comic_pages_comic_id ON comic_pages(comic_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_comic_id ON bookmarks(comic_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_comic_id ON reading_progress(comic_id);
CREATE INDEX IF NOT EXISTS idx_comics_genre ON comics(genre);
CREATE INDEX IF NOT EXISTS idx_comics_status ON comics(status);