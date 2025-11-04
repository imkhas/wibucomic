import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SUPABASE_URL = Deno.env.get('DUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('DUPABASE_SERVICE_ROLE_KEY')!

const supabaseClient = createClient(DUPABASE_URL, DUPABASE_SERVICE_ROLE_KEY)

interface RedditPost {
  data: {
    title: string;
    selftext: string;
    score: number;
    num_comments: number;
    created_utc: number;
    url: string;
  };
}

serve(async (req) => {
  try {
    console.log('Starting Reddit trends sync...')

    // Fetch top posts from r/manga
    const subreddits = ['manga', 'mangarecommendations', 'Mangareviews']
    const allMangaMentions: Record<string, { count: number; score: number; titles: Set<string> }> = {}

    for (const subreddit of subreddits) {
      try {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=100`,
          {
            headers: {
              'User-Agent': 'WibuComic/1.0'
            }
          }
        )

        if (!response.ok) {
          console.error(`Failed to fetch r/${subreddit}:`, response.statusText)
          continue
        }

        const data = await response.json()
        const posts: RedditPost[] = data.data.children

        // Extract manga mentions from posts
        for (const post of posts) {
          const text = `${post.data.title} ${post.data.selftext}`.toLowerCase()
          const mangaTitles = extractMangaTitles(text)

          for (const title of mangaTitles) {
            if (!allMangaMentions[title]) {
              allMangaMentions[title] = { count: 0, score: 0, titles: new Set() }
            }
            allMangaMentions[title].count++
            allMangaMentions[title].score += post.data.score
            allMangaMentions[title].titles.add(post.data.title)
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (err) {
        console.error(`Error processing r/${subreddit}:`, err)
      }
    }

    // Search MangaDex for each trending title and store results
    const trendingData = []
    const sortedManga = Object.entries(allMangaMentions)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 50) // Top 50 trending

    for (const [title, data] of sortedManga) {
      try {
        // Search MangaDex for the title
        const searchResponse = await fetch(
          `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=1&includes[]=cover_art`
        )

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          if (searchData.data.length > 0) {
            const manga = searchData.data[0]
            trendingData.push({
              manga_id: manga.id,
              title: manga.attributes.title.en || Object.values(manga.attributes.title)[0],
              mention_count: data.count,
              sentiment_score: data.score / data.count, // Average score
              source: 'reddit',
              last_updated: new Date().toISOString()
            })
          }
        }

        // Rate limiting for MangaDex
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (err) {
        console.error(`Error searching MangaDex for ${title}:`, err)
      }
    }

    // Upsert trending data to database
    if (trendingData.length > 0) {
      const { error } = await supabaseClient
        .from('trending_manga')
        .upsert(trendingData, { onConflict: 'manga_id' })

      if (error) {
        console.error('Failed to insert trending data:', error)
        throw error
      }

      console.log(`Successfully synced ${trendingData.length} trending manga`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: trendingData.length,
        trending: trendingData.slice(0, 10).map(t => ({ title: t.title, mentions: t.mention_count }))
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in sync-reddit-trends:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function extractMangaTitles(text: string): string[] {
  // Common patterns for manga titles in Reddit posts
  const patterns = [
    // Quoted titles: "One Piece", 'Naruto'
    /"([^"]{3,50})"/g,
    /'([^']{3,50})'/g,
    // Bracketed titles: [One Piece]
    /\[([^\]]{3,50})\]/g,
    // Title-like capitalization: One Piece, Attack on Titan
    /(?:^|\s)([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,4})(?:\s|$|[.,!?])/g
  ]

  const titles = new Set<string>()

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      let title = match[1].trim()
      
      // Filter out common false positives
      if (shouldIncludeTitle(title)) {
        titles.add(title)
      }
    }
  }

  return Array.from(titles)
}

function shouldIncludeTitle(title: string): boolean {
  const blacklist = [
    'reddit', 'manga', 'anime', 'chapter', 'volume', 'disc',
    'the best', 'my favorite', 'anyone know', 'can someone',
    'i read', 'i watched', 'looking for', 'similar to',
    'recommendation', 'suggest', 'help me', 'question'
  ]

  const lowerTitle = title.toLowerCase()

  // Must be 3-50 characters
  if (title.length < 3 || title.length > 50) return false

  // Must not contain blacklisted phrases
  if (blacklist.some(phrase => lowerTitle.includes(phrase))) return false

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(title)) return false

  // Must not be all caps (likely acronym or emphasis)
  if (title === title.toUpperCase() && title.length > 4) return false

  return true
}