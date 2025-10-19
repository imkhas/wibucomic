import { useState, useEffect } from 'react';
import { useMangaDexSearch, useMangaDexPopular } from '../hooks/useMangaDex';
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const { user } = useAuth();
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks(user?.id);
  
  // Use MangaDex search when there's a search query
  const { comics: searchResults, loading: searchLoading } = useMangaDexSearch(debouncedSearch);
  
  // Use MangaDex popular when browsing without search
  const { comics: popularComics, loading: popularLoading } = useMangaDexPopular(40);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Determine which comics to show
  const comics = debouncedSearch ? searchResults : popularComics;
  const loading = debouncedSearch ? searchLoading : popularLoading;
  
  // Filter by genre if selected
  const filteredComics = selectedGenre
    ? comics.filter(comic => 
        comic.genre?.toLowerCase().includes(selectedGenre.toLowerCase())
      )
    : comics;

  const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Thriller', 'Supernatural'];

  const handleBookmarkToggle = (comicId: string) => {
    if (!user) return;
    if (isBookmarked(comicId)) {
      removeBookmark(comicId);
    } else {
      addBookmark(comicId);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedGenre(null); // Reset genre filter when searching
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Browse Manga</h1>
        <div className="space-y-4">
          <SearchBar 
            onSearch={handleSearch} 
            placeholder="Search manga on MangaDex..." 
          />
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
        <>
          {debouncedSearch && (
            <p className="text-gray-600">
              Found {filteredComics.length} results for "{debouncedSearch}"
            </p>
          )}
          {!debouncedSearch && filteredComics.length > 0 && (
            <p className="text-gray-600">
              Showing {filteredComics.length} popular manga
            </p>
          )}
          <ComicGrid
            comics={filteredComics}
            isBookmarked={user ? isBookmarked : undefined}
            onBookmarkToggle={user ? handleBookmarkToggle : undefined}
            onComicClick={onComicClick}
          />
        </>
      )}
    </div>
  );
}