import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { View } from 'react-native'
import { cloneSeed } from '@/data/seed'
import { createId } from '@/lib/ids'
import { theme } from '@/theme'
import type { AppState, Category, Section, Session } from '@/types'

const STORAGE_KEY = 'uhod.catalog.v1'
const EMPTY_SESSION: Session = { messages: [], products: [] }

type Catalog = {
  categories: Category[]
  sessions: Record<string, Session>
  sessionFor: (criterionId: string) => Session
  categoryById: (id: string) => Category | undefined
  sectionById: (id: string) => { category: Category; section: Section } | undefined
  criterionById: (id: string) => { category: Category; section: Section; criterionTitle: string } | undefined
  addSection: (categoryId: string, title: string, image?: string) => void
  addCriterion: (sectionId: string, title: string, image?: string) => void
  removeSection: (sectionId: string) => void
  removeCriterion: (criterionId: string) => void
  updateSession: (criterionId: string, updater: (current: Session) => Session) => void
  clearSession: (criterionId: string) => void
}

const CatalogContext = createContext<Catalog | null>(null)

function mergeSeed(saved: AppState): AppState {
  const seed = cloneSeed()
  const categories = seed.map((seedCategory) => {
    const savedCategory = saved.categories.find((item) => item.id === seedCategory.id)
    if (!savedCategory) return seedCategory
    const sections = seedCategory.sections.map((seedSection) => {
      const savedSection = savedCategory.sections.find((item) => item.id === seedSection.id)
      if (!savedSection) return seedSection
      const criteria = [
        ...seedSection.criteria.map(
          (seedCriterion) => savedSection.criteria.find((item) => item.id === seedCriterion.id) ?? seedCriterion,
        ),
        ...savedSection.criteria.filter((item) => !seedSection.criteria.some((seedCriterion) => seedCriterion.id === item.id)),
      ]
      return { ...savedSection, title: savedSection.custom ? savedSection.title : seedSection.title, criteria }
    })
    const custom = savedCategory.sections.filter((item) => !seedCategory.sections.some((seedSection) => seedSection.id === item.id))
    return { ...savedCategory, sections: [...sections, ...custom] }
  })
  const extra = saved.categories.filter((item) => !seed.some((seedCategory) => seedCategory.id === item.id))
  return { ...saved, categories: [...categories, ...extra] }
}

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as AppState
  if (!Array.isArray(candidate.categories) || candidate.categories.length === 0) return false
  if (!candidate.sessions || typeof candidate.sessions !== 'object') return false
  return candidate.categories.every(
    (category) => typeof category?.id === 'string' && typeof category.title === 'string' && Array.isArray(category.sections),
  )
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [state, setState] = useState<AppState>({ categories: cloneSeed(), sessions: {} })

  useEffect(() => {
    let active = true
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) return
        if (raw) {
          try {
            const parsed: unknown = JSON.parse(raw)
            if (isAppState(parsed)) setState(mergeSeed(parsed))
          } catch {
            // Keep the built-in catalog if stored data is unreadable.
          }
        }
        setReady(true)
      })
      .catch(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {})
  }, [ready, state])

  const addSection = useCallback((categoryId: string, title: string, image?: string) => {
    const name = title.trim().replace(/\s+/g, ' ')
    if (!name) return
    setState((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              sections: [...category.sections, { id: createId('s'), title: name, custom: true, image, criteria: [] }],
            }
          : category,
      ),
    }))
  }, [])

  const addCriterion = useCallback((sectionId: string, title: string, image?: string) => {
    const name = title.trim().replace(/\s+/g, ' ')
    if (!name) return
    setState((current) => ({
      ...current,
      categories: current.categories.map((category) => ({
        ...category,
        sections: category.sections.map((section) =>
          section.id === sectionId
            ? { ...section, criteria: [...section.criteria, { id: createId('k'), title: name, custom: true, image }] }
            : section,
        ),
      })),
    }))
  }, [])

  const removeSection = useCallback((sectionId: string) => {
    setState((current) => {
      const section = current.categories.flatMap((category) => category.sections).find((item) => item.id === sectionId)
      if (!section?.custom) return current
      const sessions = { ...current.sessions }
      section.criteria.forEach((criterion) => {
        delete sessions[criterion.id]
      })
      return {
        sessions,
        categories: current.categories.map((category) => ({
          ...category,
          sections: category.sections.filter((item) => item.id !== sectionId),
        })),
      }
    })
  }, [])

  const removeCriterion = useCallback((criterionId: string) => {
    setState((current) => {
      const criterion = current.categories
        .flatMap((category) => category.sections)
        .flatMap((section) => section.criteria)
        .find((item) => item.id === criterionId)
      if (!criterion?.custom) return current
      const sessions = { ...current.sessions }
      delete sessions[criterionId]
      return {
        sessions,
        categories: current.categories.map((category) => ({
          ...category,
          sections: category.sections.map((section) => ({
            ...section,
            criteria: section.criteria.filter((item) => item.id !== criterionId),
          })),
        })),
      }
    })
  }, [])

  const updateSession = useCallback((criterionId: string, updater: (current: Session) => Session) => {
    setState((current) => {
      const session = current.sessions[criterionId] ?? EMPTY_SESSION
      return {
        ...current,
        sessions: { ...current.sessions, [criterionId]: updater(session) },
      }
    })
  }, [])

  const clearSession = useCallback((criterionId: string) => {
    setState((current) => {
      const sessions = { ...current.sessions }
      delete sessions[criterionId]
      return { ...current, sessions }
    })
  }, [])

  const value = useMemo<Catalog>(() => {
    const categoryById = (id: string) => state.categories.find((category) => category.id === id)
    const sectionById = (id: string) => {
      for (const category of state.categories) {
        const section = category.sections.find((item) => item.id === id)
        if (section) return { category, section }
      }
      return undefined
    }
    const criterionById = (id: string) => {
      for (const category of state.categories) {
        for (const section of category.sections) {
          const criterion = section.criteria.find((item) => item.id === id)
          if (criterion) return { category, section, criterionTitle: criterion.title }
        }
      }
      return undefined
    }
    return {
      categories: state.categories,
      sessions: state.sessions,
      sessionFor: (criterionId: string) => state.sessions[criterionId] ?? EMPTY_SESSION,
      categoryById,
      sectionById,
      criterionById,
      addSection,
      addCriterion,
      removeSection,
      removeCriterion,
      updateSession,
      clearSession,
    }
  }, [state, addSection, addCriterion, removeSection, removeCriterion, updateSession, clearSession])

  if (!ready) return <View style={{ flex: 1, backgroundColor: theme.bg }} />

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const value = useContext(CatalogContext)
  if (!value) throw new Error('Каталог ещё не готов')
  return value
}
