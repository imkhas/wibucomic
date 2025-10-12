import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { ContentRow } from '../components/ContentRow';
import { supabase, type Comic, type Chapter } from '../lib/supabase';

export const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [comic, setComic] = useState<Comic | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchComic();
      fetchChapters();
    }
  }, [id]);

  const fetchComic = async () => {
    try {
      const { data, error } = await supabase
        .from('comics')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        setComic(data);
      }
    } catch (err) {
      console.error('Error fetching comic:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('comic_id', id)
        .order('chapter_number', { ascending: true });

      if (!error && data) {
        setChapters(data);
      }
    } catch (err) {
      console.error('Error fetching chapters:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen pt-24 pb-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-800 rounded-lg mb-8" />
            <div className="h-8 bg-gray-800 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-800 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!comic) {
    return (
      <div className="bg-black min-h-screen pt-24 pb-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-white mb-4">Comic Not Found</h1>
            <Link to="/">
              <Button variant="primary">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          {comic.banner_image || comic.cover_image ? (
            <img
              src={comic.banner_image || comic.cover_image}
              alt={comic.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-black to-gray-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>
      </div>

      <div className="relative -mt-40 pb-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            <div className="flex-shrink-0">
              <div className="w-48 sm:w-56 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl bg-gray-800 border-2 border-gray-700">
                {comic.cover_image ? (
                  <img
                    src={comic.cover_image}
                    alt={comic.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <span className="text-gray-600 text-6xl">📚</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-emerald-600 text-white text-sm font-bold uppercase rounded">
                  {comic.type}
                </span>
                {comic.rating && (
                  <span className="flex items-center gap-1 text-emerald-400 text-base font-semibold">
                    ⭐ {comic.rating.toFixed(1)}
                  </span>
                )}
                {comic.release_year && (
                  <span className="text-gray-300 text-base">{comic.release_year}</span>
                )}
                <span className="px-2 py-1 bg-gray-800 text-gray-300 text-sm font-medium uppercase rounded border border-gray-700">
                  {comic.status}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                {comic.title}
              </h1>

              {comic.genres && comic.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {comic.genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-gray-800/80 text-gray-300 text-sm font-medium rounded-full border border-gray-700"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-gray-300 text-base leading-relaxed mb-6">
                {comic.description}
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                {chapters.length > 0 ? (
                  <Button variant="primary" size="lg">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Start Reading
                  </Button>
                ) : (
                  <Button variant="secondary" size="lg" disabled>
                    No Chapters Available
                  </Button>
                )}

                <Button variant="ghost" size="lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add to List
                </Button>

                <Button variant="ghost" size="lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  Favorite
                </Button>
              </div>

              {chapters.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">
                    Chapters ({chapters.length})
                  </h2>
                  <div className="bg-gray-900/50 rounded-lg border border-gray-800 max-h-96 overflow-y-auto">
                    {chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className="flex items-center justify-between p-4 border-b border-gray-800 last:border-b-0 hover:bg-gray-800/50 transition-colors cursor-pointer"
                      >
                        <div>
                          <h3 className="text-white font-medium">
                            Chapter {chapter.chapter_number}
                            {chapter.title && `: ${chapter.title}`}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {new Date(chapter.release_date).toLocaleDateString()}
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-emerald-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Similar {comic.type}</h2>
            <ContentRow title={`More ${comic.type}`} type={comic.type} />
            {comic.genres && comic.genres[0] && (
              <ContentRow title={`More ${comic.genres[0]}`} genre={comic.genres[0]} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
