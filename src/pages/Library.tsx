import { useState, useEffect } from 'react';
import { BookMarked, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { supabase } from '../lib/supabase';
import type { Comic } from '../types/database';
import { ComicGrid } from '../components/ComicGrid';
import * as MangaDexAPI from '../services/mangadex';

interface LibraryProps {
  onComicClick: (comic: Comic) => void;
}

interface MangaDexResponse {
  data: {
    id: string;
    attributes: {
      title: { [key: string]: string };
      description: { [key: string]: string };
      status: string;
      tags: Array<{
        attributes: {
          name: { [key: string]: string };
        };
      }>;
    };
    relationships: Array<{
      id: string;
      type: string;
    }>;
  };
}

interface MangaDexManga {
  id: string;
  attributes: {
    title: { [key: string]: string };
    description: { [key: string]: string };
    status: string;
    tags: Array<{
      attributes: {
        name: { [key: string]: string };
      };
    }>;
  };
  relationships: Array<{
    id: string;
    type: string;
  }>;
}

function convertMangaDexToComic(manga: MangaDexManga, coverUrl?: string): Comic {
  const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Unknown';
  const description = manga.attributes.description.en || Object.values(manga.attributes.description)[0] || null;
  const author = manga.relationships.find(r => r.type === 'author')?.id || null;
  const status = manga.attributes.status === 'completed' ? 'completed' : 'ongoing';
  const genre = MangaDexAPI.extractGenreFromTags(manga.attributes.tags);

  return {
    id: manga.id,
    title,
    description,
    author,
    cover_image: coverUrl || null,
    genre,
    status,
    total_pages: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function Library({ onComicClick }: LibraryProps) {
  const { user } = useAuth();
  const { bookmarks, loading: bookmarksLoading, removeBookmark, isBookmarked } = useBookmarks(user?.id);
  const [bookmarkedComics, setBookmarkedComics] = useState<Comic[]>([]);
  const [readingProgress, setReadingProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'reading'>('bookmarks');

  useEffect(() => {
    if (user) {
      fetchLibraryData();
    } else {
      setBookmarkedComics([]);
      setReadingProgress([]);
      setLoading(false);
    }
  }, [user, bookmarks]);

  async function fetchLibraryData() {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch bookmarked manga from MangaDex
      if (bookmarks.length > 0) {
        const mangaPromises = bookmarks.map(async (bookmark) => {
          try {
            const response = await MangaDexAPI.getMangaById(bookmark.comic_id) as MangaDexResponse;
            const manga = response.data;

            // Get cover art
            const coverRelation = manga.relationships.find((r: any) => r.type === 'cover_art');
            let coverUrl: string | undefined;

            if (coverRelation) {
              try {
                coverUrl = await MangaDexAPI.getCoverImageUrl(manga.id, coverRelation.id);
              } catch (err) {
                console.error('Failed to fetch cover for', manga.id);
              }
            }

            return convertMangaDexToComic(manga, coverUrl);
          } catch (err) {
            console.error('Failed to fetch manga:', bookmark.comic_id);
            return null;
          }
        });

        const mangaResults = await Promise.all(mangaPromises);
        const validManga = mangaResults.filter((m): m is Comic => m !== null);
        setBookmarkedComics(validManga);
      } else {
        setBookmarkedComics([]);
      }

      // Fetch reading progress
      const { data: progressData, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('last_read_at', { ascending: false });

      if (error) throw error;

      // Fetch manga details for reading progress
      if (progressData && progressData.length > 0) {
        const progressMangaPromises = progressData.map(async (progress) => {
          try {
            const response = await MangaDexAPI.getMangaById(progress.comic_id) as MangaDexResponse;
            const manga = response.data;

            const coverRelation = manga.relationships.find((r: any) => r.type === 'cover_art');
            let coverUrl: string | undefined;

            if (coverRelation) {
              try {
                coverUrl = await MangaDexAPI.getCoverImageUrl(manga.id, coverRelation.id);
              } catch (err) {
                console.error('Failed to fetch cover');
              }
            }

            const comic = convertMangaDexToComic(manga, coverUrl);
            return {
              ...comic,
              current_page: progress.current_page,
              last_read_at: progress.last_read_at,
            };
          } catch (err) {
            console.error('Failed to fetch manga:', progress.comic_id);
            return null;
          }
        });

        const progressResults = await Promise.all(progressMangaPromises);
        const validProgress = progressResults.filter((p): p is any => p !== null);
        setReadingProgress(validProgress);
      } else {
        setReadingProgress([]);
      }
    } catch (err) {
      console.error('Failed to fetch library data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <BookMarked className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">Please sign in to view your library</p>
        <p className="text-gray-400 text-sm">Track your reading progress and bookmarks</p>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookMarked className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">My Library</h1>
        </div>

        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'bookmarks'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4" />
              <span>Bookmarks ({bookmarkedComics.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reading')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'reading'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Reading ({readingProgress.length})</span>
            </div>
          </button>
        </div>
      </div>

      {activeTab === 'bookmarks' ? (
        bookmarkedComics.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookMarked className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No bookmarks yet</p>
            <p className="text-gray-400">Start bookmarking manga to build your collection!</p>
          </div>
        ) : (
          <ComicGrid
            comics={bookmarkedComics}
            isBookmarked={isBookmarked}
            onBookmarkToggle={removeBookmark}
            onComicClick={onComicClick}
          />
        )
      ) : (
        readingProgress.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No reading progress</p>
            <p className="text-gray-400">Start reading manga to track your progress!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {readingProgress.map((item) => (
              <div
                key={item.id}
                onClick={() => onComicClick(item)}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex gap-4 p-4">
                  <div className="w-24 h-36 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded overflow-hidden">
                    {item.cover_image ? (
                      <img
                        src={item.cover_image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookMarked className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.genre && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {item.genre}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        item.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Currently on chapter {item.current_page}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Last read: {new Date(item.last_read_at).toLocaleDateString()}</span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((item.current_page / (item.total_pages || 100)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}