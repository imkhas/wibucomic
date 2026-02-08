import { Book, BookMarked } from 'lucide-react';
import { Comic } from '../types/database';

interface ComicCardProps {
  comic: Comic;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  onClick: () => void;
}

export function ComicCard({ comic, isBookmarked, onBookmarkToggle, onClick }: ComicCardProps) {
  return (
    <div className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer">
      <div onClick={onClick} className="relative aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200">
        {comic.cover_image ? (
          <img
            src={comic.cover_image}
            alt={comic.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Book className="w-20 h-20 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div onClick={onClick} className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 line-clamp-1 mb-1">
          {comic.title}
        </h3>

        {comic.author && (
          <p className="text-sm text-gray-600 mb-2">by {comic.author}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {comic.genre && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                {comic.genre}
              </span>
            )}
            {comic.status && (
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                comic.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {comic.status}
              </span>
            )}
          </div>

          {onBookmarkToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookmarkToggle();
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <BookMarked
                className={`w-5 h-5 ${
                  isBookmarked ? 'fill-red-500 text-red-500' : 'text-gray-400'
                }`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
