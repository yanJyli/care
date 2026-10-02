import { geminiTarget } from '@/lib/gemini'
import { fallbackTile, tileOptions } from '@/lib/tileImages'

const TEXT_MODEL = 'gemini-3.5-flash'
const IMAGE_MODELS = ['gemini-3.1-flash-image', 'gemini-2.5-flash-image']

export async function chooseTile(title: string, kind: 'section' | 'criterion', context: string) {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() ?? ''
  const fallback = fallbackTile(title, kind)
  if (!key) return fallback
  const generated = await generateTile(key, title, kind, context)
  if (generated) return generated
  return pickExisting(key, title, kind, context, fallback)
}

async function generateTile(key: string, title: string, kind: 'section' | 'criterion', context: string) {
  const subject = kind === 'section' ? 'the product container named by the title' : 'one simple object that means the title'
  const prompt = [
    'Square studio photograph, one object centered on a pure white background.',
    'Soft daylight, no text, no letters, no logo, no watermark, no collage, no hands.',
    `Show ${subject}.`,
    `Card title: «${title}».`,
    context ? `Context: ${context}.` : '',
    'Example: a sun-protection title must show a bright simple sun, not a bottle.',
  ]
    .filter(Boolean)
    .join(' ')

  for (const model of IMAGE_MODELS) {
    const picture = await requestImage(key, model, prompt)
    if (picture === 'stop') return null
    if (picture && picture !== 'retry') {
      const small = await shrink(picture)
      return small.length > 500_000 ? null : small
    }
  }
  return null
}

async function requestImage(key: string, model: string, prompt: string) {
  const square = await callImage(key, model, prompt, true)
  if (square !== 'retry') return square
  return callImage(key, model, prompt, false)
}

async function callImage(key: string, model: string, prompt: string, square: boolean) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 45000)
  try {
    const generationConfig = square
      ? { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } }
      : { responseModalities: ['IMAGE'] }
    const target = geminiTarget(model, key)
    const response = await fetch(target.url, {
      method: 'POST',
      signal: controller.signal,
      headers: target.headers,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      }),
    })
    if (response.status === 400) return 'retry'
    if (response.status === 404 || response.status === 429) return null
    if (!response.ok) return 'stop'
    const payload: unknown = await response.json().catch(() => null)
    return readImage(payload)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function readImage(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null
  const candidates = (payload as { candidates?: unknown }).candidates
  if (!Array.isArray(candidates)) return null
  const parts = (candidates[0] as { content?: { parts?: unknown } } | undefined)?.content?.parts
  if (!Array.isArray(parts)) return null
  for (const part of parts) {
    if (!part || typeof part !== 'object') continue
    const item = part as { inlineData?: { mimeType?: string; data?: string }; inline_data?: { mime_type?: string; data?: string } }
    const data = item.inlineData ?? item.inline_data
    if (!data?.data) continue
    const mime = item.inlineData?.mimeType ?? item.inline_data?.mime_type ?? 'image/png'
    return `data:${mime};base64,${data.data}`
  }
  return null
}

function shrink(dataUrl: string) {
  if (typeof document === 'undefined') return Promise.resolve(dataUrl)
  return new Promise<string>((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const size = 320
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      const scale = Math.min(size / img.width, size / img.height)
      const width = img.width * scale
      const height = img.height * scale
      ctx.drawImage(img, (size - width) / 2, (size - height) / 2, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.86))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

async function pickExisting(key: string, title: string, kind: 'section' | 'criterion', context: string, fallback: string) {
  const options = tileOptions[kind]

  const list = options.map((option) => `${option.id} — ${option.hint}`).join('\n')
  const place = kind === 'section' ? 'тип средства' : 'критерий'
  const prompt = [
    `Подбери картинку для карточки. Это ${place}: «${title}».`,
    context ? `Контекст: ${context}.` : '',
    'Выбери одну ближайшую по смыслу картинку из списка. Ответь только её идентификатором.',
    list,
  ]
    .filter(Boolean)
    .join('\n')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const target = geminiTarget(TEXT_MODEL, key)
    const response = await fetch(target.url, {
      method: 'POST',
      signal: controller.signal,
      headers: target.headers,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 80, thinkingConfig: { thinkingLevel: 'LOW' } },
      }),
    })
    if (!response.ok) return fallback
    const payload: unknown = await response.json().catch(() => null)
    const text = readText(payload).toLowerCase()
    const tokens = text.split(/[^a-z0-9]+/)
    const exact = options.find((option) => tokens.includes(option.id.toLowerCase()))
    if (exact) return exact.id
    const partial = options
      .filter((option) => text.includes(option.id.toLowerCase()))
      .sort((a, b) => b.id.length - a.id.length)[0]
    return partial?.id ?? fallback
  } catch {
    return fallback
  } finally {
    clearTimeout(timer)
  }
}

function readText(payload: unknown) {
  if (!payload || typeof payload !== 'object') return ''
  const candidates = (payload as { candidates?: unknown }).candidates
  if (!Array.isArray(candidates)) return ''
  const parts = (candidates[0] as { content?: { parts?: unknown } } | undefined)?.content?.parts
  if (!Array.isArray(parts)) return ''
  return parts
    .map((part) => {
      if (!part || typeof part !== 'object') return ''
      const item = part as { text?: unknown; thought?: unknown }
      if (item.thought || typeof item.text !== 'string') return ''
      return item.text
    })
    .join(' ')
    .trim()
}
