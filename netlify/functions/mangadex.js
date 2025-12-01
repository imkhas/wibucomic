exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow GET requests
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

    // Remove empty parameters
    const cleanParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    
    const queryString = new URLSearchParams(cleanParams).toString();
    const mangadexUrl = `https://api.mangadex.org/${path}${queryString ? `?${queryString}` : ''}`;

    console.log('Proxying to MangaDex:', mangadexUrl);

    const response = await fetch(mangadexUrl, {
      headers: {
        'User-Agent': 'WibuComic/1.0',
        'Accept': 'application/json',
      },
    });

    // Get response as text first to check content type
    const text = await response.text();
    
    // Check if it's valid JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Invalid JSON response from MangaDex:', text.substring(0, 500));
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid response from MangaDex',
          details: text.substring(0, 200)
        }),
      };
    }

    if (!response.ok) {
      console.error('MangaDex API error:', response.status, data);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `MangaDex returned ${response.status}`,
          details: data 
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Proxy function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Proxy failed',
        message: error.message,
        stack: error.stack?.substring(0, 500)
      }),
    };
  }
};