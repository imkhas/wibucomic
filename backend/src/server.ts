import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MangaDexConnector, MangaKakalotConnector, BaseConnector } from './connectors/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Initialize connectors
const connectors: Record<string, BaseConnector> = {
    mangadex: new MangaDexConnector(),
    mangakakalot: new MangaKakalotConnector(),
};

// API Routes
app.get('/api', (req, res) => {
    res.json({
        message: 'WibuComic Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            sources: '/api/sources',
            search: '/api/search?source={source}&q={query}',
            manga: '/api/manga/:source/:id',
            chapters: '/api/chapters/:source/:mangaId',
            read: '/api/read/:source/:chapterId',
            popular: '/api/popular/:source',
        }
    });
});

// Get available sources
app.get('/api/sources', (req, res) => {
    const sources = Object.values(connectors).map(c => c.source);
    res.json(sources);
});

// Search manga
app.get('/api/search', async (req, res) => {
    try {
        const { source, q, limit } = req.query;

        if (!source || !q) {
            return res.status(400).json({ error: 'Missing required parameters: source, q' });
        }

        const connector = connectors[source as string];
        if (!connector) {
            return res.status(400).json({ error: 'Invalid source', availableSources: Object.keys(connectors) });
        }

        const results = await connector.search(q as string, Number(limit) || 20);
        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed', message: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Get manga details
app.get('/api/manga/:source/:id', async (req, res) => {
    try {
        const { source, id } = req.params;
        const connector = connectors[source];

        if (!connector) {
            return res.status(400).json({ error: 'Invalid source', availableSources: Object.keys(connectors) });
        }

        const manga = await connector.getManga(id);
        res.json(manga);
    } catch (error) {
        console.error('Get manga error:', error);
        res.status(500).json({ error: 'Failed to fetch manga', message: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Get chapters
app.get('/api/chapters/:source/:mangaId', async (req, res) => {
    try {
        const { source, mangaId } = req.params;
        const connector = connectors[source];

        if (!connector) {
            return res.status(400).json({ error: 'Invalid source', availableSources: Object.keys(connectors) });
        }

        const chapters = await connector.getChapters(mangaId);
        res.json(chapters);
    } catch (error) {
        console.error('Get chapters error:', error);
        res.status(500).json({ error: 'Failed to fetch chapters', message: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Get chapter pages
app.get('/api/read/:source/:chapterId', async (req, res) => {
    try {
        const { source, chapterId } = req.params;
        const connector = connectors[source];

        if (!connector) {
            return res.status(400).json({ error: 'Invalid source', availableSources: Object.keys(connectors) });
        }

        const pages = await connector.getPages(chapterId);
        res.json(pages);
    } catch (error) {
        console.error('Get pages error:', error);
        res.status(500).json({ error: 'Failed to fetch pages', message: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Get popular manga
app.get('/api/popular/:source', async (req, res) => {
    try {
        const { source } = req.params;
        const { limit } = req.query;
        const connector = connectors[source];

        if (!connector) {
            return res.status(400).json({ error: 'Invalid source', availableSources: Object.keys(connectors) });
        }

        const manga = await connector.getPopular(Number(limit) || 20);
        res.json(manga);
    } catch (error) {
        console.error('Get popular error:', error);
        res.status(500).json({ error: 'Failed to fetch popular manga', message: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 WibuComic Backend API running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${ALLOWED_ORIGINS.join(', ')}`);
});

export default app;
