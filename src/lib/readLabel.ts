import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { geminiTarget } from './gemini'

const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash']
const MAX_EDGE = 768

const PROMPT = `Посмотри на фото упаковки косметического средства.
Верни только две строки:
БРЕНД: название бренда как на упаковке
НАЗВАНИЕ: название средства как на упаковке, без бренда
Если строку не прочитать, напиши в ней: не видно
Не переводи, не додумывай и не добавляй других строк.`

export type LabelPhoto = {
  mimeType: string
  base64: string
}

export type LabelRead =
  | { name: string; brand: string }
  | { error: string }

type AssetBits = {
  uri: string
  width?: number
  height?: number
  base64?: string | null
  mimeType?: string | null
  file?: Blob | null
}

export async function imagePayload(asset: AssetBits): Promise<LabelPhoto | null> {
  if (asset.uri) {
    const prepared = await compress(asset)
    if (prepared) return prepared
  }
  const raw = await rawDataUrl(asset)
  if (!raw) return null
  const photo = splitDataUrl(await shrink(raw))
  if (!photo || photo.base64.length > 700_000) return null
  return photo
}

export function productQuery(label: { name: string; brand: string }) {
  const name = label.name.trim()
  const brand = label.brand.trim()
  if (!brand) return name
  if (name.toLowerCase().includes(brand.toLowerCase())) return name
  return `${brand} ${name}`
}

export async function readLabel(photo: LabelPhoto): Promise<LabelRead> {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() ?? ''
  if (!key) return { error: 'Чтение с фото доступно, когда подключена модель. Напишите название текстом.' }

  let overloaded = false
  for (const model of MODELS) {
    const result = await requestLabel(key, model, photo)
    if (result === 'overloaded') {
      overloaded = true
      continue
    }
    return result
  }
  if (overloaded) return { error: 'Сейчас модель перегружена. Подождите минуту и отправьте фото ещё раз.' }
  return { error: 'Не удалось прочитать фото. Попробуйте ещё раз или напишите название текстом.' }
}

async function requestLabel(key: string, model: string, photo: LabelPhoto): Promise<LabelRead | 'overloaded'> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 40000)
  let response: Response
  try {
    const target = geminiTarget(model, key)
    response = await fetch(target.url, {
      method: 'POST',
      signal: controller.signal,
      headers: target.headers,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: photo.mimeType || 'image/jpeg', data: photo.base64 } },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 200,
        },
      }),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { error: 'Фото слишком долго читалось. Снимите этикетку ближе и попробуйте ещё раз.' }
    }
    return { error: 'Не удалось прочитать фото. Проверьте интернет и попробуйте ещё раз.' }
  } finally {
    clearTimeout(timer)
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 404 || response.status === 429 || response.status === 503) return 'overloaded'
    return { error: 'Не удалось прочитать фото. Попробуйте ещё раз или напишите название текстом.' }
  }

  const parsed = parseLabel(readText(payload))
  if (!parsed) return { error: 'На фото не видно названия. Снимите этикетку ближе или напишите его текстом.' }
  return parsed
}

async function compress(asset: AssetBits): Promise<LabelPhoto | null> {
  try {
    const context = ImageManipulator.manipulate(asset.uri)
    const size = fit(asset.width ?? 0, asset.height ?? 0)
    if (size) context.resize(size)
    const rendered = await context.renderAsync()
    const saved = await rendered.saveAsync({ compress: 0.55, format: SaveFormat.JPEG, base64: true })
    if (!saved.base64) return null
    return { mimeType: 'image/jpeg', base64: saved.base64.replace(/\s/g, '') }
  } catch {
    return null
  }
}

function fit(width: number, height: number) {
  if (width <= 0 || height <= 0) return { width: MAX_EDGE }
  if (width <= MAX_EDGE && height <= MAX_EDGE) return null
  return width >= height ? { width: MAX_EDGE } : { height: MAX_EDGE }
}

async function rawDataUrl(asset: AssetBits) {
  if (asset.base64) return `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
  if (asset.file) return readBlob(asset.file)
  if (asset.uri.startsWith('data:')) return asset.uri
  if (asset.uri.startsWith('blob:') || asset.uri.startsWith('http')) {
    const response = await fetch(asset.uri)
    return readBlob(await response.blob())
  }
  return ''
}

function parseLabel(text: string) {
  const name = field(text, 'НАЗВАНИЕ')
  const brand = field(text, 'БРЕНД')
  if (name) return { name, brand }
  const line = text
    .split('\n')
    .map((item) => item.trim())
    .find(Boolean)
  if (!line || line.length > 80 || /[.!?]$/.test(line)) return null
  return { name: line, brand: '' }
}

function field(text: string, label: string) {
  const match = text.match(new RegExp(`${label}\\s*[:\\-–]\\s*(.+)`, 'i'))
  if (!match) return ''
  const value = match[1].trim().replace(/[.]+$/g, '')
  if (/^(не видно|неразборчиво|нет|unknown|n\/a|—|-)$/i.test(value)) return ''
  return value
}

function readText(payload: unknown) {
  if (!payload || typeof payload !== 'object') return ''
  const candidates = (payload as { candidates?: unknown }).candidates
  if (!Array.isArray(candidates)) return ''
  const content = (candidates[0] as { content?: { parts?: unknown } } | undefined)?.content
  if (!Array.isArray(content?.parts)) return ''
  return content.parts
    .map((part) => {
      if (!part || typeof part !== 'object') return ''
      const item = part as { text?: unknown; thought?: unknown }
      if (item.thought || typeof item.text !== 'string') return ''
      return item.text
    })
    .join('\n')
    .trim()
}

function splitDataUrl(dataUrl: string): LabelPhoto | null {
  const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl.trim())
  if (!match?.[2]) return null
  return { mimeType: match[1] || 'image/jpeg', base64: match[2].replace(/\s/g, '') }
}

function readBlob(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('file'))
    reader.readAsDataURL(blob)
  })
}

function shrink(dataUrl: string) {
  if (typeof document === 'undefined') return Promise.resolve(dataUrl)
  return new Promise<string>((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const maxEdge = MAX_EDGE
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.55))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}
