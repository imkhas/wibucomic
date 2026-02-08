const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
};

const FETCH_OPTIONS = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
};

function calculateRelevance(query, title) {
    const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 1);
    const titleWords = title.toLowerCase().split(/\W+/);
    if (queryWords.length === 0) return 0;

    let matches = 0;
    for (const qw of queryWords) {
        if (titleWords.includes(qw)) matches++;
    }
    return matches / queryWords.length;
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const { action, query, mangaPath, chapterPath } = event.queryStringParameters || {};

    try {
        if (action === 'search') {
            console.log('Searching aggregators for:', query);
            const results = [];

            // 1. Search MangaPill
            try {
                const mpResponse = await fetch(`https://mangapill.com/search?q=${encodeURIComponent(query)}`, FETCH_OPTIONS);
                const mpHtml = await mpResponse.text();

                // Restrict to search results grid
                const gridIdx = mpHtml.indexOf('grid');
                if (gridIdx !== -1) {
                    const mpResultsHtml = mpHtml.substring(gridIdx, gridIdx + 15000);
                    const mpRegex = /href="(\/manga\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
                    let match;
                    while ((match = mpRegex.exec(mpResultsHtml)) !== null) {
                        const title = match[2].replace(/<[^>]*>/g, '').trim();
                        if (title && !results.find(r => r.title === title) && !title.toLowerCase().includes('novel')) {
                            const relevance = calculateRelevance(query, title);
                            if (relevance > 0.2) {
                                results.push({ path: match[1], title, source: 'mangapill', relevance });
                            }
                        }
                    }
                }
            } catch (err) { console.error('MangaPill search failed:', err.message); }

            // 2. Search MangaReader
            try {
                const mrResponse = await fetch(`https://mangareader.to/search?keyword=${encodeURIComponent(query)}`, FETCH_OPTIONS);
                const mrHtml = await mrResponse.text();

                // Restrict to manga_list-sbs container
                const listIdx = mrHtml.indexOf('manga_list-sbs');
                if (listIdx !== -1) {
                    const mrResultsHtml = mrHtml.substring(listIdx, listIdx + 15000);
                    const mrRegex = /<h3 class="manga-name">\s*<a href="([^"]+)" title="([^"]+)">/g;
                    let match;
                    while ((match = mrRegex.exec(mrResultsHtml)) !== null) {
                        const title = match[2].trim();
                        if (title && !results.find(r => r.title === title)) {
                            const relevance = calculateRelevance(query, title);
                            if (relevance > 0.2) {
                                results.push({ path: `mr:${match[1]}`, title, source: 'mangareader', relevance });
                            }
                        }
                    }
                }
            } catch (err) { console.error('MangaReader search failed:', err.message); }

            // 3. Search Manganato (chapmanganato.to fallback)
            try {
                // Using chapmanganato.to often works better for search
                const queryWithUnderscores = query.toLowerCase().replace(/\W+/g, '_');
                console.log(`Fetching Manganato: https://chapmanganato.to/search/story/${queryWithUnderscores}`);
                const mnResponse = await fetch(`https://chapmanganato.to/search/story/${queryWithUnderscores}`, FETCH_OPTIONS);
                const mnHtml = await mnResponse.text();

                console.log(`Manganato HTML Length: ${mnHtml.length}`);

                // Manganato search regex (title and link)
                // Looks for: <a href="..." class="item-title" ...>Title</a>
                const mnRegex = /<a[^>]+href="([^"]+)"[^>]*class="item-title"[^>]*>([^<]+)<\/a>/g;
                let match;
                while ((match = mnRegex.exec(mnHtml)) !== null) {
                    const path = match[1];
                    const title = match[2];
                    if (path && title && title.toLowerCase().includes(query.toLowerCase())) {
                        results.push({
                            title: title.trim(),
                            path: `mn:${path}`,
                            source: 'manganato',
                            relevance: calculateRelevance(title, query)
                        });
                    }
                }
            } catch (err) { console.error('Manganato search failed:', err.message); }

            // 4. Search MangaRead.org
            try {
                const searchUrl = `https://www.mangaread.org/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
                console.log(`Fetching MangaRead: ${searchUrl}`);
                const mrResponse = await fetch(searchUrl, FETCH_OPTIONS);
                const mrHtml = await mrResponse.text();
                console.log(`MangaRead HTML Length: ${mrHtml.length}`);

                const containerIdx = mrHtml.indexOf('tab-content-wrap');
                console.log(`MangaRead Container Index: ${containerIdx}`);

                if (containerIdx !== -1) {
                    const mrResultsHtml = mrHtml.substring(containerIdx, containerIdx + 20000);

                    // Regex targeting the thumbnail link which contains the title attribute
                    // <div class="tab-thumb c-image-hover"> <a href="..." title="...">
                    const debugIdx = mrResultsHtml.indexOf('c-image-hover');
                    if (debugIdx !== -1) {
                        console.log(`Debug Hover: ${mrResultsHtml.substring(debugIdx, debugIdx + 200)}`);
                    }

                    // Use a more permissive regex to allow other attributes and newlines
                    // [\s\S]*? matches any character including newlines non-greedily
                    const mrRegex = /<div class="tab-thumb c-image-hover">[\s\S]*?<a[^>]*href="([^"]+)"[^>]*title="([^"]+)"/g;
                    let match;
                    while ((match = mrRegex.exec(mrResultsHtml)) !== null) {
                        const path = match[1];
                        const title = match[2];
                        // Validate path contains 'manga' to avoid garbage links
                        if (path && path.includes('/manga/') && title) {
                            results.push({
                                title: title.trim(),
                                // Extract slug 
                                path: `mr:${path.replace('https://www.mangaread.org/manga/', '').replace(/\/$/, '')}`,
                                source: 'mangaread',
                                relevance: calculateRelevance(title, query)
                            });
                        }
                    }
                }
            } catch (err) { console.error('MangaRead search failed:', err.message); }

            console.log(`Found ${results.length} search results total`);

            // Sort by relevance, then shorter title, then source stability
            const sortedResults = results.sort((a, b) => {
                if (b.relevance !== a.relevance) return b.relevance - a.relevance;
                return a.title.length - b.title.length;
            });

            return { statusCode: 200, headers, body: JSON.stringify(sortedResults.slice(0, 5)) };
        }

        if (action === 'chapters') {
            let chapters = [];
            if (mangaPath.startsWith('mr:')) {
                // MangaReader
                const path = mangaPath.replace('mr:', '');
                console.log('Fetching MangaReader chapters for:', path);
                const response = await fetch(`https://mangareader.to${path}`, FETCH_OPTIONS);
                const html = await response.text();
                // Regex for MangaReader: href="/read/.../chapter-..."
                const regex = /href="(\/read\/[^"]+\/chapter-\d+)"[^>]*>([\s\S]*?)<\/a>/g;
                let match;
                while ((match = regex.exec(html)) !== null) {
                    const title = match[2].replace(/<[^>]*>/g, '').trim();
                    if (title && !chapters.find(c => c.path === `mr:${match[1]}`)) {
                        chapters.push({ path: `mr:${match[1]}`, title });
                    }
                }
            } else if (mangaPath.includes('manganato.com') || mangaPath.includes('chapmanganato.com')) {
                // Manganato
                console.log('Fetching Manganato chapters from:', mangaPath);
                const response = await fetch(mangaPath, FETCH_OPTIONS);
                const html = await response.text();
                // Manganato chapters: href="..." class="chapter-name..."
                const regex = /<a[^>]+class="chapter-name[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
                let match;
                while ((match = regex.exec(html)) !== null) {
                    const title = match[2].replace(/<[^>]*>/g, '').trim();
                    if (title && !chapters.find(c => c.path === match[1])) {
                        chapters.push({ path: match[1], title });
                    }
                }
            } else if (mangaPath.startsWith('https://www.mangaread.org/manga/')) {
                // MangaRead
                console.log('Fetching MangaRead chapters for:', mangaPath);
                const response = await fetch(mangaPath, FETCH_OPTIONS);
                const html = await response.text();
                // MangaRead chapters: <li class="wp-manga-chapter">...<a href="...">Title</a>
                const regex = /<li[^>]+class="wp-manga-chapter[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
                let match;
                while ((match = regex.exec(html)) !== null) {
                    const title = match[2].trim();
                    if (title && !chapters.find(c => c.path === match[1])) {
                        chapters.push({ path: match[1], title });
                    }
                }
            } else {
                // MangaPill
                console.log('Fetching MangaPill chapters for:', mangaPath);
                const response = await fetch(`https://mangapill.com${mangaPath}`, FETCH_OPTIONS);
                const html = await response.text();
                const regex = /href="(\/chapters\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
                let match;
                while ((match = regex.exec(html)) !== null) {
                    const title = match[2].replace(/<[^>]*>/g, '').trim();
                    if (title && !chapters.find(c => c.path === match[1])) {
                        chapters.push({ path: match[1], title });
                    }
                }
            }
            console.log(`Found ${chapters.length} chapters`);
            return { statusCode: 200, headers, body: JSON.stringify(chapters) };
        }

        if (action === 'pages') {
            let pages = [];
            if (chapterPath.startsWith('mr:')) {
                // MangaReader
                const path = chapterPath.replace('mr:', '');
                console.log('Fetching MangaReader pages for:', path);
                const response = await fetch(`https://mangareader.to${path}`, FETCH_OPTIONS);
                const html = await response.text();
                // Match data-url on MangaReader
                const regex = /data-url="([^"]+)"/g;
                let match;
                while ((match = regex.exec(html)) !== null) {
                    pages.push(match[1]);
                }
                // Fallback to background-image if needed
                if (pages.length === 0) {
                    const bgRegex = /url\((https:\/\/[^)]+)\)/g;
                    while ((match = bgRegex.exec(html)) !== null) {
                        if (match[1].includes('img')) pages.push(match[1]);
                    }
                }
            } else if (chapterPath.includes('manganato.com') || chapterPath.includes('chapmanganato.com')) {
                // Manganato
                console.log('Fetching Manganato pages for:', chapterPath);
                const response = await fetch(chapterPath, FETCH_OPTIONS);
                const html = await response.text();
                // Manganato pages: usually img tags with class "content-e" or similar
                const regex = /<img[^>]+src="([^"]+)"[^>]+class="img-loading"/g;
                let match;
                while ((match = regex.exec(html)) !== null) {
                    pages.push(match[1]);
                }
            } else if (chapterPath.startsWith('https://www.mangaread.org/manga/')) {
                // MangaRead
                console.log('Fetching MangaRead pages for:', chapterPath);
                const response = await fetch(chapterPath, FETCH_OPTIONS);
                const html = await response.text();
                // MangaRead pages: <img ... src="\s*...\s*" class="wp-manga-chapter-img">
                const regex = /<img[^>]+src="\s*([^">]+?)\s*"[^>]*class="wp-manga-chapter-img"/g;
                let match;
                while ((match = regex.exec(html)) !== null) {
                    pages.push(match[1]);
                }
            } else {
                // MangaPill
                console.log('Fetching MangaPill pages for:', chapterPath);
                const response = await fetch(`https://mangapill.com${chapterPath}`, FETCH_OPTIONS);
                const html = await response.text();
                const regex = /<img[^>]+data-src="([^"]+)"/g;
                let match;
                while ((match = regex.exec(html)) !== null) {
                    pages.push(match[1]);
                }
            }
            console.log(`Found ${pages.length} pages`);
            return { statusCode: 200, headers, body: JSON.stringify(pages) };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };
    } catch (error) {
        console.error('Aggregator error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
