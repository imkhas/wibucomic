import { useState, useEffect } from 'react';
import { TrendingUp, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Comic } from '../types/database';
import * as MangaDexAPI from '../services/mangadex';

interface TrendingManga {
  manga_id: string;
  title: string;
  mention_count: number;
  sentiment_score: number;
  last_updated: string;
}

interface TrendingSectionProps {
  onComicClick: (comic: Comic) => void;
}

export function TrendingSection({ onComicClick }: TrendingSectionProps) {
  const [trending, setTrending] = useState<TrendingManga[]>([]);
  const [loading, setLoading] = useState(true);
  const [mangaDetails, setMangaDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      setLoading(true);

      // Fetch trending from database
      const { data, error } = await supabase
        .from('trending_manga')
        .select('*')
        .order('mention_count', { ascending: false })
        .limit(10);

      if (error) throw error;

      setTrending(data || []);

      // Fetch manga details for each
      if (data && data.length > 0) {
        const details: Record<string, any> = {};
        
        for (const item of data.slice(0, 5)) {
          try {
            const response = await MangaDexAPI.getMangaById(item.manga_id);
            const manga = response.data;

            // Get cover
            const coverRelation = manga.relationships.find((r: any) => r.type === 'cover_art');
            let coverUrl = null;

            if (coverRelation) {
              try {
                coverUrl = await MangaDexAPI.getCoverImageUrl(manga.id, coverRelation.id);
              } catch (err) {
                console.error('Failed to fetch cover');
              }
            }

            details[item.manga_id] = {
              ...manga,
              coverUrl
            };
          } catch (err) {
            console.error('Failed to fetch manga:', item.manga_id);
          }
        }

        setMangaDetails(details);
      }
    } catch (err) {
      console.error('Failed to fetch trending:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMangaClick = (trendingItem: TrendingManga) => {
    const details = mangaDetails[trendingItem.manga_id];
    if (!details) return;

    const comic: Comic = {
      id: trendingItem.manga_id,
      title: details.attributes.title.en || Object.values(details.attributes.title)[0],
      description: details.attributes.description.en || null,
      author: null,
      cover_image: details.coverUrl,
      genre: MangaDexAPI.extractGenreFromTags(details.attributes.tags),
      status: details.attributes.status === 'completed' ? 'completed' : 'ongoing',
      total_pages: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onComicClick(comic);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-6 h-6 text-orange-600 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-900">Trending on Reddit</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (trending.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Flame className="w-6 h-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-gray-900">Trending on Reddit</h2>
        <span className="ml-auto text-sm text-gray-600">
          Updated {new Date(trending[0].last_updated).toLocaleDateString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trending.slice(0, 5).map((item, index) => {
          const details = mangaDetails[item.manga_id];
          
          return (
            <button
              key={item.manga_id}
              onClick={() => handleMangaClick(item)}
              className="flex items-center gap-4 bg-white rounded-lg p-4 hover:shadow-lg transition-all group text-left"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  #{index + 1}
                </div>
              </div>

              {details?.coverUrl ? (
                <div className="w-16 h-24 flex-shrink-0 rounded overflow-hidden">
                  <img
                    src={details.coverUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              ) : (
                <div className="w-16 h-24 flex-shrink-0 bg-gray-100 rounded" />
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>{item.mention_count} mentions</span>
                  </div>
                  {item.sentiment_score > 0 && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <Flame className="w-4 h-4" />
                      <span>{Math.round(item.sentiment_score)} score</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {trending.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
            View all {trending.length} trending manga →
          </button>
        </div>
      )}
    </div>
  );
}