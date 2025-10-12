import { useComicPages } from '../hooks/useComicPages';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { useAuth } from '../contexts/AuthContext';
import { ComicReader } from '../components/ComicReader';

interface ReaderProps {
  comicId: string;
  onClose: () => void;
}

export function Reader({ comicId, onClose }: ReaderProps) {
  const { pages, loading } = useComicPages(comicId);
  const { user } = useAuth();
  const { progress, updateProgress } = useReadingProgress(user?.id, comicId);

  const handlePageChange = (page: number) => {
    if (user) {
      updateProgress(comicId, page);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center">
          <p className="text-xl mb-4">No pages available</p>
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

  return (
    <ComicReader
      pages={pages}
      initialPage={progress?.current_page || 1}
      onClose={onClose}
      onPageChange={handlePageChange}
    />
  );
}
