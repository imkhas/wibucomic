/**
 * Connector exports
 */

export { BaseConnector } from './base.js';
export { MangaDexConnector } from './mangadex.js';
export { MangaKakalotConnector } from './mangakakalot.js';

export type {
    MangaSource,
    NormalizedManga,
    NormalizedChapter,
    NormalizedPage,
} from './base.js';
