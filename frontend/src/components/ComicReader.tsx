import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ComicPage } from '../types/database';

interface ComicReaderProps {
  pages: ComicPage[];
  initialPage?: number;
  onClose: () => void;
  onPageChange?: (page: number) => void;
}

export function ComicReader({ pages, initialPage = 1, onClose, onPageChange }: ComicReaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  useEffect(() => {
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  const goToNextPage = () => {
    if (currentPage < pages.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const currentPageData = pages.find(p => p.page_number === currentPage);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevPage();
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <span className="text-lg font-medium">
            Page {currentPage} of {pages.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage === pages.length}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {currentPageData && (
          <img
            src={currentPageData.image_url}
            alt={`Page ${currentPage}`}
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      <div className="bg-gray-900 px-4 py-2">
        <input
          type="range"
          min="1"
          max={pages.length}
          value={currentPage}
          onChange={(e) => setCurrentPage(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
