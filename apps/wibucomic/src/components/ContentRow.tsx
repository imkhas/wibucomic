import React, { useEffect, useState, useRef } from 'react';
import { ComicCard } from './ComicCard';
import { supabase, type Comic } from '../lib/supabase';

interface ContentRowProps {
  title: string;
  type?: 'manga' | 'manhwa' | 'comic' | 'manhua';
  genre?: string;
}

export const ContentRow: React.FC<ContentRowProps> = ({ title, type, genre }) => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComics();
  }, [type, genre]);

  const fetchComics = async () => {
    try {
      let query = supabase.from('comics').select('*');

      if (type) {
        query = query.eq('type', type);
      }

      if (genre) {
        query = query.contains('genres', [genre]);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(20);

      if (!error && data) {
        setComics(data);
      }
    } catch (err) {
      console.error('Error fetching comics:', err);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -800 : 800;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      setScrollPosition(scrollRef.current.scrollLeft);
    }
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight =
    scrollRef.current &&
    scrollPosition < scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10;

  if (loading) {
    return (
      <div className="mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 px-4 sm:px-6 lg:px-8">
          {title}
        </h2>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px] aspect-[2/3] bg-gray-800 rounded-md animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (comics.length === 0) {
    return null;
  }

  return (
    <div className="mb-10 group/row">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 px-4 sm:px-6 lg:px-8">
        {title}
      </h2>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-black to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 flex items-center justify-center hover:scale-110"
            aria-label="Scroll left"
          >
            <svg
              className="w-8 h-8 text-white drop-shadow-lg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-black to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 flex items-center justify-center hover:scale-110"
            aria-label="Scroll right"
          >
            <svg
              className="w-8 h-8 text-white drop-shadow-lg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {comics.map((comic) => (
            <ComicCard key={comic.id} comic={comic} />
          ))}
        </div>
      </div>
    </div>
  );
};
