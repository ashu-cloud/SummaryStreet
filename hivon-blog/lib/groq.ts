import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const UNSPLASH_SOURCE_BASE = 'https://source.unsplash.com/1600x900/?'
const DEFAULT_UNSPLASH_IMAGE_URL = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80'

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

export async function generateCoverImageUrl(
  title: string,
  body: string
): Promise<{ imageUrl: string; query: string; isFallback: boolean }> {
  const fallback = {
    imageUrl: DEFAULT_UNSPLASH_IMAGE_URL,
    query: 'writing blog',
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

    return {
      imageUrl: `${UNSPLASH_SOURCE_BASE}${encodeURIComponent(query)}`,
      query,
      isFallback: false,
    }
  } catch {
    return fallback
  }
}
