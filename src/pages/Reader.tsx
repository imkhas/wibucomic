import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMangaDexChapters, Chapter, useMangaDexManga } from '../hooks/useMangaDex';
import { useMangaDexReader } from '../hooks/useMangaDexReader';
import { useAuth } from '../contexts/AuthContext';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { ComicReader } from '../components/ComicReader';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ReaderProps {
  comicId: string;
  chapterId?: string | null;
  onClose: () => void;
}

export function Reader({ comicId, chapterId, onClose }: ReaderProps) {
  const { user } = useAuth();
  const { comic } = useMangaDexManga(comicId);
  const { chapters, loading: chaptersLoading } = useMangaDexChapters(comicId, comic?.title);
  const { updateProgress } = useReadingProgress(user?.id, comicId);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(chapterId || null);

  // Sort all available English chapters
  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => {
      const chapterA = parseFloat(a.chapter || '0');
      const chapterB = parseFloat(b.chapter || '0');
      return chapterA - chapterB;
    });
  }, [chapters]);

  // Find the currently selected chapter object
  const currentChapter = useMemo(() =>
    sortedChapters.find(ch => ch.id === selectedChapterId),
    [sortedChapters, selectedChapterId]
  );

  const { pages, loading: pagesLoading } = useMangaDexReader(selectedChapterId || '', currentChapter?.source);

  // Auto-select initial chapter if none selected
  useEffect(() => {
    if (sortedChapters.length > 0 && !selectedChapterId) {
      if (chapterId) {
        setSelectedChapterId(chapterId);
      } else {
        setSelectedChapterId(sortedChapters[0].id);
      }
    }
  }, [sortedChapters, selectedChapterId, chapterId]);

  const goToNextChapter = () => {
    if (!currentChapter) return;

    const currentNum = parseFloat(currentChapter.chapter || '0');
    // Find chapters with a higher number
    const nextChapters = sortedChapters.filter(ch => parseFloat(ch.chapter || '0') > currentNum);

    if (nextChapters.length > 0) {
      // Try to find the same scanlator for the next chapter number
      const nextNum = parseFloat(nextChapters[0].chapter);
      const sameGroupVersion = nextChapters.find(ch =>
        parseFloat(ch.chapter) === nextNum &&
        ch.scanlatorGroup === currentChapter.scanlatorGroup
      );

      setSelectedChapterId(sameGroupVersion?.id || nextChapters[0].id);
    }
  };

  const goToPrevChapter = () => {
    if (!currentChapter) return;

    const currentNum = parseFloat(currentChapter.chapter || '0');
    // Find chapters with a lower number (sorted desc to get the immediate previous)
    const prevChapters = sortedChapters
      .filter(ch => parseFloat(ch.chapter || '0') < currentNum)
      .reverse();

    if (prevChapters.length > 0) {
      const prevNum = parseFloat(prevChapters[0].chapter);
      const sameGroupVersion = prevChapters.find(ch =>
        parseFloat(ch.chapter) === prevNum &&
        ch.scanlatorGroup === currentChapter.scanlatorGroup
      );

      setSelectedChapterId(sameGroupVersion?.id || prevChapters[0].id);
    }
  };

  // Save reading progress
  const handlePageChange = useCallback((page: number) => {
    if (user && currentChapter) {
      const chapterNumber = parseFloat(currentChapter.chapter || '0');
      updateProgress(comicId, chapterNumber);

      console.log('Progress saved:', {
        manga: comicId,
        chapter: chapterNumber,
        page: page,
      });
    }
  }, [user, comicId, currentChapter, updateProgress]);

  if (chaptersLoading || (sortedChapters.length > 0 && !selectedChapterId)) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white">Loading chapters...</p>
        </div>
      </div>
    );
  }

  if (sortedChapters.length === 0 && !chaptersLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center">
          <p className="text-xl mb-4">No chapters available</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (pagesLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white">Loading pages...</p>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center max-w-md">
          <p className="text-xl mb-4">No pages available for this chapter</p>
          <p className="text-sm text-gray-400 mb-6">
            Chapter {currentChapter?.chapter || 'Unknown'} ({currentChapter?.scanlatorGroup})
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasNext = currentChapter && sortedChapters.some(ch => parseFloat(ch.chapter) > parseFloat(currentChapter.chapter));
  const hasPrev = currentChapter && sortedChapters.some(ch => parseFloat(ch.chapter) < parseFloat(currentChapter.chapter));

  return (
    <>
      <ComicReader
        pages={pages}
        initialPage={1}
        onClose={onClose}
        onPageChange={handlePageChange}
      />

      {/* Chapter navigation overlay */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] bg-gray-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4">
        <button
          onClick={goToPrevChapter}
          disabled={!hasPrev}
          className="flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed hover:text-blue-400 transition-colors"
          title="Previous Chapter"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Prev</span>
        </button>

        <div className="text-center px-4 border-l border-r border-gray-700 max-w-[300px]">
          <div className="text-sm font-semibold truncate">
            Chapter {currentChapter?.chapter || 'Unknown'}
          </div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider truncate">
            {currentChapter?.scanlatorGroup}
          </div>
        </div>

        <button
          onClick={goToNextChapter}
          disabled={!hasNext}
          className="flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed hover:text-blue-400 transition-colors"
          title="Next Chapter"
        >
          <span className="text-sm font-medium">Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {user && (
        <div className="fixed bottom-4 right-4 z-[60] bg-gray-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-xs">
          Progress auto-saved
        </div>
      )}
    </>
  );
}
