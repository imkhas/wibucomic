import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path, ...queryParams } = req.query;
    
    // Build the MangaDex API URL
    const mangadexPath = Array.isArray(path) ? path.join('/') : path || '';
    const queryString = new URLSearchParams(queryParams as Record<string, string>).toString();
    const mangadexUrl = `https://api.mangadex.org/${mangadexPath}${queryString ? `?${queryString}` : ''}`;

    console.log('Proxying request to:', mangadexUrl);

    // Fetch from MangaDex
    const response = await fetch(mangadexUrl, {
      headers: {
        'User-Agent': 'WibuComic/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`MangaDex API returned ${response.status}`);
    }

    const data = await response.json();

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch from MangaDex',
      message: error.message 
    });
  }
}