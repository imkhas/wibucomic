/**
 * Base types and interfaces for manga source connectors
 */

export interface MangaSource {
    id: string;
    name: string;
    baseUrl: string;
    hasAPI: boolean;
    language: string;
}

export interface NormalizedManga {
    id: string;
    source: string;
    title: string;
    description: string | null;
    coverImage: string | null;
    author: string | null;
    status: 'ongoing' | 'completed' | 'unknown';
    genres: string[];
    updatedAt?: string;
}

export interface NormalizedChapter {
    id: string;
    mangaId: string;
    number: string;
    title: string | null;
    publishedAt: string;
    language?: string;
}

export interface NormalizedPage {
    pageNumber: number;
    imageUrl: string;
}

/**
 * Base connector class that all source connectors must extend
 */
export abstract class BaseConnector {
    abstract source: MangaSource;

    /**
     * Search for manga by query
     */
    abstract search(query: string, limit?: number): Promise<NormalizedManga[]>;

    /**
     * Get manga details by ID
     */
    abstract getManga(id: string): Promise<NormalizedManga>;

    /**
     * Get chapters for a manga
     */
    abstract getChapters(mangaId: string): Promise<NormalizedChapter[]>;

    /**
     * Get pages for a chapter
     */
    abstract getPages(chapterId: string): Promise<NormalizedPage[]>;

    /**
     * Get popular/trending manga
     */
    abstract getPopular(limit?: number): Promise<NormalizedManga[]>;
}
