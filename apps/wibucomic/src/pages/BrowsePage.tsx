import React from 'react';
import { useParams } from 'react-router-dom';
import { ContentRow } from '../components/ContentRow';

export const BrowsePage: React.FC = () => {
  const { type } = useParams<{ type: 'manga' | 'manhwa' | 'comics' | 'manhua' }>();

  const typeMapping = {
    manga: 'manga',
    manhwa: 'manhwa',
    comics: 'comic',
    manhua: 'manhua',
  } as const;

  const actualType = type ? typeMapping[type] : undefined;

  const getTitle = () => {
    if (!type) return 'Browse All';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const genres = [
    'Action',
    'Adventure',
    'Comedy',
    'Drama',
    'Fantasy',
    'Horror',
    'Mystery',
    'Romance',
    'Sci-Fi',
    'Slice of Life',
    'Supernatural',
    'Thriller',
  ];

  return (
    <div className="bg-black min-h-screen pt-24 pb-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8">
          {getTitle()}
        </h1>

        <div className="space-y-10">
          {actualType ? (
            <>
              <ContentRow title={`Popular ${getTitle()}`} type={actualType} />
              {genres.map((genre) => (
                <ContentRow
                  key={genre}
                  title={`${genre} ${getTitle()}`}
                  type={actualType}
                  genre={genre}
                />
              ))}
            </>
          ) : (
            <>
              <ContentRow title="All Manga" type="manga" />
              <ContentRow title="All Manhwa" type="manhwa" />
              <ContentRow title="All Comics" type="comic" />
              <ContentRow title="All Manhua" type="manhua" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
