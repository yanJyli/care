import { useEffect, useState, type ReactNode } from 'react'
import { useNav } from './router'
import { tileImageFor } from './tiles'

export type Crumb = { label: string; href?: string }

export function ScreenHeader({
  crumbs,
  subtitle,
  onBack,
  action,
}: {
  crumbs?: Crumb[]
  subtitle?: string
  onBack?: () => void
  action?: { label: string; onPress: () => void }
}) {
  const { replace } = useNav()
  return (
    <header className="header">
      {onBack || action ? (
        <div className="header-row">
          {onBack ? (
            <button type="button" className="back" aria-label="Назад" onClick={onBack}>
              ←
            </button>
          ) : (
            <span />
          )}
          {action ? (
            <button type="button" className="header-action" onClick={action.onPress}>
              {action.label}
            </button>
          ) : null}
        </div>
      ) : null}
      {crumbs && crumbs.length > 0 ? (
        <nav className="crumbs" aria-label="Разделы">
          {crumbs.map((crumb, index) => {
            const label = crumb.label.toUpperCase()
            return (
            <span className="crumb" key={`${label}-${index}`}>
              {index > 0 ? (
                <span className="crumb-sep" aria-hidden="true">
                  {' · '}
                </span>
              ) : null}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="crumb-link"
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
                    event.preventDefault()
                    replace(crumb.href!)
                  }}
                >
                  {label}
                </a>
              ) : (
                <span aria-current="page">{label}</span>
              )}
            </span>
            )
          })}
        </nav>
      ) : null}
      {subtitle ? <p className="subtitle">{subtitle}</p> : null}
    </header>
  )
}

export function TileGrid({
  items,
  addLabel,
  onPress,
  onAdd,
  onDelete,
}: {
  items: { id: string; title: string; custom?: boolean; image?: string }[]
  addLabel?: string
  onPress: (id: string) => void
  onAdd?: () => void
  onDelete?: (id: string) => void
}) {
  return (
    <div className="tile-wrap">
      <div className="tile-grid">
        {items.map((item) => (
          <Tile
            key={item.id}
            item={item}
            onPress={() => onPress(item.id)}
            onDelete={item.custom && onDelete ? () => onDelete(item.id) : undefined}
          />
        ))}
        {onAdd && addLabel ? (
          <button type="button" className="tile add" aria-label={addLabel} onClick={onAdd}>
            <span className="plus">+</span>
            <span className="tile-title">{addLabel}</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Tile({
  item,
  onPress,
  onDelete,
}: {
  item: { id: string; title: string; image?: string }
  onPress: () => void
  onDelete?: () => void
}) {
  const image = tileImageFor(item.id, item.title, item.image)
  return (
    <div className={image ? 'tile photo' : 'tile'}>
      <button type="button" className="tile-hit" aria-label={item.title} onClick={onPress} />
      {image ? (
        <span className="product-frame">
          <img src={image} alt="" />
        </span>
      ) : null}
      <span className={image ? 'tile-title on-photo' : 'tile-title'}>{item.title}</span>
      {onDelete ? (
        <button type="button" className="remove" aria-label={`Удалить ${item.title}`} onClick={onDelete}>
          ×
        </button>
      ) : null}
    </div>
  )
}

export function AddDialog({
  visible,
  title,
  onClose,
  onSubmit,
}: {
  visible: boolean
  title: string
  onClose: () => void
  onSubmit: (name: string) => void
}) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(visible)
  if (visible !== open) {
    setOpen(visible)
    if (visible) setValue('')
  }

  if (!visible) return null
  const name = value.trim()

  return (
    <div className="backdrop" onClick={onClose}>
      <form
        className="dialog"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          if (name) onSubmit(name)
        }}
      >
        <h2>{title}</h2>
        <input
          autoFocus
          maxLength={40}
          placeholder="Название"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <div className="dialog-row">
          <button type="button" className="ghost" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="solid" disabled={!name}>
            Добавить
          </button>
        </div>
      </form>
    </div>
  )
}

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  visible: boolean
  title: string
  body: string
  confirmLabel: string
  onClose: () => void
  onConfirm: () => void
}) {
  if (!visible) return null
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="dialog" onClick={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="dialog-row">
          <button type="button" className="ghost" onClick={onClose}>
            Отмена
          </button>
          <button type="button" className="solid" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Splash() {
  const [gone, setGone] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const hold = window.setTimeout(() => setFading(true), 2000)
    const hide = window.setTimeout(() => setGone(true), 2380)
    return () => {
      window.clearTimeout(hold)
      window.clearTimeout(hide)
    }
  }, [])

  if (gone) return null
  return (
    <div className={fading ? 'splash fade' : 'splash'}>
      <p className="splash-mark">Care</p>
      <div className="splash-rule" />
      <p className="splash-line">Подбор уходовой косметики</p>
    </div>
  )
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="page">{children}</div>
}
