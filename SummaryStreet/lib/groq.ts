import Groq from 'groq-sdk'
import { chooseUnsplashFallback } from './images'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

interface UnsplashSearchResponse {
  results?: Array<{
    urls?: {
      raw?: string
      regular?: string
    }
  }>
}

export async function generateSummary(title: string, body: string): Promise<string> {
  const prompt = `You are a blog content summarizer. Given the following blog post title and content, generate a concise and engaging summary of approximately 200 words. The summary should capture the main ideas, key points, and the essence of the article. Write in third person and make it suitable for a blog listing page.

Title: ${title}

Content:
${body.substring(0, 3000)}

Please provide ONLY the summary text, no additional commentary or labels.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 300,
    temperature: 0.7,
  })

  return completion.choices[0]?.message?.content?.trim() ?? 'Summary not available.'
}

function sanitizeImageQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function findUnsplashImage(query: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    return null
  }

  const searchUrl = new URL('https://api.unsplash.com/search/photos')
  searchUrl.searchParams.set('query', query)
  searchUrl.searchParams.set('orientation', 'landscape')
  searchUrl.searchParams.set('per_page', '1')
  searchUrl.searchParams.set('content_filter', 'high')

  try {
    const response = await fetch(searchUrl.toString(), {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    })

    if (!response.ok) {
      console.error('Unsplash search request failed:', response.status)
      return null
    }

    const data = (await response.json()) as UnsplashSearchResponse
    const imageBase = data.results?.[0]?.urls?.regular ?? data.results?.[0]?.urls?.raw

    if (!imageBase) {
      return null
    }

    return imageBase.includes('?')
      ? `${imageBase}&auto=format&fit=crop&w=1600&q=80`
      : `${imageBase}?auto=format&fit=crop&w=1600&q=80`
  } catch (error) {
    console.error('Unsplash image fetch failed:', error)
    return null
  }
}

export async function generateCoverImageUrl(
  title: string,
  body: string
): Promise<{ imageUrl: string; query: string; isFallback: boolean }> {
  const fallbackQuery = 'writing blog'
  const fallback = {
    imageUrl: chooseUnsplashFallback(fallbackQuery),
    query: fallbackQuery,
    isFallback: true,
  }

  try {
    const prompt = `You select cover-photo search queries for blog posts.
Given the title and content below, return ONLY a short Unsplash query (2 to 5 words).
The query must describe concrete visual subjects and style.
Do not include punctuation, quotes, or extra text.

Title: ${title}

Content:
${body.substring(0, 1500)}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 30,
      temperature: 0.3,
    })

    const rawQuery = completion.choices[0]?.message?.content?.trim() ?? ''
    const query = sanitizeImageQuery(rawQuery)

    if (!query) {
      return fallback
    }

    const unsplashImage = await findUnsplashImage(query)

    if (unsplashImage) {
      return {
        imageUrl: unsplashImage,
        query,
        isFallback: false,
      }
    }

    return {
      imageUrl: chooseUnsplashFallback(query),
      query,
      isFallback: true,
    }
  } catch {
    return fallback
  }
}
