import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { supabase, type Comic } from '../lib/supabase';

export const Hero: React.FC = () => {
  const [featuredComic, setFeaturedComic] = useState<Comic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedComic();
  }, []);

  const fetchFeaturedComic = async () => {
    try {
      const { data, error } = await supabase
        .from('comics')
        .select('*')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setFeaturedComic(data);
      }
    } catch (err) {
      console.error('Error fetching featured comic:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative h-[70vh] sm:h-[80vh] bg-gradient-to-b from-gray-900 to-black animate-pulse" />
    );
  }

  if (!featuredComic) {
    return (
      <div className="relative h-[70vh] sm:h-[80vh] bg-gradient-to-br from-emerald-950 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4">
            Welcome to WIBUCOMIC
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
            Discover unlimited manga, manhwa, comics, and manhua
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[70vh] sm:h-[80vh] overflow-hidden">
      <div className="absolute inset-0">
        {featuredComic.banner_image ? (
          <img
            src={featuredComic.banner_image}
            alt={featuredComic.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-black to-gray-900" />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      <div className="relative h-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-2xl pt-20">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold uppercase rounded">
              {featuredComic.type}
            </span>
            {featuredComic.rating && (
              <span className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                ⭐ {featuredComic.rating.toFixed(1)}
              </span>
            )}
            {featuredComic.release_year && (
              <span className="text-gray-300 text-sm">{featuredComic.release_year}</span>
            )}
            <span className="px-2 py-0.5 bg-gray-800/80 text-gray-300 text-xs font-medium uppercase rounded">
              {featuredComic.status}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            {featuredComic.title}
          </h1>

          <p className="text-base sm:text-lg text-gray-200 mb-6 sm:mb-8 line-clamp-3 sm:line-clamp-4 leading-relaxed">
            {featuredComic.description}
          </p>

          {featuredComic.genres && featuredComic.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
              {featuredComic.genres.slice(0, 4).map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-gray-800/80 text-gray-300 text-xs font-medium rounded-full border border-gray-700"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link to={`/comic/${featuredComic.id}`}>
              <Button variant="primary" size="lg">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Read Now
              </Button>
            </Link>

            <Button variant="ghost" size="lg">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              More Info
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
