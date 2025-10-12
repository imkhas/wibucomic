import { useState } from 'react';
import { TrendingUp, Star } from 'lucide-react';
import { useComics } from '../hooks/useComics';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { ComicGrid } from '../components/ComicGrid';
import { Comic } from '../types/database';

interface HomeProps {
  onComicClick: (comic: Comic) => void;
}

export function Home({ onComicClick }: HomeProps) {
  const { comics, loading } = useComics();
  const { user } = useAuth();
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks(user?.id);

  const handleBookmarkToggle = (comicId: string) => {
    if (!user) return;
    if (isBookmarked(comicId)) {
      removeBookmark(comicId);
    } else {
      addBookmark(comicId);
    }
  };

  const featuredComics = comics.slice(0, 4);
  const trendingComics = comics.slice(4, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-12">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold mb-4">Welcome to ComicVerse</h1>
          <p className="text-xl text-blue-100 mb-8">
            Discover and read thousands of comics from various genres. Start your adventure today!
          </p>
          <div className="flex gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="text-3xl font-bold">{comics.length}+</div>
              <div className="text-sm text-blue-100">Comics Available</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="text-3xl font-bold">10+</div>
              <div className="text-sm text-blue-100">Genres</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-6">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          <h2 className="text-3xl font-bold text-gray-900">Featured Comics</h2>
        </div>
        <ComicGrid
          comics={featuredComics}
          isBookmarked={user ? isBookmarked : undefined}
          onBookmarkToggle={user ? handleBookmarkToggle : undefined}
          onComicClick={onComicClick}
        />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900">Trending Now</h2>
        </div>
        <ComicGrid
          comics={trendingComics}
          isBookmarked={user ? isBookmarked : undefined}
          onBookmarkToggle={user ? handleBookmarkToggle : undefined}
          onComicClick={onComicClick}
        />
      </section>
    </div>
  );
}
