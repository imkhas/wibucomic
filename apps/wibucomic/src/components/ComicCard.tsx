import React from 'react';
import { Link } from 'react-router-dom';
import type { Comic } from '../lib/supabase';

interface ComicCardProps {
  comic: Comic;
}

export const ComicCard: React.FC<ComicCardProps> = ({ comic }) => {
  return (
    <Link
      to={`/comic/${comic.id}`}
      className="group relative flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px] transition-transform duration-300 hover:scale-105 cursor-pointer"
    >
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-800">
        {comic.cover_image ? (
          <img
            src={comic.cover_image}
            alt={comic.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <span className="text-gray-600 text-4xl">📚</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1">
            <span className="uppercase">{comic.type}</span>
            {comic.rating && (
              <>
                <span>•</span>
                <span>⭐ {comic.rating.toFixed(1)}</span>
              </>
            )}
          </div>
          <p className="text-white text-sm line-clamp-2">{comic.description}</p>
        </div>
      </div>

      <div className="mt-2">
        <h3 className="text-white text-sm font-semibold line-clamp-2 group-hover:text-emerald-400 transition-colors">
          {comic.title}
        </h3>
        {comic.genres && comic.genres.length > 0 && (
          <p className="text-gray-400 text-xs mt-1 line-clamp-1">
            {comic.genres.slice(0, 2).join(', ')}
          </p>
        )}
      </div>
    </Link>
  );
};
