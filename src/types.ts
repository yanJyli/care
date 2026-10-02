export type Effect =
  | 'humectant'
  | 'emollient'
  | 'occlusive'
  | 'barrier'
  | 'antioxidant'
  | 'uv'
  | 'soothing'
  | 'brightening'
  | 'exfoliant'
  | 'cleansing'
  | 'gentle'
  | 'harsh'
  | 'protein'
  | 'silicone'
  | 'oil'
  | 'butter'
  | 'refreshing'
  | 'sebum'
  | 'repair'
  | 'antiage'
  | 'fragrance'
  | 'drying'

export type Criterion = {
  id: string
  title: string
  custom?: boolean
  image?: string
}

export type Section = {
  id: string
  title: string
  custom?: boolean
  image?: string
  criteria: Criterion[]
}

export type Category = {
  id: string
  title: string
  sections: Section[]
}

export type ProductReport = {
  id: string
  code: string
  query: string
  name: string
  brand: string
  total: number
  score: number
  hitCount: number
  highlights: string[]
  known: string[]
  notes: string[]
  missingUv: boolean
  ingredients?: string
}

export type ChatRedirect = {
  label: string
  pathname: '/section/[id]' | '/category/[id]'
  id: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  paragraphs: string[]
  redirect?: ChatRedirect
}

export type Session = {
  messages: ChatMessage[]
  products: ProductReport[]
}

export type AppState = {
  categories: Category[]
  sessions: Record<string, Session>
}
