# WibuComic Backend API

Multi-source manga aggregator backend that connects to various manga sources and provides a unified API.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your configuration.

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Health Check
```
GET /health
```

### List Sources
```
GET /api/sources
```

### Search Manga
```
GET /api/search?source={source}&q={query}&limit={limit}
```

### Get Manga Details
```
GET /api/manga/:source/:id
```

### Get Chapters
```
GET /api/chapters/:source/:mangaId
```

### Get Chapter Pages
```
GET /api/read/:source/:chapterId
```

### Get Popular Manga
```
GET /api/popular/:source?limit={limit}
```

## Available Sources

- **MangaDex** (`mangadex`) - API-based
- **MangaKakalot** (`mangakakalot`) - Web scraper
- More sources coming soon...

## Development

- Server runs on `http://localhost:3001` by default
- CORS is configured for `http://localhost:5173` (frontend)
- TypeScript with hot reload via `tsx`

## Tech Stack

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Cheerio** - HTML parsing for scrapers
- **CORS** - Cross-origin resource sharing
