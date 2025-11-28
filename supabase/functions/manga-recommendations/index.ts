import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface RequestBody {
  userId: string
  prompt: string
  includeMangaDex?: boolean
  conversationHistory?: ChatMessage[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface UserContext {
  favoriteGenres: string[]
  recentManga: Array<{ title: string; genre: string | null }>
  totalBookmarks: number
  preferredStatus: string
  readingPatterns: string
}

interface MangaDexManga {
  id: string
  title: string
  coverUrl?: string
  status: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, prompt, includeMangaDex = false, conversationHistory = [] }: RequestBody = await req.json()

    if (!userId || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or prompt' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }

    // Fetch user context
    const userContext = await getUserContext(userId)

    // Build conversation context
    const conversationContext = conversationHistory
      .slice(-5) // Keep last 5 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n')

    // Build system prompt
    const systemPrompt = buildSystemPrompt(userContext, conversationContext)

    // Call Gemini API
    const recommendations = await getGeminiRecommendations(systemPrompt, prompt)

    // Optionally search MangaDex for recommended titles
    let mangaResults: MangaDexManga[] = []
    if (includeMangaDex) {
      mangaResults = await searchMangaDexFromRecommendations(recommendations)
    }

    // Save conversation history
    await saveChatHistory(userId, prompt, recommendations)

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
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )

  } catch (error) {
    console.error('Error in manga-recommendations:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
})

async function getUserContext(userId: string): Promise<UserContext> {
  try {
    // Fetch bookmarks
    const { data: bookmarks, error: bookmarksError } = await supabaseClient
      .from('bookmarks')
      .select('comic_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (bookmarksError) {
      console.error('Error fetching bookmarks:', bookmarksError)
      throw bookmarksError
    }

    // Fetch reading progress
    const { data: progress, error: progressError } = await supabaseClient
      .from('reading_progress')
      .select('comic_id, current_page, last_read_at')
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false })
      .limit(10)

    if (progressError) {
      console.error('Error fetching progress:', progressError)
    }

    // Fetch manga details from MangaDex for bookmarked items
    const recentManga: Array<{ title: string; genre: string | null }> = []
    const genres: string[] = []

    if (bookmarks && bookmarks.length > 0) {
      // Use Promise.all for parallel requests to improve performance
      const mangaPromises = bookmarks.slice(0, 5).map(async (bookmark) => {
        try {
          const response = await fetch(
            `https://api.mangadex.org/manga/${bookmark.comic_id}?includes[]=cover_art`
          )
          if (response.ok) {
            const data = await response.json()
            const title = data.data.attributes.title.en || Object.values(data.data.attributes.title)[0]
            const tags = data.data.attributes.tags || []
            const genre = extractGenreFromTags(tags)
            
            return { title, genre }
          }
        } catch (err) {
          console.error('Failed to fetch manga:', bookmark.comic_id, err)
        }
        return null
      })

      const mangaResults = await Promise.all(mangaPromises)
      mangaResults.forEach(result => {
        if (result) {
          recentManga.push(result)
          if (result.genre) genres.push(result.genre)
        }
      })
    }

    // Calculate favorite genres (most frequent)
    const genreCounts: Record<string, number> = {}
    genres.forEach(g => {
      genreCounts[g] = (genreCounts[g] || 0) + 1
    })
    const favoriteGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre)

    // Determine reading patterns
    let readingPatterns = 'casual reader'
    if (progress && progress.length > 5) {
      readingPatterns = 'active reader'
    }
    if (bookmarks && bookmarks.length > 10) {
      readingPatterns = 'avid collector'
    }

    return {
      favoriteGenres: favoriteGenres.length > 0 ? favoriteGenres : ['Action', 'Adventure'],
      recentManga,
      totalBookmarks: bookmarks?.length || 0,
      preferredStatus: 'ongoing',
      readingPatterns
    }
  } catch (error) {
    console.error('Error fetching user context:', error)
    // Return default context on error
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

function buildSystemPrompt(userContext: UserContext, conversationContext: string): string {
  return `You are an expert manga recommendation assistant with deep knowledge of manga from MangaDex.

USER PROFILE:
- Favorite Genres: ${userContext.favoriteGenres.join(', ')}
- Recently Read: ${userContext.recentManga.map(m => `"${m.title}" (${m.genre || 'unknown genre'})`).join(', ') || 'None yet'}
- Total Bookmarks: ${userContext.totalBookmarks}
- Reading Pattern: ${userContext.readingPatterns}
- Preference: ${userContext.preferredStatus} manga

${conversationContext ? `CONVERSATION HISTORY:\n${conversationContext}\n` : ''}

INSTRUCTIONS:
1. Provide 3-5 personalized manga recommendations
2. For each recommendation, include:
   - Title (in quotes)
   - Brief description (2-3 sentences)
   - Why it matches their preferences
   - Genre tags
3. Focus on manga available on MangaDex
4. Consider their reading history and preferences
5. Be conversational and enthusiastic
6. If they ask follow-up questions, maintain context from previous recommendations

Format your response in a friendly, readable way with clear sections for each manga.`
}

async function getGeminiRecommendations(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `User Question: ${userPrompt}` }
            ]
          }
        ],
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
    const errorText = await response.text()
    console.error('Gemini API error:', response.status, errorText)
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    console.error('Invalid Gemini API response:', data)
    throw new Error('Invalid response from Gemini API')
  }
  
  return data.candidates[0].content.parts[0].text
}

async function searchMangaDexFromRecommendations(recommendations: string): Promise<MangaDexManga[]> {
  // Extract manga titles from recommendations (titles in quotes)
  const titlePattern = /"([^"]+)"/g
  const matches = [...recommendations.matchAll(titlePattern)]
  const titles = matches.map(m => m[1]).slice(0, 5) // Limit to 5

  const searchPromises = titles.map(async (title) => {
    try {
      const response = await fetch(
        `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=1&includes[]=cover_art`,
        {
          headers: {
            'User-Agent': 'MangaApp/1.0'
          }
        }
      )
      
      if (!response.ok) {
        console.warn(`MangaDex API error for "${title}":`, response.status)
        return null
      }

      const data = await response.json()
      if (data.data.length === 0) {
        return null
      }

      const manga = data.data[0]
      
      // Get cover art
      const coverRelation = manga.relationships.find((r: any) => r.type === 'cover_art')
      let coverUrl = null
      
      if (coverRelation) {
        const coverId = coverRelation.id
        try {
          const coverResponse = await fetch(`https://api.mangadex.org/cover/${coverId}`)
          if (coverResponse.ok) {
            const coverData = await coverResponse.json()
            const fileName = coverData.data.attributes.fileName
            coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.512.jpg`
          }
        } catch (err) {
          console.error('Failed to fetch cover for:', title, err)
        }
      }

      return {
        id: manga.id,
        title: manga.attributes.title.en || Object.values(manga.attributes.title)[0],
        coverUrl: coverUrl || undefined,
        status: manga.attributes.status
      } as MangaDexManga
    } catch (err) {
      console.error('Failed to search MangaDex for:', title, err)
      return null
    }
  })

  const results = await Promise.all(searchPromises)
  return results.filter((result): result is MangaDexManga => result !== null)
}

async function saveChatHistory(userId: string, userMessage: string, assistantMessage: string) {
  try {
    const { data: existing, error: fetchError } = await supabaseClient
      .from('ai_chat_history')
      .select('id, messages')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching chat history:', fetchError)
      return
    }

    const newMessages = [
      { role: 'user' as const, content: userMessage, timestamp: new Date().toISOString() },
      { role: 'assistant' as const, content: assistantMessage, timestamp: new Date().toISOString() }
    ]

    if (existing) {
      // Append to existing conversation
      const updatedMessages = [...(existing.messages || []), ...newMessages].slice(-20) // Keep last 20 messages

      const { error: updateError } = await supabaseClient
        .from('ai_chat_history')
        .update({ 
          messages: updatedMessages, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Error updating chat history:', updateError)
      }
    } else {
      // Create new conversation
      const { error: insertError } = await supabaseClient
        .from('ai_chat_history')
        .insert({
          user_id: userId,
          messages: newMessages
        })

      if (insertError) {
        console.error('Error inserting chat history:', insertError)
      }
    }
  } catch (error) {
    console.error('Failed to save chat history:', error)
    // Non-critical, don't throw
  }
}