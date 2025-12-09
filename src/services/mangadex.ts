/**
 * MangaDex API Service
 * Provides functions to interact with the MangaDex API
 */

const MANGADEX_API_BASE = 'https://api.mangadex.org';

interface ChapterData {
    baseUrl: string;
    chapter: {
        hash: string;
        data: string[];
        dataSaver: string[];
    };
}

/**
 * Fetches chapter pages from MangaDex API
 * @param chapterId - The MangaDex chapter ID
 * @returns Chapter data including base URL and page information
 */
export async function getChapterPages(chapterId: string): Promise<ChapterData> {
    try {
        const response = await fetch(`${MANGADEX_API_BASE}/at-home/server/${chapterId}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch chapter: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`MangaDex API error: ${error.message}`);
        }
        throw new Error('Unknown error fetching chapter pages');
    }
}

/**
 * Constructs the full image URL for a chapter page
 * @param baseUrl - The base URL from the chapter data
 * @param hash - The chapter hash
 * @param fileName - The image file name
 * @param dataSaver - Whether to use data saver quality (default: false)
 * @returns Full image URL
 */
export function getChapterImageUrl(
    baseUrl: string,
    hash: string,
    fileName: string,
    dataSaver = false
): string {
    const quality = dataSaver ? 'data-saver' : 'data';
    return `${baseUrl}/${quality}/${hash}/${fileName}`;
}

/**
 * Searches for manga by title
 * @param title - The manga title to search for
 * @param limit - Maximum number of results (default: 10)
 * @returns Search results
 */
export async function searchManga(title: string, limit = 10) {
    try {
        const params = new URLSearchParams({
            title,
            limit: limit.toString(),
            'includes[]': 'cover_art',
        });

        const response = await fetch(`${MANGADEX_API_BASE}/manga?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to search manga: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`MangaDex API error: ${error.message}`);
        }
        throw new Error('Unknown error searching manga');
    }
}

/**
 * Gets manga details by ID
 * @param mangaId - The MangaDex manga ID
 * @returns Manga details
 */
export async function getMangaDetails(mangaId: string) {
    try {
        const params = new URLSearchParams({
            'includes[]': 'cover_art',
        });

        const response = await fetch(`${MANGADEX_API_BASE}/manga/${mangaId}?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch manga: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`MangaDex API error: ${error.message}`);
        }
        throw new Error('Unknown error fetching manga details');
    }
}

/**
 * Gets chapters for a manga
 * @param mangaId - The MangaDex manga ID
 * @param limit - Maximum number of chapters (default: 100)
 * @param offset - Offset for pagination (default: 0)
 * @returns Chapter list
 */
export async function getMangaChapters(mangaId: string, limit = 100, offset = 0) {
    try {
        const params = new URLSearchParams({
            manga: mangaId,
            limit: limit.toString(),
            offset: offset.toString(),
            'translatedLanguage[]': 'en',
            'order[chapter]': 'asc',
        });

        const response = await fetch(`${MANGADEX_API_BASE}/chapter?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch chapters: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`MangaDex API error: ${error.message}`);
        }
        throw new Error('Unknown error fetching chapters');
    }
}

/**
 * Gets popular manga
 * @param limit - Maximum number of results (default: 20)
 * @returns Popular manga list
 */
export async function getPopularManga(limit = 20) {
    try {
        const params = new URLSearchParams({
            limit: limit.toString(),
            'includes[]': 'cover_art',
            'order[followedCount]': 'desc',
        });
        params.append('contentRating[]', 'safe');
        params.append('contentRating[]', 'suggestive');

        const response = await fetch(`${MANGADEX_API_BASE}/manga?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch popular manga: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`MangaDex API error: ${error.message}`);
        }
        throw new Error('Unknown error fetching popular manga');
    }
}

/**
 * Gets manga by ID
 * @param mangaId - The MangaDex manga ID
 * @returns Manga data
 */
export async function getMangaById(mangaId: string) {
    try {
        const params = new URLSearchParams({
            'includes[]': 'cover_art',
        });

        const response = await fetch(`${MANGADEX_API_BASE}/manga/${mangaId}?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch manga: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`MangaDex API error: ${error.message}`);
        }
        throw new Error('Unknown error fetching manga');
    }
}

/**
 * Gets manga feed (chapters)
 * @param mangaId - The MangaDex manga ID
 * @param limit - Maximum number of chapters (default: 500)
 * @returns Chapter feed
 */
export async function getMangaFeed(mangaId: string, limit = 500) {
    try {
        const params = new URLSearchParams({
            limit: limit.toString(),
            'translatedLanguage[]': 'en',
            'order[chapter]': 'asc',
        });

        const response = await fetch(`${MANGADEX_API_BASE}/manga/${mangaId}/feed?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch manga feed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`MangaDex API error: ${error.message}`);
        }
        throw new Error('Unknown error fetching manga feed');
    }
}

/**
 * Gets cover image URL for a manga
 * @param mangaId - The MangaDex manga ID
 * @param coverId - The cover art ID
 * @returns Cover image URL
 */
export async function getCoverImageUrl(mangaId: string, coverId: string): Promise<string> {
    try {
        const response = await fetch(`${MANGADEX_API_BASE}/cover/${coverId}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch cover: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const fileName = data.data.attributes.fileName;
        return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.512.jpg`;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`MangaDex API error: ${error.message}`);
        }
        throw new Error('Unknown error fetching cover image');
    }
}

/**
 * Extracts genre from manga tags
 * @param tags - Array of manga tags
 * @returns Genre string or null
 */
export function extractGenreFromTags(tags: Array<{ attributes: { name: { [key: string]: string } } }>): string | null {
    if (!tags || tags.length === 0) return null;

    // Get first 3 tags as genres
    const genres = tags
        .slice(0, 3)
        .map(tag => tag.attributes.name.en || Object.values(tag.attributes.name)[0])
        .filter(Boolean);

    return genres.length > 0 ? genres.join(', ') : null;
}

