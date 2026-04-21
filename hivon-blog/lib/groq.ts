import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

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
