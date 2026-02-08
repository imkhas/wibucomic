const { handler } = require('./netlify/functions/aggregator');

async function test() {
    console.log('--- Testing Search (Specific) ---');
    const searchEvent = {
        httpMethod: 'GET',
        queryStringParameters: { action: 'search', query: 'Solo Leveling' }
    };
    const searchResult = await handler(searchEvent);
    const results = JSON.parse(searchResult.body);

    const mangaread = results.filter(r => r.source === 'mangaread');
    const manganato = results.filter(r => r.source === 'manganato');

    console.log('MangaRead Results:', mangaread.length);
    if (mangaread.length > 0) console.log(JSON.stringify(mangaread[0], null, 2));

    console.log('Manganato Results:', manganato.length);
    if (manganato.length > 0) console.log(JSON.stringify(manganato[0], null, 2));

    if (mangaread.length > 0) {
        console.log('\n--- MangaRead Chapter Fetch ---');
        const chEvent = {
            httpMethod: 'GET',
            queryStringParameters: { action: 'chapters', mangaPath: mangaread[0].path }
        };
        const chRes = await handler(chEvent);
        const chapters = JSON.parse(chRes.body);
        console.log(`Chapters found: ${chapters.length}`);
        if (chapters.length > 0) {
            console.log('First chapter:', chapters[0]);
            console.log('Last chapter:', chapters[chapters.length - 1]);

            console.log('\n--- MangaRead Page Fetch ---');
            const pEvent = {
                httpMethod: 'GET',
                queryStringParameters: { action: 'pages', chapterPath: chapters[0].path }
            };
            const pRes = await handler(pEvent);
            const pages = JSON.parse(pRes.body);
            console.log(`Pages found: ${pages.length}`);
            if (pages.length > 0) console.log('First page:', pages[0]);
        }
    }
}

test().catch(console.error);
