import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const SUPABASE_URL = Deno.env.get('DUPABASE_URL')!
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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { userId, prompt, includeMangaDex = false, conversationHistory = [] }: RequestBody = await req.json()

    if (!userId || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or prompt' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
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
    let mangaResults = []
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
          'Access-Control-Allow-Origin': '*',
        }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  }
})

async function getUserContext(userId: string): Promise<UserContext> {
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

    // Fetch manga details from MangaDex for bookmarked items
    const recentManga = []
    const genres: string[] = []

    if (bookmarks && bookmarks.length > 0) {
      // Limit to first 5 for API efficiency
      for (const bookmark of bookmarks.slice(0, 5)) {
        try {
          const response = await fetch(
            `https://api.mangadex.org/manga/${bookmark.comic_id}?includes[]=cover_art`
          )
          if (response.ok) {
            const data = await response.json()
            const title = data.data.attributes.title.en || Object.values(data.data.attributes.title)[0]
            const tags = data.data.attributes.tags || []
            const genre = extractGenreFromTags(tags)
            
            recentManga.push({ title, genre })
            if (genre) genres.push(genre)
          }
        } catch (err) {
          console.error('Failed to fetch manga:', bookmark.comic_id)
        }
      }
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
- Recently Read: ${userContext.recentManga.map(m => `"${m.title}" (${m.genre})`).join(', ') || 'None yet'}
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
    throw new Error(`Gemini API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

async function searchMangaDexFromRecommendations(recommendations: string): Promise<any[]> {
  // Extract manga titles from recommendations (titles in quotes)
  const titlePattern = /"([^"]+)"/g
  const matches = [...recommendations.matchAll(titlePattern)]
  const titles = matches.map(m => m[1]).slice(0, 5) // Limit to 5

  const results = []

  for (const title of titles) {
    try {
      const response = await fetch(
        `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=1&includes[]=cover_art`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.data.length > 0) {
          const manga = data.data[0]
          
          // Get cover art
          const coverRelation = manga.relationships.find((r: any) => r.type === 'cover_art')
          let coverUrl = null
          
          if (coverRelation) {
            const coverId = coverRelation.id
            const coverResponse = await fetch(`https://api.mangadex.org/cover/${coverId}`)
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
    } catch (err) {
      console.error('Failed to search MangaDex for:', title)
    }
  }

  return results
}

async function saveChatHistory(userId: string, userMessage: string, assistantMessage: string) {
  try {
    const { data: existing } = await supabaseClient
      .from('ai_chat_history')
      .select('id, messages')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const newMessages = [
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() }
    ]

    if (existing) {
      // Append to existing conversation
      const updatedMessages = [...(existing.messages || []), ...newMessages].slice(-20) // Keep last 20 messages

      await supabaseClient
        .from('ai_chat_history')
        .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      // Create new conversation
      await supabaseClient
        .from('ai_chat_history')
        .insert({
          user_id: userId,
          messages: newMessages
        })
    }
  } catch (error) {
    console.error('Failed to save chat history:', error)
    // Non-critical, don't throw
  }
}