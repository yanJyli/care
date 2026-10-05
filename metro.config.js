const { readFileSync } = require('node:fs')
const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

function readKey() {
  try {
    const env = readFileSync(path.join(__dirname, '.env'), 'utf8')
    const match = env.match(/^EXPO_PUBLIC_GEMINI_API_KEY=(.*)$/m)
    return match?.[1]?.trim().replace(/^["']|["']$/g, '') ?? ''
  } catch {
    return ''
  }
}

const config = getDefaultConfig(__dirname)
const key = readKey()
const webCopy = /[/\\]care_web[/\\].*/
const currentBlockList = config.resolver.blockList
config.resolver.blockList = Array.isArray(currentBlockList)
  ? [...currentBlockList, webCopy]
  : currentBlockList
    ? [currentBlockList, webCopy]
    : [webCopy]

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware) => {
    return (req, res, next) => {
      const model = decodeURIComponent(req.url?.match(/^\/models\/([A-Za-z0-9._-]+)/)?.[1] ?? '')
      if (req.method !== 'POST' || !model.startsWith('gemini-') || !key) return metroMiddleware(req, res, next)

      const chunks = []
      let size = 0
      req.on('data', (chunk) => {
        size += chunk.length
        if (size <= 12_000_000) chunks.push(chunk)
      })
      req.on('end', async () => {
        if (size > 12_000_000) {
          res.writeHead(413, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: { message: 'photo too large' } }))
          return
        }
        try {
          const upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': key,
              },
              body: Buffer.concat(chunks),
            },
          )
          const body = Buffer.from(await upstream.arrayBuffer())
          res.writeHead(upstream.status, { 'Content-Type': 'application/json' })
          res.end(body)
        } catch {
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: { message: 'proxy failed' } }))
        }
      })
    }
  },
}

module.exports = config
