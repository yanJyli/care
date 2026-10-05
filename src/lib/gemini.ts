import Constants from 'expo-constants'

function endpoints() {
  const found: { host: string; hostPort: string }[] = []
  for (const candidate of [Constants.expoConfig?.hostUri, Constants.linkingUri, Constants.experienceUrl]) {
    if (!candidate) continue
    const hostPort = candidate.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').split('/')[0] ?? ''
    const host = hostPort.split(':')[0] ?? ''
    if (host) found.push({ host, hostPort })
  }
  return found
}

function devProxy() {
  const servers = endpoints()
  const tunnel = servers.find((server) => server.host.endsWith('.exp.direct'))
  if (tunnel) return { base: `https://${tunnel.host}`, tunnel: true }
  const lan = servers.find((server) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(server.host))
  if (lan) return { base: `http://${lan.hostPort}`, tunnel: false }
  return null
}

export function geminiTarget(model: string, key: string) {
  const proxy = devProxy()
  if (proxy) {
    return {
      url: `${proxy.base}/models/${encodeURIComponent(model)}`,
      headers: {
        'Content-Type': 'application/json',
        ...(proxy.tunnel ? { 'ngrok-skip-browser-warning': '1' } : {}),
      } as Record<string, string>,
    }
  }
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
  }
}
