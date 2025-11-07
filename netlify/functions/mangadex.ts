import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 's-maxage=300, stale-while-revalidate',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { path, ...queryParams } = event.queryStringParameters || {};
    
    // Build the MangaDex API URL
    const mangadexPath = path || '';
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
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error: any) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch from MangaDex',
        message: error.message 
      }),
    };
  }
};