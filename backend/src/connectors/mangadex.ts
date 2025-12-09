import { BaseConnector, MangaSource, NormalizedManga, NormalizedChapter, NormalizedPage } from './base.js';

/**
 * MangaDex API Connector
 * Uses the official MangaDex API (https://api.mangadex.org)
 */
export class MangaDexConnector extends BaseConnector {
    source: MangaSource = {
        id: 'mangadex',
        name: 'MangaDex',
        baseUrl: 'https://api.mangadex.org',
        hasAPI: true,
        language: 'en',
    };

    async search(query: string, limit = 20): Promise<NormalizedManga[]> {
        try {
            const params = new URLSearchParams({
                title: query,
                limit: limit.toString(),
                'contentRating[]': 'safe',
                'contentRating[]': 'suggestive',
            });
            params.append('includes[]', 'cover_art');
            params.append('includes[]', 'author');

            const response = await fetch(`${this.source.baseUrl}/manga?${params}`);
            if (!response.ok) throw new Error(`MangaDex API error: ${response.status}`);

            const data = await response.json();
            return data.data.map((manga: any) => this.normalizeManga(manga));
        } catch (error) {
            console.error('MangaDex search error:', error);
            throw error;
        }
    }

    async getManga(id: string): Promise<NormalizedManga> {
        try {
            const params = new URLSearchParams();
            params.append('includes[]', 'cover_art');
            params.append('includes[]', 'author');

            const response = await fetch(`${this.source.baseUrl}/manga/${id}?${params}`);
            if (!response.ok) throw new Error(`MangaDex API error: ${response.status}`);

            const data = await response.json();
            return this.normalizeManga(data.data);
        } catch (error) {
            console.error('MangaDex getManga error:', error);
            throw error;
        }
    }

    async getChapters(mangaId: string): Promise<NormalizedChapter[]> {
        try {
            const params = new URLSearchParams({
                limit: '500',
                'translatedLanguage[]': 'en',
                'order[chapter]': 'asc',
            });

            const response = await fetch(`${this.source.baseUrl}/manga/${mangaId}/feed?${params}`);
            if (!response.ok) throw new Error(`MangaDex API error: ${response.status}`);

            const data = await response.json();

            return data.data.map((chapter: any) => ({
                id: chapter.id,
                mangaId,
                number: chapter.attributes.chapter || '0',
                title: chapter.attributes.title || null,
                publishedAt: chapter.attributes.publishAt || new Date().toISOString(),
                language: chapter.attributes.translatedLanguage,
            }));
        } catch (error) {
            console.error('MangaDex getChapters error:', error);
            throw error;
        }
    }

    async getPages(chapterId: string): Promise<NormalizedPage[]> {
        try {
            const response = await fetch(`${this.source.baseUrl}/at-home/server/${chapterId}`);
            if (!response.ok) throw new Error(`MangaDex API error: ${response.status}`);

            const data = await response.json();
            const { baseUrl, chapter } = data;

            return chapter.data.map((filename: string, index: number) => ({
                pageNumber: index + 1,
                imageUrl: `${baseUrl}/data/${chapter.hash}/${filename}`,
            }));
        } catch (error) {
            console.error('MangaDex getPages error:', error);
            throw error;
        }
    }

    async getPopular(limit = 20): Promise<NormalizedManga[]> {
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                'order[followedCount]': 'desc',
                'contentRating[]': 'safe',
                'contentRating[]': 'suggestive',
            });
            params.append('includes[]', 'cover_art');
            params.append('includes[]', 'author');

            const response = await fetch(`${this.source.baseUrl}/manga?${params}`);
            if (!response.ok) throw new Error(`MangaDex API error: ${response.status}`);

            const data = await response.json();
            return data.data.map((manga: any) => this.normalizeManga(manga));
        } catch (error) {
            console.error('MangaDex getPopular error:', error);
            throw error;
        }
    }

    /**
     * Normalize MangaDex manga data to common format
     */
    private normalizeManga(manga: any): NormalizedManga {
        const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Unknown';
        const description = manga.attributes.description.en || Object.values(manga.attributes.description)[0] || null;

        // Get cover art
        const coverRelation = manga.relationships.find((r: any) => r.type === 'cover_art');
        const coverUrl = coverRelation?.attributes?.fileName
            ? `https://uploads.mangadex.org/covers/${manga.id}/${coverRelation.attributes.fileName}.512.jpg`
            : null;

        // Get author
        const authorRelation = manga.relationships.find((r: any) => r.type === 'author');
        const author = authorRelation?.attributes?.name || null;

        // Get genres from tags
        const genres = manga.attributes.tags
            .slice(0, 5)
            .map((tag: any) => tag.attributes.name.en)
            .filter(Boolean);

        return {
            id: manga.id,
            source: 'mangadex',
            title,
            description,
            coverImage: coverUrl,
            author,
            status: manga.attributes.status === 'completed' ? 'completed' :
                manga.attributes.status === 'ongoing' ? 'ongoing' : 'unknown',
            genres,
            updatedAt: manga.attributes.updatedAt,
        };
    }
}
