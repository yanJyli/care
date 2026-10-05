import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'category'; id: string }
  | { name: 'section'; id: string }
  | { name: 'pick'; id: string }

type Nav = {
  route: Route
  push: (path: string) => void
  replace: (path: string) => void
}

const NavContext = createContext<Nav | null>(null)

export function parseRoute(path: string): Route {
  const parts = path.split('/').filter(Boolean).map((part) => decodeURIComponent(part))
  if (parts[0] === 'category' && parts[1]) return { name: 'category', id: parts[1] }
  if (parts[0] === 'section' && parts[1]) return { name: 'section', id: parts[1] }
  if (parts[0] === 'pick' && parts[1]) return { name: 'pick', id: parts[1] }
  return { name: 'home' }
}

export function Router({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const value = useMemo<Nav>(() => {
    const go = (next: string, mode: 'push' | 'replace') => {
      const url = next.startsWith('/') ? next : `/${next}`
      if (url === window.location.pathname) return
      if (mode === 'push') window.history.pushState(null, '', url)
      else window.history.replaceState(null, '', url)
      setPath(url)
    }
    return {
      route: parseRoute(path),
      push: (next) => go(next, 'push'),
      replace: (next) => go(next, 'replace'),
    }
  }, [path])

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

export function useNav() {
  const value = useContext(NavContext)
  if (!value) throw new Error('Навигация ещё не готова')
  return value
}
