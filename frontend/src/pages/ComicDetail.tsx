import { Book, BookMarked, Play, Clock, List } from 'lucide-react';
import { useState } from 'react';
import { useMangaDexManga, useMangaDexChapters } from '../hooks/useMangaDex';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { useReadingProgress } from '../hooks/useReadingProgress';

interface ComicDetailProps {
  comicId: string;
  onStartReading: () => void;
  onBack: () => void;
}

export function ComicDetail({ comicId, onStartReading, onBack }: ComicDetailProps) {
  const { comic, loading } = useMangaDexManga(comicId);
  const { chapters, loading: chaptersLoading } = useMangaDexChapters(comicId);
  const { user } = useAuth();
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks(user?.id);
  const { progress } = useReadingProgress(user?.id, comicId);
  const [showChapters, setShowChapters] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!comic) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Manga not found</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const handleBookmarkToggle = () => {
    if (!user) return;
    if (isBookmarked(comic.id)) {
      removeBookmark(comic.id);
    } else {
      addBookmark(comic.id);
    }
  };

  // Get English chapters and sort by chapter number
  const englishChapters = chapters
    .filter(ch => ch.attributes.translatedLanguage === 'en')
    .sort((a, b) => {
      const chapterA = parseFloat(a.attributes.chapter || '0');
      const chapterB = parseFloat(b.attributes.chapter || '0');
      return chapterA - chapterB;
    });

  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Back
      </button>

      <div className="grid md:grid-cols-[300px,1fr] gap-8">
        <div className="space-y-4">
          <div className="aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-lg">
            {comic.cover_image ? (
              <img
                src={comic.cover_image}
                alt={comic.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Book className="w-20 h-20 text-gray-400" />
              </div>
            )}
          </div>

          <button
            onClick={onStartReading}
            disabled={englishChapters.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5" />
            {englishChapters.length === 0 ? 'No Chapters Available' : 'Start Reading'}
          </button>

          {user && (
            <button
              onClick={handleBookmarkToggle}
              className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold transition-colors ${
                isBookmarked(comic.id)
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BookMarked className="w-5 h-5" />
              {isBookmarked(comic.id) ? 'Remove Bookmark' : 'Add Bookmark'}
            </button>
          )}

          {englishChapters.length > 0 && (
            <button
              onClick={() => setShowChapters(!showChapters)}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <List className="w-5 h-5" />
              {showChapters ? 'Hide Chapters' : `View ${englishChapters.length} Chapters`}
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{comic.title}</h1>
            {comic.author && (
              <p className="text-xl text-gray-600">by {comic.author}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {comic.genre && (
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                {comic.genre}
              </span>
            )}
            <span className={`px-4 py-2 rounded-lg font-medium ${
              comic.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-orange-100 text-orange-800'
            }`}>
              {comic.status}
            </span>
            <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center gap-2">
              <Book className="w-4 h-4" />
              {englishChapters.length} Chapters
            </span>
          </div>

          {progress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-900 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Your Progress</span>
              </div>
              <p className="text-sm text-blue-700">
                Last read: Chapter {progress.current_page}
              </p>
            </div>
          )}

          {comic.description && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{comic.description}</p>
            </div>
          )}

          {showChapters && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Chapters</h2>
              {chaptersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {englishChapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => {
                        // TODO: Navigate to reader with chapter ID
                        console.log('Read chapter:', chapter.id);
                      }}
                      className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="font-semibold text-gray-900">
                        Chapter {chapter.attributes.chapter || 'Unknown'}
                      </div>
                      {chapter.attributes.title && (
                        <div className="text-sm text-gray-600 mt-1">
                          {chapter.attributes.title}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {chapter.attributes.pages} pages
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}