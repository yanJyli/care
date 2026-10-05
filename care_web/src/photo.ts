import { LABEL_PHOTO_EDGE, LABEL_PHOTO_MAX_BASE64, LABEL_PHOTO_QUALITY } from '@/lib/photoSize'

export type PhotoPayload = {
  mimeType: string
  base64: string
  preview: string
}

export async function photoFromFile(file: File): Promise<PhotoPayload | null> {
  const dataUrl = await readFile(file)
  if (!dataUrl) return null
  const shrunk = await shrink(dataUrl)
  const photo = splitDataUrl(shrunk)
  if (!photo || photo.base64.length > LABEL_PHOTO_MAX_BASE64) return null
  return { ...photo, preview: shrunk }
}

function readFile(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

function splitDataUrl(dataUrl: string) {
  const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl.trim())
  if (!match?.[2]) return null
  return { mimeType: match[1] || 'image/jpeg', base64: match[2].replace(/\s/g, '') }
}

function shrink(dataUrl: string) {
  return new Promise<string>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, LABEL_PHOTO_EDGE / Math.max(img.width, img.height))
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
      resolve(canvas.toDataURL('image/jpeg', LABEL_PHOTO_QUALITY))
    }
    img.onerror = () => resolve('')
    img.src = dataUrl
  })
}
