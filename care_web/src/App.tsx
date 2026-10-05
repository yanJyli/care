import { useEffect, useRef } from 'react'
import { Splash } from './components'
import { useNav } from './router'
import { CategoryScreen, CriteriaScreen, HomeScreen, PickScreen } from './screens'
import { CatalogProvider } from './store'

export function App() {
  return (
    <>
      <CatalogProvider>
        <Shell />
      </CatalogProvider>
      <Splash />
    </>
  )
}

function Shell() {
  const { route } = useNav()
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = scroller.current?.querySelector('.page, .thread')
    if (node instanceof HTMLElement) node.scrollTo(0, 0)
  }, [route])

  return (
    <div className="shell">
      <div className="column" ref={scroller}>
        {route.name === 'home' ? <HomeScreen /> : null}
        {route.name === 'category' ? <CategoryScreen id={route.id} /> : null}
        {route.name === 'section' ? <CriteriaScreen id={route.id} /> : null}
        {route.name === 'pick' ? <PickScreen id={route.id} /> : null}
      </div>
    </div>
  )
}
