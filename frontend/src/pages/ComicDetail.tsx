import { Book, BookMarked, Play, Clock } from 'lucide-react';
import { useComic } from '../hooks/useComics';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { useReadingProgress } from '../hooks/useReadingProgress';

interface ComicDetailProps {
  comicId: string;
  onStartReading: () => void;
  onBack: () => void;
}

export function ComicDetail({ comicId, onStartReading, onBack }: ComicDetailProps) {
  const { comic, loading } = useComic(comicId);
  const { user } = useAuth();
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks(user?.id);
  const { progress } = useReadingProgress(user?.id, comicId);

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
        <p className="text-gray-500 text-lg">Comic not found</p>
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
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Play className="w-5 h-5" />
            {progress ? `Continue Reading (Page ${progress.current_page})` : 'Start Reading'}
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
              {comic.total_pages} Pages
            </span>
          </div>

          {progress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-900 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Your Progress</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Page {progress.current_page} of {comic.total_pages}</span>
                  <span>{Math.round((progress.current_page / comic.total_pages) * 100)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(progress.current_page / comic.total_pages) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {comic.description && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">{comic.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
