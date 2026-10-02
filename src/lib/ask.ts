import { seedCategories } from '../data/seed'
import { geminiTarget } from './gemini'
import { localReply } from './localAnswer'
import { findProduct } from './search'
import type { ChatMessage, ProductReport } from '../types'

const CATALOG = seedCategories.map((category) => `${category.title}: ${category.sections.map((section) => section.title).join(', ')}`).join('\n')

const TEXT_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash']
const LOOKUP_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash']

const SYSTEM = `Ты консультант по косметике в приложении «Care». Отвечай по-русски, конкретно и простым языком. Без markdown, без звёздочек и без решёток.

Если пользователь сам прислал состав, разбирай только его. Не подменяй список другим продуктом и не добавляй компоненты, которых в нём нет. Проценты пиши только если они есть в тексте. Если название похоже на опечатку, скажи, что это может быть, и не утверждай наугад.

Если состава в сообщении нет, найди его поиском в интернете: сайт бренда, карточка товара или магазин. Ищи по бренду и точному названию. В разбор бери только список, который нашёлся в результатах. Не выдумывай ингредиенты и официальную инструкцию. Не пиши, что состав не нашёлся, пока не поищешь. Если после поиска списка нет, так и напиши.

Определи средство по названию и по известному назначению, даже если в названии нет слов вроде «крем» или «шампунь». Каталог разделов:
${CATALOG}

Если средство относится к другому разделу этого каталога, разбор всё равно напиши целиком. После разбора добавь отдельную строку:
НАЗНАЧЕНИЕ: Раздел | Зона
Раздел и зона дословно из каталога. Пример: НАЗНАЧЕНИЕ: Гель для душа | Тело
Если средство из текущего раздела или назначение неочевидно, строку НАЗНАЧЕНИЕ не пиши. На уточняющий вопрос о уже разобранном составе её тоже не пиши.

Полный разбор нового состава строй строго такими строками, каждый пункт с новой строки:

ПЛЮСЫ
Название компонента — что он здесь делает, одно или два предложения. Близкие компоненты можно объединить.

МИНУСЫ
Название — почему это настораживает именно в этом средстве. Если явных минусов нет, одна строка: Явных жёстких компонентов не видно — коротко почему.

ВЕРДИКТ
Кому средство подходит, как им пользоваться и для какой кожи оно слишком жёсткое. Два-четыре предложения, с привязкой к критерию подбора.

СОВЕТ
Один практический совет: как часто, что сделать после, на что проверить реакцию.

На короткий уточняющий вопрос отвечай обычными абзацами по уже известному составу, без повторных четырёх блоков. Не ставь диагноз и не назначай лечение.`

export type ChatRequest = {
  query: string
  criterion: string
  section: string
  zone: string
  history: ChatMessage[]
  products: ProductReport[]
  formula?: string
  photo?: { mimeType: string; base64: string }
}

export async function reply(input: ChatRequest) {
  const key = readKey()
  if (!key) return localReply(input)

  const pasted = input.formula?.trim() ?? ''
  const followUp = !pasted && isFollowUp(input.query, input.products.length > 0)
  const found = pasted || followUp || input.photo ? null : await lookup(input.query)
  const manualName = input.query.trim() && input.query.trim() !== 'Разбери этот состав' ? input.query.trim() : 'Свой состав'
  const products = input.photo
    ? input.products
    : pasted
      ? [...input.products, { name: manualName, brand: '', ingredients: pasted }]
      : found
        ? [...input.products, { name: found.name, brand: found.brand, ingredients: found.ingredients }]
        : followUp
          ? input.products
          : [...input.products, { name: manualName, brand: '', ingredients: '' }]
  const needsWeb = Boolean(input.photo) || (!pasted && !followUp && !found?.ingredients)

  let text = ''
  try {
    text = await answer(key, input, products, needsWeb)
  } catch (error) {
    if (error instanceof Error && error.message === 'limit:429') {
      if (input.photo) return { paragraphs: ['Сейчас не получается разобрать фото. Подождите минуту и отправьте его ещё раз.'], product: null }
      return localReply(input)
    }
    throw error
  }

  const labeled = input.photo ? takeLabel(text) : { body: text, name: '' }
  const paragraphs = toParagraphs(labeled.body)
  const seenName = labeled.name || (input.photo ? '' : found?.name || input.query)
  return {
    paragraphs: paragraphs.length > 0 ? paragraphs : ['Ответ пустой. Спросите ещё раз.'],
    product: followUp || !seenName
      ? null
      : {
          code: found?.code ?? '',
          name: pasted ? manualName : seenName,
          brand: found?.brand ?? '',
          ingredients: pasted || found?.ingredients || '',
        },
  }
}

async function lookup(query: string) {
  const result = await findProduct(query)
  if (result.status !== 'found') return null
  return result.product
}

async function answer(
  key: string,
  input: ChatRequest,
  products: { name: string; brand: string; ingredients?: string }[],
  search: boolean,
) {
  const models = search ? LOOKUP_MODELS : TEXT_MODELS
  let limited = false
  let searchBlocked = false
  for (const model of models) {
    try {
      return await ask(key, model, input, products, search)
    } catch (error) {
      if (error instanceof Error && (error.message === 'model:missing' || error.message.startsWith('search:'))) {
        if (error.message.startsWith('search:')) searchBlocked = true
        continue
      }
      if (error instanceof Error && error.message === 'limit:429') {
        limited = true
        continue
      }
      throw error
    }
  }
  if (search && searchBlocked) return ask(key, models[0], input, products, false)
  if (limited) throw new Error('limit:429')
  throw new Error('Модель не ответила. Попробуйте ещё раз.')
}

async function ask(
  key: string,
  model: string,
  input: ChatRequest,
  products: { name: string; brand: string; ingredients?: string }[],
  search: boolean,
) {
  const dossier = [
    'Контекст подбора',
    `Зона: ${input.zone}`,
    `Тип средства: ${input.section}`,
    `Критерий: ${input.criterion}`,
    '',
    products.length === 0 ? 'Состав ещё не передавался — найди его в интернете.' : 'Уже известные продукты:',
    ...products.flatMap((product, index) => {
      const title = product.brand ? `${product.brand} · ${product.name}` : product.name
      const formula = product.ingredients?.trim()
      return [
        `${index + 1}. ${title}`,
        formula
          ? `Состав: ${formula}`
          : search
            ? 'Состава в базе нет. Найди в интернете опубликованный INCI именно этого средства и разбери найденный список.'
            : 'Состав ещё не зафиксирован.',
        '',
      ]
    }),
    'Сообщение пользователя:',
    input.query,
    ...(input.photo
      ? [
          'К сообщению приложено фото упаковки. Прочитай бренд и название с этикетки.',
          'Первая строка ответа строго такая: СРЕДСТВО: бренд и название',
          'Если название не разобрать, первая строка: СРЕДСТВО: не видно',
          'Сразу после неё обязательно напиши полный разбор: ПЛЮСЫ, МИНУСЫ, ВЕРДИКТ, СОВЕТ. На одной строке с названием не останавливайся.',
          'Состав найди в интернете по прочитанному названию.',
        ]
      : []),
    ...(input.formula?.trim() ? [`Состав ввёл пользователь, разбирай только его:\n${input.formula.trim()}`] : []),
  ].join('\n')

  const prior = input.history
    .slice(0, -1)
    .slice(-8)
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      text: message.paragraphs.join('\n'),
    }))
    .filter((turn) => turn.text.trim().length > 0)
  while (prior[0]?.role === 'model') prior.shift()

  const photoPart = input.photo
    ? [{ inlineData: { mimeType: input.photo.mimeType || 'image/jpeg', data: input.photo.base64 } }]
    : []
  const contents = [
    ...prior.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
    { role: 'user', parts: [...photoPart, { text: dossier }] },
  ]

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 50000)
  const target = geminiTarget(model, key)
  let response: Response
  try {
    response = await fetch(target.url, {
      method: 'POST',
      signal: controller.signal,
      headers: target.headers,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        tools: search ? [{ google_search: {} }] : undefined,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1400,
        },
      }),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Ответ слишком долго шёл. Спросите ещё раз.')
    const offline = target.url.startsWith('http://')
      ? 'Нет связи с компьютером. Телефон и компьютер должны быть в одной сети Wi-Fi.'
      : 'Нет связи с моделью. Проверьте интернет и повторите.'
    throw new Error(offline)
  } finally {
    clearTimeout(timer)
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = errorText(payload)
    if (response.status === 404 && !/search|ground|tool/i.test(detail)) throw new Error('model:missing')
    if (search && /search|ground|tool|billing/i.test(detail) && [400, 403, 404, 429].includes(response.status)) {
      throw new Error('search:unavailable')
    }
    if (response.status === 429 || response.status === 503) throw new Error('limit:429')
    throw new Error(publicError(response.status, detail))
  }
  const text = readText(payload)
  if (!text) throw new Error('Модель не прислала текст. Спросите иначе.')
  return text
}

function takeLabel(text: string) {
  const match = text.match(/^\s*СРЕДСТВО\s*[:\-–]\s*(.+)\s*$/im)
  if (!match?.[1]) return { body: text, name: '' }
  const name = match[1].trim().replace(/[.]+$/g, '')
  const body = text.replace(match[0], '').trim()
  if (/^(не видно|неразборчиво|нет|unknown|n\/a|—|-)$/i.test(name)) return { body, name: '' }
  return { body, name }
}

function readKey() {
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() ?? ''
}

function readText(payload: unknown) {
  if (!payload || typeof payload !== 'object') return ''
  const candidates = (payload as { candidates?: unknown }).candidates
  if (!Array.isArray(candidates)) return ''
  const content = (candidates[0] as { content?: { parts?: unknown } } | undefined)?.content
  if (!Array.isArray(content?.parts)) return ''
  return content.parts
    .map((part) => {
      if (!part || typeof part !== 'object') return ''
      const item = part as { text?: unknown; thought?: unknown }
      if (item.thought || typeof item.text !== 'string') return ''
      return item.text
    })
    .join('\n')
    .trim()
}

function errorText(payload: unknown) {
  if (!payload || typeof payload !== 'object') return ''
  const message = (payload as { error?: { message?: unknown } }).error?.message
  return typeof message === 'string' ? message : ''
}

function publicError(status: number, detail: string) {
  if (/location is not supported|User location/i.test(detail)) {
    return 'Модель недоступна из сети телефона. Спросите ещё раз.'
  }
  if (status === 401 || status === 403 || /api key|API_KEY/i.test(detail)) return 'Сейчас не получается связаться с моделью.'
  if (status === 429) return 'Слишком много запросов. Подождите минуту и спросите ещё раз.'
  return 'Модель не ответила. Попробуйте ещё раз.'
}

function toParagraphs(text: string) {
  return text
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .split(/\n+/)
    .map((line) => normalizeLine(line))
    .filter(Boolean)
}

function normalizeLine(line: string) {
  const bare = line.replace(/^\s*[-•]\s*/, '').trim()
  const section = bare
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[:.]+$/g, '')
  if (section.length < 42 && /плюсы|что здесь хорошо/.test(section)) return 'ПЛЮСЫ'
  if (section.length < 48 && /минусы|что здесь настораживает/.test(section)) return 'МИНУСЫ'
  if (section.length < 36 && /вердикт/.test(section)) return 'ВЕРДИКТ'
  if (section.length < 20 && /^совет/.test(section)) return 'СОВЕТ'
  return bare
}

function isFollowUp(query: string, hasProducts: boolean) {
  if (!hasProducts) return false
  const text = query.toLowerCase().replace(/ё/g, 'е').trim()
  if (text.includes('?')) return true
  return /^(как|что|чем|почему|зачем|можно|стоит|когда|куда|нужно|надо|расскаж|объясн|сравни|подскаж|это |он |она |они |его |ее |её )/.test(text)
}
