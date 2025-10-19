import { useState, useEffect } from 'react';
import { useMangaDexChapters } from '../hooks/useMangaDex';
import { useMangaDexReader } from '../hooks/useMangaDexReader';
import { useAuth } from '../contexts/AuthContext';
import { ComicReader } from '../components/ComicReader';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ReaderProps {
  comicId: string;
  chapterId?: string | null;
  onClose: () => void;
}

export function Reader({ comicId, chapterId, onClose }: ReaderProps) {
  const { user } = useAuth();
  const { chapters, loading: chaptersLoading } = useMangaDexChapters(comicId);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(chapterId || null);
  const { pages, loading: pagesLoading } = useMangaDexReader(selectedChapterId || '');

  // Get sorted English chapters
  const englishChapters = chapters
    .filter(ch => ch.attributes.translatedLanguage === 'en')
    .sort((a, b) => {
      const chapterA = parseFloat(a.attributes.chapter || '0');
      const chapterB = parseFloat(b.attributes.chapter || '0');
      return chapterA - chapterB;
    });

  // Auto-select chapter
  useEffect(() => {
    if (englishChapters.length > 0 && !selectedChapterId) {
      // Use provided chapterId or default to first chapter
      if (chapterId) {
        setSelectedChapterId(chapterId);
      } else {
        setSelectedChapterId(englishChapters[0].id);
      }
    }
  }, [chapters, selectedChapterId, chapterId, englishChapters]);

  const currentChapterIndex = englishChapters.findIndex(ch => ch.id === selectedChapterId);
  const currentChapter = englishChapters[currentChapterIndex];

  const goToNextChapter = () => {
    if (currentChapterIndex < englishChapters.length - 1) {
      setSelectedChapterId(englishChapters[currentChapterIndex + 1].id);
    }
  };

  const goToPrevChapter = () => {
    if (currentChapterIndex > 0) {
      setSelectedChapterId(englishChapters[currentChapterIndex - 1].id);
    }
  };

  if (chaptersLoading || !selectedChapterId) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white">Loading chapters...</p>
        </div>
      </div>
    );
  }

  if (englishChapters.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center">
          <p className="text-xl mb-4">No English chapters available</p>
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
            Chapter {currentChapter?.attributes.chapter || 'Unknown'}
          </p>
          <div className="flex gap-4 justify-center">
            {currentChapterIndex > 0 && (
              <button
                onClick={goToPrevChapter}
                className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous Chapter
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
            {currentChapterIndex < englishChapters.length - 1 && (
              <button
                onClick={goToNextChapter}
                className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
              >
                Next Chapter
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ComicReader
        pages={pages}
        initialPage={1}
        onClose={onClose}
        onPageChange={(page) => {
          // Optional: Save reading progress
          if (user) {
            console.log('Page changed:', page, 'Chapter:', selectedChapterId);
          }
        }}
      />
      
      {/* Chapter navigation overlay */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] bg-gray-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4">
        <button
          onClick={goToPrevChapter}
          disabled={currentChapterIndex === 0}
          className="flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed hover:text-blue-400 transition-colors"
          title="Previous Chapter"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Prev</span>
        </button>
        
        <div className="text-center px-4 border-l border-r border-gray-700">
          <div className="text-sm font-semibold">
            Chapter {currentChapter?.attributes.chapter || 'Unknown'}
          </div>
          {currentChapter?.attributes.title && (
            <div className="text-xs text-gray-400 max-w-[200px] truncate">
              {currentChapter.attributes.title}
            </div>
          )}
        </div>
        
        <button
          onClick={goToNextChapter}
          disabled={currentChapterIndex === englishChapters.length - 1}
          className="flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed hover:text-blue-400 transition-colors"
          title="Next Chapter"
        >
          <span className="text-sm font-medium">Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}