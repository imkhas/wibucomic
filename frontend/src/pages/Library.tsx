import { useState, useEffect } from 'react';
import { BookMarked } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { supabase } from '../lib/supabase';
import { Comic } from '../types/database';
import { ComicGrid } from '../components/ComicGrid';

interface LibraryProps {
  onComicClick: (comic: Comic) => void;
}

export function Library({ onComicClick }: LibraryProps) {
  const { user } = useAuth();
  const { bookmarks, loading: bookmarksLoading, removeBookmark, isBookmarked } = useBookmarks(user?.id);
  const [bookmarkedComics, setBookmarkedComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookmarks.length > 0) {
      fetchBookmarkedComics();
    } else {
      setBookmarkedComics([]);
      setLoading(false);
    }
  }, [bookmarks]);

  async function fetchBookmarkedComics() {
    try {
      setLoading(true);
      const comicIds = bookmarks.map(b => b.comic_id);
      const { data, error } = await supabase
        .from('comics')
        .select('*')
        .in('id', comicIds);

      if (error) throw error;
      setBookmarkedComics(data || []);
    } catch (err) {
      console.error('Failed to fetch bookmarked comics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Please sign in to view your library</p>
      </div>
    );
  }

  if (loading || bookmarksLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <BookMarked className="w-8 h-8 text-blue-600" />
        <h1 className="text-4xl font-bold text-gray-900">My Library</h1>
      </div>

      {bookmarkedComics.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <BookMarked className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">Your library is empty</p>
          <p className="text-gray-400">Start bookmarking comics to build your collection!</p>
        </div>
      ) : (
        <ComicGrid
          comics={bookmarkedComics}
          isBookmarked={isBookmarked}
          onBookmarkToggle={removeBookmark}
          onComicClick={onComicClick}
        />
      )}
    </div>
  );
}
