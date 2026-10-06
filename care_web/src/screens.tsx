import { useEffect, useRef, useState } from 'react'
import { shortVerdict } from '@/lib/analyze'
import { answerSection, splitAnswerPoint } from '@/lib/answerView'
import { chatIntro } from '@/lib/chatIntro'
import { readComposer, submitsOnEnter } from '@/lib/composer'
import { consult } from '@/lib/consult'
import { createId } from '@/lib/ids'
import type { ChatMessage, ChatRedirect, ProductReport } from '@/types'
import { AddDialog, ConfirmDialog, Page, ScreenHeader, TileGrid } from './components'
import { photoFromFile } from './photo'
import { useNav } from './router'
import { useCatalog } from './store'

export function HomeScreen() {
  const { categories } = useCatalog()
  const { push } = useNav()
  return (
    <Page>
      <div className="home-header">
        <p className="kicker">Care</p>
        <h1>Подбор косметики</h1>
        <p className="lead">Выберите зону ухода</p>
        <InstallHint />
      </div>
      <TileGrid items={categories} onPress={(id) => push(`/category/${encodeURIComponent(id)}`)} />
    </Page>
  )
}

export function CategoryScreen({ id }: { id: string }) {
  const { categoryById, addSection, removeSection } = useCatalog()
  const { push, replace } = useNav()
  const category = categoryById(id)
  const [adding, setAdding] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null)

  if (!category) {
    return (
      <Page>
        <ScreenHeader crumbs={[{ label: 'Раздел не найден' }]} onBack={() => replace('/')} />
      </Page>
    )
  }

  return (
    <Page>
      <ScreenHeader
        crumbs={[{ label: 'Care', href: '/' }, { label: category.title }]}
        subtitle="Выберите тип средства"
        onBack={() => replace('/')}
      />
      <TileGrid
        items={category.sections}
        addLabel="Новый раздел"
        onPress={(sectionId) => push(`/section/${encodeURIComponent(sectionId)}`)}
        onAdd={() => setAdding(true)}
        onDelete={(sectionId) => {
          const section = category.sections.find((item) => item.id === sectionId)
          if (!section?.custom) return
          setPendingDelete({ id: section.id, title: section.title })
        }}
      />
      <AddDialog
        visible={adding}
        title="Новый раздел"
        onClose={() => setAdding(false)}
        onSubmit={(name) => {
          addSection(category.id, name, 'bloom')
          setAdding(false)
        }}
      />
      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Удалить раздел?"
        body={pendingDelete ? `«${pendingDelete.title}» и его критерии исчезнут из списка.` : ''}
        confirmLabel="Удалить"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeSection(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </Page>
  )
}

export function CriteriaScreen({ id }: { id: string }) {
  const { sectionById, addCriterion, removeCriterion } = useCatalog()
  const { push, replace } = useNav()
  const found = sectionById(id)
  const [adding, setAdding] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null)

  if (!found) {
    return (
      <Page>
        <ScreenHeader crumbs={[{ label: 'Раздел не найден' }]} onBack={() => replace('/')} />
      </Page>
    )
  }

  return (
    <Page>
      <ScreenHeader
        crumbs={[
          { label: 'Care', href: '/' },
          { label: found.category.title, href: `/category/${encodeURIComponent(found.category.id)}` },
          { label: found.section.title },
        ]}
        subtitle="Выберите критерий"
        onBack={() => replace(`/category/${encodeURIComponent(found.category.id)}`)}
      />
      <TileGrid
        items={found.section.criteria}
        addLabel="Новый критерий"
        onPress={(criterionId) => push(`/pick/${encodeURIComponent(criterionId)}`)}
        onAdd={() => setAdding(true)}
        onDelete={(criterionId) => {
          const criterion = found.section.criteria.find((item) => item.id === criterionId)
          if (!criterion?.custom) return
          setPendingDelete({ id: criterion.id, title: criterion.title })
        }}
      />
      <AddDialog
        visible={adding}
        title="Новый критерий"
        onClose={() => setAdding(false)}
        onSubmit={(name) => {
          addCriterion(found.section.id, name, 'bead')
          setAdding(false)
        }}
      />
      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Удалить критерий?"
        body={pendingDelete ? `«${pendingDelete.title}» исчезнет из списка.` : ''}
        confirmLabel="Удалить"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeCriterion(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </Page>
  )
}

export function PickScreen({ id }: { id: string }) {
  const { criterionById, sessionFor, updateSession, clearSession } = useCatalog()
  const { push, replace } = useNav()
  const found = criterionById(id)
  const session = sessionFor(id)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState<'photo' | 'reply'>('reply')
  const [shots, setShots] = useState<Record<string, string>>({})
  const [photoHint, setPhotoHint] = useState('')
  const [confirmingClear, setConfirmingClear] = useState(false)
  const generation = useRef(0)
  const sending = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)

  function scrollDown() {
    window.setTimeout(() => {
      const node = scrollRef.current
      if (node) node.scrollTop = node.scrollHeight
    }, 40)
  }

  useEffect(() => {
    scrollDown()
  }, [session.messages.length, busy])

  if (!found) {
    return (
      <Page>
        <ScreenHeader crumbs={[{ label: 'Критерий не найден' }]} onBack={() => replace('/')} />
      </Page>
    )
  }

  const criterion = found.criterionTitle
  const sectionTitle = found.section.title
  const sectionId = found.section.id
  const zoneTitle = found.category.title
  const canSend = draft.trim().length > 0 && !busy

  async function send() {
    const read = readComposer(draft)
    if (!read.query || sending.current) return
    sending.current = true
    const ticket = generation.current
    setPhase('reply')
    const userMessage: ChatMessage = {
      id: createId('m'),
      role: 'user',
      paragraphs: read.formula ? [read.question ? read.query : read.name || 'Свой состав', 'Состав указан вручную'] : [read.query],
    }
    setDraft('')
    if (fieldRef.current) fieldRef.current.style.height = ''
    setBusy(true)
    updateSession(id, (current) => ({ ...current, messages: [...current.messages, userMessage] }))
    scrollDown()
    try {
      const result = await consult({
        query: read.query,
        criterion,
        section: sectionTitle,
        sectionId,
        zone: zoneTitle,
        previous: session.products,
        history: [...session.messages, userMessage],
        formula: read.formula,
      })
      if (ticket !== generation.current) return
      const assistant: ChatMessage = {
        id: createId('m'),
        role: 'assistant',
        paragraphs: result.paragraphs,
        redirect: result.redirect,
      }
      updateSession(id, (current) => ({
        messages: [...current.messages, assistant],
        products: result.product ? [...current.products, result.product] : current.products,
      }))
      scrollDown()
    } finally {
      sending.current = false
      if (ticket === generation.current) setBusy(false)
    }
  }

  async function sendPhoto(file: File | undefined) {
    if (!file || sending.current) return
    setPhotoHint('')
    const picked = await photoFromFile(file)
    if (!picked) {
      setPhotoHint('Это фото не удалось прочитать. Попробуйте другое.')
      return
    }
    sending.current = true
    const ticket = generation.current
    const userMessage: ChatMessage = {
      id: createId('m'),
      role: 'user',
      paragraphs: ['Фото упаковки'],
    }
    setShots((current) => ({ ...current, [userMessage.id]: picked.preview }))
    setPhase('photo')
    setBusy(true)
    updateSession(id, (current) => ({ ...current, messages: [...current.messages, userMessage] }))
    scrollDown()
    try {
      const result = await consult({
        query: 'Фото упаковки',
        criterion,
        section: sectionTitle,
        sectionId,
        zone: zoneTitle,
        previous: session.products,
        history: [...session.messages, userMessage],
        formula: '',
        photo: { mimeType: picked.mimeType, base64: picked.base64 },
      })
      if (ticket !== generation.current) return
      const title = result.product?.name.trim()
      if (title) {
        const named: ChatMessage = { ...userMessage, paragraphs: [title, 'Прочитано с фото'] }
        updateSession(id, (current) => ({
          ...current,
          messages: current.messages.map((message) => (message.id === userMessage.id ? named : message)),
        }))
      }
      const assistant: ChatMessage = {
        id: createId('m'),
        role: 'assistant',
        paragraphs: result.paragraphs,
        redirect: result.redirect,
      }
      updateSession(id, (current) => ({
        messages: [...current.messages, assistant],
        products: result.product && !result.redirect ? [...current.products, result.product] : current.products,
      }))
      scrollDown()
    } finally {
      sending.current = false
      if (ticket === generation.current) setBusy(false)
    }
  }

  function confirmClear() {
    generation.current += 1
    setBusy(false)
    setShots({})
    setPhotoHint('')
    setConfirmingClear(false)
    clearSession(id)
  }

  return (
    <div className="pick">
      <ScreenHeader
        crumbs={[
          { label: 'Care', href: '/' },
          { label: found.category.title, href: `/category/${encodeURIComponent(found.category.id)}` },
          { label: found.section.title, href: `/section/${encodeURIComponent(found.section.id)}` },
          { label: criterion },
        ]}
        onBack={() => replace(`/section/${encodeURIComponent(found.section.id)}`)}
        action={session.messages.length > 0 ? { label: 'Очистить', onPress: () => setConfirmingClear(true) } : undefined}
      />
      <div className="thread" ref={scrollRef}>
        {session.products.length > 0 ? <Selected products={session.products} /> : null}
        {session.messages.length === 0 && !busy ? (
          <div className="empty">
            <h2>{chatIntro.title}</h2>
            <p>{chatIntro.lead}</p>
            <ul>
              {chatIntro.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p>{chatIntro.tail}</p>
          </div>
        ) : (
          <div className="messages">
            {session.messages.map((message) => (
              <Message key={message.id} message={message} preview={shots[message.id]} onRedirect={(redirect) => push(redirectPath(redirect))} />
            ))}
            {busy ? <div className="bubble assistant">{phase === 'photo' ? 'Смотрю упаковку…' : 'Отвечаю…'}</div> : null}
          </div>
        )}
      </div>
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault()
          void send()
        }}
      >
        {session.products.length > 0 ? (
          <p className="compare-hint">Можно уточнить, вставить другой состав, назвать ещё один продукт или сфотографировать упаковку. С лицевой стороны состав ищется на официальном сайте бренда.</p>
        ) : null}
        <div className="composer-row">
          <textarea
            ref={fieldRef}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value)
              const node = event.target
              node.style.height = 'auto'
              node.style.height = `${Math.min(node.scrollHeight, 140)}px`
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey || !submitsOnEnter(draft)) return
              event.preventDefault()
              void send()
            }}
            placeholder="Состав, продукт или вопрос"
            disabled={busy}
            rows={1}
          />
          <button type="submit" className="send" aria-label="Отправить" disabled={!canSend}>
            →
          </button>
        </div>
        <div className="sources">
          <button type="button" disabled={busy} onClick={() => cameraRef.current?.click()}>
            Камера
          </button>
          <button type="button" disabled={busy} onClick={() => libraryRef.current?.click()}>
            Галерея
          </button>
        </div>
        {photoHint ? <p className="photo-hint">{photoHint}</p> : null}
        <input
          ref={cameraRef}
          className="file"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            void sendPhoto(file)
          }}
        />
        <input
          ref={libraryRef}
          className="file"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            void sendPhoto(file)
          }}
        />
      </form>
      <ConfirmDialog
        visible={confirmingClear}
        title="Очистить подбор?"
        body="Выбранные продукты и разбор будут удалены."
        confirmLabel="Очистить"
        onClose={() => setConfirmingClear(false)}
        onConfirm={confirmClear}
      />
    </div>
  )
}

function Selected({ products }: { products: ProductReport[] }) {
  return (
    <div className="strip">
      {products.map((product, index) => (
        <article key={product.id} className="product-card">
          <p className="product-index">{String(index + 1).padStart(2, '0')}</p>
          <p className="product-name">{product.name}</p>
          {product.ingredients ? (
            <p className="product-meta">
              {product.brand ? `${product.brand} · ` : ''}
              {shortVerdict(product)}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  )
}

function Message({
  message,
  preview,
  onRedirect,
}: {
  message: ChatMessage
  preview?: string
  onRedirect: (redirect: ChatRedirect) => void
}) {
  if (message.role === 'user') {
    return (
      <div className="bubble user">
        {preview ? <img className="shot" src={preview} alt="" /> : null}
        <p>{message.paragraphs[0]}</p>
        {message.paragraphs[1] ? <p className="user-note">{message.paragraphs[1]}</p> : null}
      </div>
    )
  }
  return (
    <div className="bubble assistant">
      {message.paragraphs.map((paragraph, index) => (
        <AssistantLine key={`${message.id}-${index}`} text={paragraph} spaced={index > 0} />
      ))}
      {message.redirect ? (
        <button type="button" className="redirect" onClick={() => onRedirect(message.redirect!)}>
          {message.redirect.label}
        </button>
      ) : null}
    </div>
  )
}

function AssistantLine({ text, spaced }: { text: string; spaced: boolean }) {
  const section = answerSection(text)
  if (section) {
    const tone = section.tone === 'plus' ? '' : ` ${section.tone}`
    return <p className={`section${tone}${spaced ? ' gap' : ''}`}>{section.label}</p>
  }
  const point = splitAnswerPoint(text)
  if (point) {
    return (
      <p className={spaced ? 'body gap' : 'body'}>
        <strong>{point.name}</strong>
        {' — '}
        {point.rest}
      </p>
    )
  }
  return <p className={spaced ? 'body gap' : 'body'}>{text}</p>
}

function redirectPath(redirect: ChatRedirect) {
  if (redirect.pathname === '/section/[id]') return `/section/${encodeURIComponent(redirect.id)}`
  return `/category/${encodeURIComponent(redirect.id)}`
}

function InstallHint() {
  const [install, setInstall] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(() => window.matchMedia('(display-mode: standalone)').matches || iosStandalone())

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstall(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (hidden) return null
  if (!install && !isIos()) return null

  return (
    <div className="install">
      {install ? (
        <button
          type="button"
          className="install-button"
          onClick={() => {
            void install.prompt().then(() => setHidden(true))
          }}
        >
          Установить Care
        </button>
      ) : (
        <p>Откройте сайт в Safari, нажмите «Поделиться» и выберите «На экран Домой». Care откроется на весь экран и останется на телефоне.</p>
      )}
    </div>
  )
}

function isIos() {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function iosStandalone() {
  return 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}
