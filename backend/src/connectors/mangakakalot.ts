import * as cheerio from 'cheerio';
import { BaseConnector, MangaSource, NormalizedManga, NormalizedChapter, NormalizedPage } from './base.js';

/**
 * MangaKakalot Web Scraper Connector
 * Scrapes data from MangaKakalot website
 */
export class MangaKakalotConnector extends BaseConnector {
    source: MangaSource = {
        id: 'mangakakalot',
        name: 'MangaKakalot',
        baseUrl: 'https://mangakakalot.com',
        hasAPI: false,
        language: 'en',
    };

    async search(query: string, limit = 20): Promise<NormalizedManga[]> {
        try {
            const searchUrl = `${this.source.baseUrl}/search/story/${encodeURIComponent(query.replace(/ /g, '_'))}`;
            const response = await fetch(searchUrl);
            const html = await response.text();
            const $ = cheerio.load(html);

            const results: NormalizedManga[] = [];

            $('.story_item').slice(0, limit).each((i, el) => {
                const $el = $(el);
                const link = $el.find('.story_item_right h3 a').attr('href') || '';
                const id = this.extractIdFromUrl(link);

                if (id) {
                    results.push({
                        id,
                        source: 'mangakakalot',
                        title: $el.find('.story_item_right h3 a').text().trim(),
                        description: null,
                        coverImage: $el.find('.story_item_left img').attr('src') || null,
                        author: $el.find('.story_item_right span:contains("Author")').text().replace('Author(s) :', '').trim() || null,
                        status: 'unknown',
                        genres: [],
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('MangaKakalot search error:', error);
            throw error;
        }
    }

    async getManga(id: string): Promise<NormalizedManga> {
        try {
            const url = this.constructMangaUrl(id);
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);

            const title = $('.manga-info-text h1').text().trim();
            const description = $('#noidungm').text().trim() || $('#panel-story-info-description').text().trim() || null;
            const coverImage = $('.manga-info-pic img').attr('src') || null;

            // Extract author
            let author = null;
            $('.manga-info-text li').each((i, el) => {
                const text = $(el).text();
                if (text.includes('Author')) {
                    author = text.replace(/Author\(s\)\s*:/i, '').trim();
                }
            });

            // Extract status
            let status: 'ongoing' | 'completed' | 'unknown' = 'unknown';
            $('.manga-info-text li').each((i, el) => {
                const text = $(el).text();
                if (text.includes('Status')) {
                    if (text.toLowerCase().includes('completed')) status = 'completed';
                    else if (text.toLowerCase().includes('ongoing')) status = 'ongoing';
                }
            });

            // Extract genres
            const genres: string[] = [];
            $('.manga-info-text li:contains("Genres") a').each((i, el) => {
                genres.push($(el).text().trim());
            });

            return {
                id,
                source: 'mangakakalot',
                title,
                description,
                coverImage,
                author,
                status,
                genres: genres.slice(0, 5),
            };
        } catch (error) {
            console.error('MangaKakalot getManga error:', error);
            throw error;
        }
    }

    async getChapters(mangaId: string): Promise<NormalizedChapter[]> {
        try {
            const url = this.constructMangaUrl(mangaId);
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);

            const chapters: NormalizedChapter[] = [];

            $('.chapter-list .row, .manga-info-chapter .chapter-list .row').each((i, el) => {
                const $el = $(el);
                const link = $el.find('a').attr('href') || '';
                const chapterId = this.extractChapterIdFromUrl(link);
                const chapterText = $el.find('a').text().trim();

                // Extract chapter number from text like "Chapter 123" or "Vol.1 Chapter 123"
                const numberMatch = chapterText.match(/Chapter\s+(\d+\.?\d*)/i);
                const number = numberMatch ? numberMatch[1] : String(i + 1);

                if (chapterId) {
                    chapters.push({
                        id: chapterId,
                        mangaId,
                        number,
                        title: chapterText,
                        publishedAt: $el.find('span[title]').attr('title') || new Date().toISOString(),
                    });
                }
            });

            return chapters.reverse(); // Reverse to get ascending order
        } catch (error) {
            console.error('MangaKakalot getChapters error:', error);
            throw error;
        }
    }

    async getPages(chapterId: string): Promise<NormalizedPage[]> {
        try {
            const url = this.constructChapterUrl(chapterId);
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);

            const pages: NormalizedPage[] = [];

            $('.container-chapter-reader img, .vung-doc img').each((i, el) => {
                const imageUrl = $(el).attr('src') || $(el).attr('data-src');
                if (imageUrl) {
                    pages.push({
                        pageNumber: i + 1,
                        imageUrl,
                    });
                }
            });

            return pages;
        } catch (error) {
            console.error('MangaKakalot getPages error:', error);
            throw error;
        }
    }

    async getPopular(limit = 20): Promise<NormalizedManga[]> {
        try {
            const response = await fetch(`${this.source.baseUrl}/manga_list?type=topview&category=all&state=all&page=1`);
            const html = await response.text();
            const $ = cheerio.load(html);

            const results: NormalizedManga[] = [];

            $('.list-truyen-item-wrap, .story_item').slice(0, limit).each((i, el) => {
                const $el = $(el);
                const link = $el.find('a').first().attr('href') || '';
                const id = this.extractIdFromUrl(link);

                if (id) {
                    results.push({
                        id,
                        source: 'mangakakalot',
                        title: $el.find('h3 a, .story_name a').text().trim(),
                        description: null,
                        coverImage: $el.find('img').attr('src') || null,
                        author: null,
                        status: 'unknown',
                        genres: [],
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('MangaKakalot getPopular error:', error);
            throw error;
        }
    }

    /**
     * Helper methods
     */

    private extractIdFromUrl(url: string): string | null {
        // URLs can be like:
        // https://mangakakalot.com/manga/ab123456
        // https://mangakakalot.com/read-ab123456
        // https://chapmanganato.to/manga-ab123456
        const match = url.match(/(?:manga|read)-?([a-z0-9_]+)/i) || url.match(/\/([a-z0-9_]+)$/i);
        return match ? match[1] : null;
    }

    private extractChapterIdFromUrl(url: string): string | null {
        // URLs like: https://mangakakalot.com/chapter/ab123456/chapter_1
        const match = url.match(/chapter\/([^\/]+)$/i);
        return match ? match[1] : null;
    }

    private constructMangaUrl(id: string): string {
        // Try different URL patterns
        if (id.includes('manga')) {
            return `${this.source.baseUrl}/${id}`;
        }
        return `${this.source.baseUrl}/manga/${id}`;
    }

    private constructChapterUrl(chapterId: string): string {
        return `${this.source.baseUrl}/chapter/${chapterId}`;
    }
}
