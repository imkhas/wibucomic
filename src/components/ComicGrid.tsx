import { Comic } from '../types/database';
import { ComicCard } from './ComicCard';

interface ComicGridProps {
  comics: Comic[];
  isBookmarked?: (comicId: string) => boolean;
  onBookmarkToggle?: (comicId: string) => void;
  onComicClick: (comic: Comic) => void;
}

export function ComicGrid({
  comics,
  isBookmarked,
  onBookmarkToggle,
  onComicClick
}: ComicGridProps) {
  if (comics.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No comics found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {comics.map((comic) => (
        <ComicCard
          key={comic.id}
          comic={comic}
          isBookmarked={isBookmarked?.(comic.id)}
          onBookmarkToggle={onBookmarkToggle ? () => onBookmarkToggle(comic.id) : undefined}
          onClick={() => onComicClick(comic)}
        />
      ))}
    </div>
  );
}
