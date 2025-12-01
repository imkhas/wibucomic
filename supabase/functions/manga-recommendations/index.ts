import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Check if required env vars are set
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set')
      return new Response(
        JSON.stringify({ 
          error: 'AI service not configured. Please contact support.',
          details: 'Missing GEMINI_API_KEY'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase configuration missing')
      return new Response(
        JSON.stringify({ 
          error: 'Database service not configured',
          details: 'Missing Supabase credentials'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Parse request body
    const { userId, prompt, includeMangaDex = false, conversationHistory = [] } = await req.json()

    if (!userId || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or prompt' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Processing request for user:', userId)

    // Fetch user context
    const userContext = await getUserContext(supabaseClient, userId)
    console.log('User context fetched:', userContext.totalBookmarks, 'bookmarks')

    // Build system prompt
    const systemPrompt = buildSystemPrompt(userContext, conversationHistory)

    // Call Gemini API
    console.log('Calling Gemini API...')
    const recommendations = await getGeminiRecommendations(GEMINI_API_KEY, systemPrompt, prompt)
    console.log('Recommendations generated')

    // Search MangaDex if requested
    let mangaResults = []
    if (includeMangaDex) {
      console.log('Searching MangaDex...')
      mangaResults = await searchMangaDexFromRecommendations(recommendations)
      console.log('Found', mangaResults.length, 'manga on MangaDex')
    }

    // Save conversation history (non-blocking)
    saveChatHistory(supabaseClient, userId, prompt, recommendations).catch(err => {
      console.error('Failed to save chat history (non-critical):', err)
    })

    return new Response(
      JSON.stringify({
        recommendations,
        mangaResults,
        userContext: {
          bookmarksCount: userContext.totalBookmarks,
          favoriteGenres: userContext.favoriteGenres,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in manga-recommendations function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function getUserContext(supabaseClient: any, userId: string) {
  try {
    // Fetch bookmarks
    const { data: bookmarks } = await supabaseClient
      .from('bookmarks')
      .select('comic_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    // Fetch reading progress
    const { data: progress } = await supabaseClient
      .from('reading_progress')
      .select('comic_id, current_page, last_read_at')
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false })
      .limit(10)

    const recentManga: Array<{ title: string; genre: string | null }> = []
    const genres: string[] = []

    // Fetch manga details from MangaDex for bookmarked items
    if (bookmarks && bookmarks.length > 0) {
      for (const bookmark of bookmarks.slice(0, 5)) {
        try {
          const response = await fetch(
            `https://api.mangadex.org/manga/${bookmark.comic_id}?includes[]=cover_art`,
            { headers: { 'User-Agent': 'WibuComic/1.0' } }
          )
          
          if (response.ok) {
            const data = await response.json()
            const title = data.data.attributes.title.en || Object.values(data.data.attributes.title)[0]
            const tags = data.data.attributes.tags || []
            const genre = extractGenreFromTags(tags)
            
            recentManga.push({ title, genre })
            if (genre) genres.push(genre)
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (err) {
          console.error('Failed to fetch manga:', bookmark.comic_id, err)
        }
      }
    }

    // Calculate favorite genres
    const genreCounts: Record<string, number> = {}
    genres.forEach(g => {
      genreCounts[g] = (genreCounts[g] || 0) + 1
    })
    
    const favoriteGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre)

    let readingPatterns = 'casual reader'
    if (progress && progress.length > 5) readingPatterns = 'active reader'
    if (bookmarks && bookmarks.length > 10) readingPatterns = 'avid collector'

    return {
      favoriteGenres: favoriteGenres.length > 0 ? favoriteGenres : ['Action', 'Adventure'],
      recentManga,
      totalBookmarks: bookmarks?.length || 0,
      preferredStatus: 'ongoing',
      readingPatterns
    }
  } catch (error) {
    console.error('Error fetching user context:', error)
    return {
      favoriteGenres: ['Action', 'Adventure'],
      recentManga: [],
      totalBookmarks: 0,
      preferredStatus: 'ongoing',
      readingPatterns: 'new user'
    }
  }
}

function extractGenreFromTags(tags: any[]): string | null {
  if (!tags || tags.length === 0) return null
  
  const genreTag = tags.find(tag => {
    const name = tag.attributes?.name?.en?.toLowerCase()
    return name && [
      'action', 'adventure', 'comedy', 'drama', 'fantasy', 
      'horror', 'mystery', 'romance', 'sci-fi', 'slice of life',
      'sports', 'supernatural', 'thriller'
    ].includes(name)
  })

  return genreTag?.attributes?.name?.en || null
}

function buildSystemPrompt(userContext: any, conversationHistory: any[]) {
  const conversationContext = conversationHistory
    .slice(-5)
    .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n')

  return `You are an expert manga recommendation assistant with deep knowledge of manga from MangaDex.

USER PROFILE:
- Favorite Genres: ${userContext.favoriteGenres.join(', ')}
- Recently Read: ${userContext.recentManga.map((m: any) => `"${m.title}" (${m.genre})`).join(', ') || 'None yet'}
- Total Bookmarks: ${userContext.totalBookmarks}
- Reading Pattern: ${userContext.readingPatterns}

${conversationContext ? `CONVERSATION HISTORY:\n${conversationContext}\n` : ''}

INSTRUCTIONS:
1. Provide 3-5 personalized manga recommendations
2. For each recommendation, include:
   - Title in quotes: "Title Here"
   - Brief description (2-3 sentences)
   - Why it matches their preferences
   - Genre tags
3. Focus on manga available on MangaDex
4. Be conversational and enthusiastic
5. Keep responses under 500 words

Format your response clearly with each manga recommendation.`
}

async function getGeminiRecommendations(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemPrompt },
            { text: `User Question: ${userPrompt}` }
          ]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

async function searchMangaDexFromRecommendations(recommendations: string): Promise<any[]> {
  const titlePattern = /"([^"]+)"/g
  const matches = [...recommendations.matchAll(titlePattern)]
  const titles = matches.map(m => m[1]).slice(0, 5)

  const results = []

  for (const title of titles) {
    try {
      const response = await fetch(
        `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=1&includes[]=cover_art`,
        { headers: { 'User-Agent': 'WibuComic/1.0' } }
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.data.length > 0) {
          const manga = data.data[0]
          
          const coverRelation = manga.relationships.find((r: any) => r.type === 'cover_art')
          let coverUrl = null
          
          if (coverRelation) {
            const coverId = coverRelation.id
            const coverResponse = await fetch(
              `https://api.mangadex.org/cover/${coverId}`,
              { headers: { 'User-Agent': 'WibuComic/1.0' } }
            )
            if (coverResponse.ok) {
              const coverData = await coverResponse.json()
              const fileName = coverData.data.attributes.fileName
              coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.512.jpg`
            }
          }

          results.push({
            id: manga.id,
            title: manga.attributes.title.en || Object.values(manga.attributes.title)[0],
            coverUrl,
            status: manga.attributes.status
          })
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (err) {
      console.error('Failed to search MangaDex for:', title, err)
    }
  }

  return results
}

async function saveChatHistory(supabaseClient: any, userId: string, userMessage: string, assistantMessage: string) {
  try {
    const { data: existing } = await supabaseClient
      .from('ai_chat_history')
      .select('id, messages')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() // Changed from .single()

    const newMessages = [
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() }
    ]

    if (existing) {
      const updatedMessages = [...(existing.messages || []), ...newMessages].slice(-20)

      await supabaseClient
        .from('ai_chat_history')
        .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabaseClient
        .from('ai_chat_history')
        .insert({
          user_id: userId,
          messages: newMessages
        })
    }
  } catch (error) {
    console.error('Failed to save chat history:', error)
  }
}