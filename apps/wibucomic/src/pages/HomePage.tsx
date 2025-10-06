import React from 'react';
import { Hero } from '../components/Hero';
import { ContentRow } from '../components/ContentRow';

export const HomePage: React.FC = () => {
  return (
    <div className="bg-black min-h-screen">
      <Hero />

      <div className="relative z-10 -mt-32 pb-20">
        <ContentRow title="Trending Manga" type="manga" />
        <ContentRow title="Popular Manhwa" type="manhwa" />
        <ContentRow title="Action & Adventure" genre="Action" />
        <ContentRow title="Latest Comics" type="comic" />
        <ContentRow title="Romance" genre="Romance" />
        <ContentRow title="New Manhua" type="manhua" />
        <ContentRow title="Fantasy Worlds" genre="Fantasy" />
        <ContentRow title="Mystery & Thriller" genre="Mystery" />
      </div>
    </div>
  );
};
