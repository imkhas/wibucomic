import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Comic } from '../types/database';
import * as MangaDexAPI from '../services/mangadex';

interface ReadingHistoryEntry {
  id: string;
  comic_id: string;
  current_page: number;
  last_read_at: string;
  comic?: Comic;
}

interface ReadingHistoryProps {
  onComicClick: (comic: Comic) => void;
}

export function ReadingHistory({ onComicClick }: ReadingHistoryProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<ReadingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  async function fetchHistory() {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get reading progress ordered by date
      const { data: progressData, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('last_read_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (progressData && progressData.length > 0) {
        // Fetch manga details for each entry
        const historyWithManga = await Promise.all(
          progressData.map(async (entry) => {
            try {
              const response = await MangaDexAPI.getMangaById(entry.comic_id) as any;
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

              const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Unknown';
              const genre = MangaDexAPI.extractGenreFromTags(manga.attributes.tags);

              const comic: Comic = {
                id: manga.id,
                title,
                description: null,
                author: null,
                cover_image: coverUrl || null,
                genre,
                status: manga.attributes.status === 'completed' ? 'completed' : 'ongoing',
                total_pages: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              return {
                ...entry,
                comic,
              };
            } catch (err) {
              console.error('Failed to fetch manga:', entry.comic_id);
              return { ...entry, comic: undefined };
            }
          })
        );

        setHistory(historyWithManga.filter(h => h.comic !== undefined));
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }

  const groupByDate = (entries: ReadingHistoryEntry[]) => {
    const groups: { [key: string]: ReadingHistoryEntry[] } = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.last_read_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });
    
    return groups;
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Please sign in to view your reading history</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const groupedHistory = groupByDate(history);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-2">
        <Clock className="w-8 h-8 text-blue-600" />
        <h1 className="text-4xl font-bold text-gray-900">Reading History</h1>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No reading history yet</p>
          <p className="text-gray-400">Start reading to track your progress!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(([date, entries]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5" />
                <h2 className="text-lg font-semibold">{date}</h2>
              </div>

              <div className="space-y-3 pl-7 border-l-2 border-gray-200">
                {entries.map((entry) => (
                  entry.comic && (
                    <div
                      key={entry.id}
                      onClick={() => onComicClick(entry.comic!)}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group flex gap-4"
                    >
                      <div className="w-16 h-24 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded overflow-hidden">
                        {entry.comic.cover_image && (
                          <img
                            src={entry.comic.cover_image}
                            alt={entry.comic.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {entry.comic.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Read chapter {entry.current_page}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(entry.last_read_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}