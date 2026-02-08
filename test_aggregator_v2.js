const { handler } = require('./netlify/functions/aggregator');

async function test() {
    console.log('--- Testing Search: "Solo Leveling" ---');
    const searchEvent = {
        httpMethod: 'GET',
        queryStringParameters: { action: 'search', query: 'Solo Leveling' }
    };
    const searchResult = await handler(searchEvent);
    const results = JSON.parse(searchResult.body);
    console.log('Search Results:', JSON.stringify(results, null, 2));

    const mangareadResult = results.find(r => r.source === 'mangaread');
    if (mangareadResult) {
        console.log('\n--- Testing MangaRead Chapters ---');
        const chaptersEvent = {
            httpMethod: 'GET',
            queryStringParameters: { action: 'chapters', mangaPath: mangareadResult.path }
        };
        const chaptersResult = await handler(chaptersEvent);
        const chapters = JSON.parse(chaptersResult.body);
        console.log(`Found ${chapters.length} chapters for MangaRead`);
        if (chapters.length > 0) {
            console.log('First 3 chapters:', JSON.stringify(chapters.slice(0, 3), null, 2));

            console.log('\n--- Testing MangaRead Pages (Chapter 1) ---');
            const lastChapter = chapters[chapters.length - 1]; // usually chapter 1 is last
            const pagesEvent = {
                httpMethod: 'GET',
                queryStringParameters: { action: 'pages', chapterPath: lastChapter.path }
            };
            const pagesResult = await handler(pagesEvent);
            const pages = JSON.parse(pagesResult.body);
            console.log(`Found ${pages.length} pages for MangaRead chapter`);
            console.log('First 2 pages:', JSON.stringify(pages.slice(0, 2), null, 2));
        }
    }

    const manganatoResult = results.find(r => r.source === 'manganato');
    if (manganatoResult) {
        console.log('\n--- Testing Manganato Chapters ---');
        const chaptersEvent = {
            httpMethod: 'GET',
            queryStringParameters: { action: 'chapters', mangaPath: manganatoResult.path }
        };
        const chaptersResult = await handler(chaptersEvent);
        const chapters = JSON.parse(chaptersResult.body);
        console.log(`Found ${chapters.length} chapters for Manganato`);
        if (chapters.length > 0) {
            console.log('First 3 chapters:', JSON.stringify(chapters.slice(0, 3), null, 2));

            console.log('\n--- Testing Manganato Pages ---');
            const pagesEvent = {
                httpMethod: 'GET',
                queryStringParameters: { action: 'pages', chapterPath: chapters[0].path }
            };
            const pagesResult = await handler(pagesEvent);
            const pages = JSON.parse(pagesResult.body);
            console.log(`Found ${pages.length} pages for Manganato chapter`);
            console.log('First 2 pages:', JSON.stringify(pages.slice(0, 2), null, 2));
        }
    }
}

test().catch(err => console.error('Test failed:', err));
