const fs = require('fs');

async function run() {
    try {
        const query = 'Solo Leveling';
        const url = `https://www.mangaread.org/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
        console.log(`Fetching: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        const text = await response.text();
        console.log(`Length: ${text.length}`);

        fs.writeFileSync('debug_fetch_output.txt', text);
        console.log('Saved to debug_fetch_output.txt');

    } catch (e) {
        console.error(e);
    }
}

run();
