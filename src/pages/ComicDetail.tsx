import { Book, BookMarked, Play, Clock, List, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useMangaDexManga, useMangaDexChapters, Chapter } from '../hooks/useMangaDex';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { useLanguage } from '../contexts/LanguageContext';

interface ComicDetailProps {
  comicId: string;
  onStartReading: (chapterId?: string) => void;
  onBack: () => void;
}

export function ComicDetail({ comicId, onStartReading, onBack }: ComicDetailProps) {
  const { selectedLanguage, availableLanguages } = useLanguage();
  const currentLanguageName = availableLanguages.find(l => l.code === selectedLanguage)?.name || 'selected language';
  const { comic, loading } = useMangaDexManga(comicId);
  const { chapters, loading: chaptersLoading } = useMangaDexChapters(comicId, comic?.title);
  const { user } = useAuth();
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks(user?.id);
  const { progress } = useReadingProgress(user?.id, comicId);
  const [showChapters, setShowChapters] = useState(false);

  // Get all unique scanlators for filtering
  const allScanlators = useMemo(() => {
    const groups = new Set<string>();
    chapters.forEach(ch => {
      if (ch.scanlatorGroup) groups.add(ch.scanlatorGroup);
    });
    return Array.from(groups).sort();
  }, [chapters]);

  const [selectedScanlator, setSelectedScanlator] = useState<string>('all');

  // Filter chapters by selected scanlator
  const filteredChapters = useMemo(() => {
    if (selectedScanlator === 'all') return chapters;
    return chapters.filter(ch => ch.scanlatorGroup === selectedScanlator);
  }, [chapters, selectedScanlator]);

  // Group chapters by chapter number
  const groupedChapters = useMemo(() => {
    return (filteredChapters as Chapter[]).reduce((acc, chapter) => {
      const chNum = chapter.chapter || '0';
      if (!acc[chNum]) {
        acc[chNum] = [];
      }
      acc[chNum].push(chapter);
      return acc;
    }, {} as Record<string, Chapter[]>);
  }, [filteredChapters]);

  // Sort chapter numbers
  const sortedChapterNumbers = useMemo(() => {
    return Object.keys(groupedChapters).sort((a, b) =>
      parseFloat(a) - parseFloat(b)
    );
  }, [groupedChapters]);

  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const handleBookmarkToggle = () => {
    if (!user) return;
    if (isBookmarked(comic!.id)) {
      removeBookmark(comic!.id);
    } else {
      addBookmark(comic!.id);
    }
  };

  const handleReadChapter = (chapterId: string) => {
    onStartReading(chapterId);
  };

  const toggleChapterExpand = (chNum: string) => {
    setExpandedChapter(expandedChapter === chNum ? null : chNum);
  };

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

  const latestChapterNum = sortedChapterNumbers[sortedChapterNumbers.length - 1];
  const firstChapterId = sortedChapterNumbers.length > 0 ? groupedChapters[sortedChapterNumbers[0]][0].id : undefined;

  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
      >
        ← Back to Browse
      </button>

      <div className="grid md:grid-cols-[300px,1fr] gap-8">
        {/* Left Column - Cover and Actions */}
        <div className="space-y-4">
          <div className="aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-lg">
            {comic.cover_image ? (
              <img
                src={comic.cover_image}
                alt={comic.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Book className="w-20 h-20 text-gray-400" />
              </div>
            )}
          </div>

          <button
            onClick={() => firstChapterId && handleReadChapter(firstChapterId)}
            disabled={!firstChapterId}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5" />
            {!firstChapterId ? 'No Chapters Available' : 'Start Reading'}
          </button>

          {user && (
            <button
              onClick={handleBookmarkToggle}
              className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold transition-colors ${isBookmarked(comic.id)
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <BookMarked className="w-5 h-5" />
              {isBookmarked(comic.id) ? 'Remove Bookmark' : 'Add Bookmark'}
            </button>
          )}

          {sortedChapterNumbers.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowChapters(!showChapters)}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <List className="w-5 h-5" />
                {showChapters ? 'Hide Chapters' : `View ${sortedChapterNumbers.length} Chapters`}
              </button>

              {showChapters && allScanlators.length > 1 && (
                <div className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Filter className="w-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Filter Scanlator</span>
                  </div>
                  <select
                    value={selectedScanlator}
                    onChange={(e) => setSelectedScanlator(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none transition-all hover:bg-white cursor-pointer"
                  >
                    <option value="all">All Scanlators</option>
                    {allScanlators.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Details */}
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
            <span className={`px-4 py-2 rounded-lg font-medium ${comic.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : 'bg-orange-100 text-orange-800'
              }`}>
              {comic.status}
            </span>
            <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center gap-2">
              <Book className="w-4 h-4" />
              {sortedChapterNumbers.length} Chapters
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
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {sortedChapterNumbers.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Book className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-900 font-semibold">No {currentLanguageName} chapters found</p>
                      <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                        This series might not have been translated into {currentLanguageName} yet, or it may only be available on official licensed platforms.
                      </p>
                    </div>
                  ) : (
                    sortedChapterNumbers.map((chNum) => (
                      <div key={chNum} className="space-y-1">
                        <button
                          onClick={() => toggleChapterExpand(chNum)}
                          className={`w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all hover:shadow-md group flex items-center justify-between ${expandedChapter === chNum ? 'border-blue-300 bg-blue-50 shadow-md' : ''
                            }`}
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              Chapter {chNum}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {groupedChapters[chNum].length} scanlator{groupedChapters[chNum].length > 1 ? 's' : ''} available
                            </div>
                          </div>
                          <List className={`w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors transform transition-transform ${expandedChapter === chNum ? 'rotate-180' : ''}`} />
                        </button>

                        {(expandedChapter === chNum || selectedScanlator !== 'all') && (
                          <div className="ml-4 space-y-1 mt-1 pb-2">
                            {groupedChapters[chNum].map((chapter) => (
                              <button
                                key={chapter.id}
                                onClick={() => handleReadChapter(chapter.id)}
                                className="w-full text-left p-3 pl-5 bg-gray-50 border border-gray-100 rounded-lg hover:bg-blue-100 hover:border-blue-200 transition-all flex items-center justify-between group/scanlator"
                              >
                                <div>
                                  <div className="text-sm font-medium text-gray-700 group-hover/scanlator:text-blue-700">
                                    {chapter.scanlatorGroup}
                                  </div>
                                  {chapter.title && (
                                    <div className="text-xs text-gray-500 mt-0.5 italic">
                                      {chapter.title}
                                    </div>
                                  )}
                                </div>
                                <Play className="w-4 h-4 text-gray-400 group-hover/scanlator:text-blue-600" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
