import { useMangaDexReader } from '../hooks/useMangaDexReader';

interface Props {
  chapterId: string;
}

function MangaDexReaderComponent({ chapterId }: Props) {
  const { pages, loading, error } = useMangaDexReader(chapterId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="reader">
      {pages.map(page => (
        <img
          key={page.id}
          src={page.image_url}
          alt={`Page ${page.page_number}`}
          className="page"
        />
      ))}
    </div>
  );
}

export default MangaDexReaderComponent;