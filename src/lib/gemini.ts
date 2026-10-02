import Constants from 'expo-constants'

function devServer() {
  const candidates = [Constants.expoConfig?.hostUri, Constants.linkingUri, Constants.experienceUrl]
  for (const candidate of candidates) {
    if (!candidate) continue
    const hostPort = candidate.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').split('/')[0] ?? ''
    const host = hostPort.split(':')[0]
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return hostPort
  }
  return ''
}

export function geminiTarget(model: string, key: string) {
  const server = devServer()
  if (server) {
    return {
      url: `http://${server}/models/${encodeURIComponent(model)}`,
      headers: { 'Content-Type': 'application/json' } as Record<string, string>,
    }
  }
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
  }
}
