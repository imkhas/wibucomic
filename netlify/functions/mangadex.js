exports.handler = async (event) => {

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json', 
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    'X-Content-Type-Options': 'nosniff',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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
    
    if (!path) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing path parameter' }),
      };
    }
    
    const queryString = new URLSearchParams(queryParams).toString();
    const mangadexUrl = `https://api.mangadex.org/${path}${queryString ? `?${queryString}` : ''}`;

    console.log('Proxying to:', mangadexUrl);

    const response = await fetch(mangadexUrl, {
      headers: {
        'User-Agent': 'WibuComic/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('MangaDex error:', response.status);
      return {
        statusCode: response.status,
        headers, 
        body: JSON.stringify({ error: `MangaDex returned ${response.status}` }),
      };
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers, 
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers, 
      body: JSON.stringify({ 
        error: 'Proxy failed',
        message: error.message 
      }),
    };
  }
};