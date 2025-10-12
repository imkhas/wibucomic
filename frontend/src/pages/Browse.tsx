import { useState } from 'react';
import { useComics } from '../hooks/useComics';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { ComicGrid } from '../components/ComicGrid';
import { SearchBar } from '../components/SearchBar';
import { FilterBar } from '../components/FilterBar';
import { Comic } from '../types/database';

interface BrowseProps {
  onComicClick: (comic: Comic) => void;
}

export function Browse({ onComicClick }: BrowseProps) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { comics, loading } = useComics(selectedGenre, searchQuery);
  const { user } = useAuth();
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks(user?.id);

  const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life'];

  const handleBookmarkToggle = (comicId: string) => {
    if (!user) return;
    if (isBookmarked(comicId)) {
      removeBookmark(comicId);
    } else {
      addBookmark(comicId);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Browse Comics</h1>
        <div className="space-y-4">
          <SearchBar onSearch={setSearchQuery} />
          <FilterBar
            genres={genres}
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <ComicGrid
          comics={comics}
          isBookmarked={user ? isBookmarked : undefined}
          onBookmarkToggle={user ? handleBookmarkToggle : undefined}
          onComicClick={onComicClick}
        />
      )}
    </div>
  );
}
