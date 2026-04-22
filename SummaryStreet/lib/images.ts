export const DEFAULT_UNSPLASH_IMAGE_URL =
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80'

const UNSPLASH_TOPIC_IMAGES = {
  technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1600&q=80',
  ],
  business: [
    'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
  ],
  health: [
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80',
  ],
  nature: [
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80',
  ],
  lifestyle: [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1496483648148-47c686dc86a8?auto=format&fit=crop&w=1600&q=80',
  ],
  default: [
    DEFAULT_UNSPLASH_IMAGE_URL,
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80',
  ],
} as const

type UnsplashTopic = keyof typeof UNSPLASH_TOPIC_IMAGES

function hashText(text: string): number {
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function inferTopic(query: string): UnsplashTopic {
  const normalized = query.toLowerCase()

  if (/(ai|tech|software|code|program|data|robot|digital|computer)/.test(normalized)) return 'technology'
  if (/(startup|finance|market|office|management|strategy|business|leadership)/.test(normalized)) return 'business'
  if (/(health|medical|fitness|wellness|doctor|hospital|nutrition|mindfulness)/.test(normalized)) return 'health'
  if (/(nature|travel|mountain|forest|ocean|landscape|wildlife|environment)/.test(normalized)) return 'nature'
  if (/(food|home|lifestyle|fashion|art|music|education|learning|study|writing)/.test(normalized)) return 'lifestyle'

  return 'default'
}

export function chooseUnsplashFallback(query: string): string {
  const topic = inferTopic(query)
  const pool = UNSPLASH_TOPIC_IMAGES[topic]
  const idx = hashText(query || topic) % pool.length
  return pool[idx]
}

export function normalizePostImageUrl(
  imageUrl: string | null | undefined,
  queryHint = 'blog writing'
): string | null {
  if (!imageUrl) return null

  try {
    const parsed = new URL(imageUrl)
    const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:'
    if (!isHttp) return chooseUnsplashFallback(queryHint)
  } catch {
    return chooseUnsplashFallback(queryHint)
  }

  if (imageUrl.includes('source.unsplash.com')) {
    // Legacy Source URLs are deprecated and can return broken images.
    return chooseUnsplashFallback(queryHint)
  }

  return imageUrl
}
