interface FilterBarProps {
  genres: string[];
  selectedGenre: string | null;
  onGenreChange: (genre: string | null) => void;
}

export function FilterBar({ genres, selectedGenre, onGenreChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onGenreChange(null)}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          selectedGenre === null
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        All
      </button>
      {genres.map((genre) => (
        <button
          key={genre}
          onClick={() => onGenreChange(genre)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedGenre === genre
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}
