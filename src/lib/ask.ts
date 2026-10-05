import { seedCategories } from '../data/seed'
import { geminiTarget } from './gemini'
import { localReply } from './localAnswer'
import { productQuery } from './readLabel'
import { findProduct } from './search'
import type { ChatMessage, ProductReport } from '../types'

const CATALOG = seedCategories.map((category) => `${category.title}: ${category.sections.map((section) => section.title).join(', ')}`).join('\n')

const TEXT_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash']
const LOOKUP_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash']

const SYSTEM = `Ты консультант по косметике в приложении «Care». Отвечай по-русски, конкретно и простым языком. Без markdown, без звёздочек и без решёток.

Если пользователь сам прислал состав, разбирай только его. Не подменяй список другим продуктом, похожим средством того же типа или типовой формулой. Не добавляй компоненты, которых в нём нет. Проценты пиши только если они есть в тексте. Если название похоже на опечатку, скажи, что это может быть, и не утверждай наугад.

Если приложено фото упаковки, сначала прочитай этикетку. Бренд и название всегда бери с неё. Состав и способ применения, если они напечатаны и читаются на снимке, тоже бери только оттуда и не подменяй их сайтом. Если на фото только лицевая сторона и состава или способа применения на ней нет, найди официальный сайт этого бренда и возьми недостающее оттуда: страницу именно этого средства, с тем же названием и объёмом, если объём виден. Не бери состав с маркетплейсов, магазинов и из памяти. Не добавляй компоненты, которых нет ни на фото, ни на официальной странице. Если официальная страница не нашлась, так и напиши и не выдумывай список. Вердикт и совет должны совпадать с найденным способом применения: куда наносить, смывать или нет, как часто, сколько держать.

Если фото нет и состава в сообщении нет, найди его поиском в интернете: сайт бренда, карточка товара или магазин. Ищи по бренду и точному названию. В разбор бери только список, который нашёлся в результатах. Не выдумывай ингредиенты и официальную инструкцию. Не пиши, что состав не нашёлся, пока не поищешь. Если после поиска списка нет, так и напиши.

Определи средство по названию и по известному назначению, даже если в названии нет слов вроде «крем» или «шампунь». Каталог разделов:
${CATALOG}

Если средство относится к другому разделу этого каталога, разбор всё равно напиши целиком. После разбора добавь отдельную строку:
НАЗНАЧЕНИЕ: Раздел | Зона
Раздел и зона дословно из каталога. Пример: НАЗНАЧЕНИЕ: Гель для душа | Тело
Если средство из текущего раздела или назначение неочевидно, строку НАЗНАЧЕНИЕ не пиши. На уточняющий вопрос о уже разобранном составе её тоже не пиши.

Полный разбор нового состава строй строго такими блоками. Каждый заголовок и каждый пункт — с новой строки. Без markdown.

СОСТАВ
Весь состав одной строкой: компоненты через точку с запятой, в исходном порядке. Ничего не выкидывай и не добавляй. Если список на английском, оставь INCI как есть. Если он уже по-русски, цитируй русские названия. Если после поиска списка нет, строку СОСТАВ не пиши и не выдумывай компоненты.

Сразу после списка — один абзац без заголовка: какая философия у этого состава. Назови подход своими словами (барьерный уход, активная терапия, питание, успокоение, укрепление сосудов и так далее) и коротко скажи, на что сделан упор. Если раньше в диалоге уже разбирали другие составы, одним предложением сравни подход с ними. Привяжи к критерию подбора.

РАЗБОР
Дальше группы. Каждая группа начинается отдельной строкой «ГРУППА: » и коротким названием роли по тому, что реально есть в списке: увлажнители и эмоленты, активные добавки, антивозрастной компонент или другая точная роль. В начале названия можно поставить один подходящий эмодзи. Пустые группы не пиши.
Под заголовком перечисли компоненты этой группы. Каждый компонент — отдельная строка: дословное название из блока СОСТАВ, длинное тире, одно или два предложения о том, что он здесь делает. В скобках можно добавить общеизвестное действующее вещество, если оно точно относится к этому компоненту. Близкие компоненты одной роли объединяй через «+». Каждый компонент цитируй только в одной группе.

ПЛЮСЫ
Что в этом составе удачно под критерий. Два-четыре предложения. Не повторяй дословно весь разбор по группам.

МИНУСЫ
Что настораживает именно в этом средстве и для какой кожи. Если явных минусов нет, одна строка: Явных жёстких компонентов не видно — коротко почему.

ВЕРДИКТ
Кому средство подходит, как им пользоваться и для какой кожи оно слишком жёсткое. Два-четыре предложения, с привязкой к критерию подбора.

СОВЕТ
Один практический совет: как часто, что сделать после, на что проверить реакцию.

Если в сообщении несколько новых составов, повтори эту структуру для каждого. На короткий уточняющий вопрос отвечай обычными абзацами по уже известному составу, без повторных блоков СОСТАВ, РАЗБОР, ПЛЮСЫ, МИНУСЫ, ВЕРДИКТ и СОВЕТ. Не ставь диагноз и не назначай лечение.`

export type ChatRequest = {
  query: string
  criterion: string
  section: string
  zone: string
  history: ChatMessage[]
  products: ProductReport[]
  formula?: string
  usage?: string
  photo?: { mimeType: string; base64: string }
}

const SHOPS = /ozon\.|wildberries\.|wb\.ru|goldapple\.|letu\.|iledebeaute|lamoda\.|amazon\.|ebay\.|sephora\.|notino\.|iherb\.|randewoo\.|podrygka\.|market\.yandex|megamarket\.|flowwow\.|rivegauche|makeup\.com|yesstyle\.|stylevana\.|jolse\.|oliveyoung\./i

type PackageFace = {
  brand: string
  name: string
  volume: string
  formula: string
  usage: string
}

export async function reply(input: ChatRequest) {
  const key = readKey()
  if (!key) return localReply(input)
  if (input.photo) {
    try {
      return await replyFromPhoto(key, input)
    } catch (error) {
      if (error instanceof Error && error.message === 'limit:429') {
        return { paragraphs: ['Сейчас не получается разобрать фото. Подождите минуту и отправьте его ещё раз.'], product: null }
      }
      throw error
    }
  }

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
  const seenFormula = pasted || (input.photo ? formulaFrom(paragraphs) : '') || found?.ingredients || ''
  return {
    paragraphs: paragraphs.length > 0 ? paragraphs : ['Ответ пустой. Спросите ещё раз.'],
    product: followUp || !seenName
      ? null
      : {
          code: found?.code ?? '',
          name: pasted ? manualName : seenName,
          brand: found?.brand ?? '',
          ingredients: seenFormula,
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
    products.length === 0
      ? input.photo
        ? 'Нового состава в тексте нет. Если он читается на фото, бери его оттуда. Если на снимке только лицевая сторона, найди официальный сайт бренда.'
        : 'Состав ещё не передавался — найди его в интернете.'
      : 'Уже известные продукты:',
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
          'К сообщению приложено фото упаковки. Сначала прочитай бренд и название с этикетки.',
          'Если на снимке напечатаны состав и способ применения, разбирай только их и не ищи замену.',
          'Если на фото только лицевая сторона и состава или способа применения не видно, найди официальный сайт бренда и открой страницу этого средства. Состав и применение бери только оттуда. Маркетплейсы и магазины не используй.',
          'Первая строка ответа строго такая: СРЕДСТВО: бренд и название',
          'Если название не разобрать, первая строка: СРЕДСТВО: не видно',
          'Сразу после неё полный разбор. Строка после СОСТАВ — весь список одной строкой, с этикетки или с официальной страницы. Если его нет ни там, ни там, так и напиши, без выдуманных компонентов.',
          'В СОВЕТЕ передай способ применения с этикетки или с официальной страницы: куда, смывать или оставлять, как часто, сколько держать. Не меняй его.',
          'На одной строке с названием не останавливайся.',
        ]
      : []),
    ...(input.formula?.trim()
      ? [
          'Состав уже установлен. В блоке СОСТАВ повтори его дословно и не добавляй компоненты другого похожего средства:',
          input.formula.trim(),
          ...(input.usage?.trim()
            ? ['Способ применения с той же страницы. В совете передай его и не заменяй своим режимом:', input.usage.trim()]
            : []),
        ]
      : []),
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

  const { text } = await generate(
    key,
    model,
    {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents,
      tools: search ? [{ google_search: {} }] : undefined,
      generationConfig: {
        temperature: input.photo ? 0.2 : 0.4,
        maxOutputTokens: 4096,
      },
    },
    search ? 'search' : 'none',
  )
  return text
}

async function replyFromPhoto(key: string, input: ChatRequest) {
  const face = await readPackage(key, input.photo!)
  if (!face?.name) {
    return { paragraphs: ['На фото не видно названия. Снимите лицевую сторону ближе или напишите название текстом.'], product: null }
  }

  let formula = face.formula
  let usage = face.usage
  let source = ''

  if (!formula && !/^состав с упаковки$/i.test(face.name)) {
    const page = await officialPage(key, face)
    formula = page?.formula ?? ''
    if (!usage) usage = page?.usage ?? ''
    source = page?.source ?? ''
  }

  if (!formula) {
    const title = productQuery(face)
    return {
      paragraphs: [
        `${title}: на снимке лицевая сторона, полного состава там нет.`,
        'На официальном сайте бренда список именно этого средства не нашёлся. Снимите сторону, где напечатан состав, или вставьте его текстом.',
      ],
      product: { code: '', name: title, brand: face.brand, ingredients: '' },
    }
  }

  const title = productQuery(face)
  const text = await answer(
    key,
    { ...input, photo: undefined, formula, usage, query: input.query || 'Разбери этот состав' },
    [...input.products, { name: face.name, brand: face.brand, ingredients: formula }],
    false,
  )
  const paragraphs = lockFormula(toParagraphs(text), formula)
  if (source.startsWith('http') && !SHOPS.test(source)) paragraphs.splice(Math.max(paragraphs.indexOf('СОСТАВ'), 0), 0, `Источник: ${source}`)
  return {
    paragraphs,
    product: { code: '', name: title, brand: face.brand, ingredients: formula },
  }
}

async function readPackage(key: string, photo: { mimeType: string; base64: string }) {
  const prompt = [
    'Посмотри на фото упаковки. Верни только эти строки:',
    'БРЕНД: как напечатано, или нет',
    'НАЗВАНИЕ: полное название средства без бренда. Если на снимке только состав и названия нет, напиши: состав с упаковки',
    'ОБЪЁМ: как напечатано, или нет',
    'СОСТАВ: полный список компонентов одной строкой через запятую. Если на фото есть блок «Состав» или «Ingredients (INCI)», перепиши его целиком. Слова, разорванные переносом строки, склей: Gly- и col на следующей строке — это Glycol. Если списка на фото нет, напиши: нет',
    'ПРИМЕНЕНИЕ: если напечатан способ применения, перепиши его. Если нет, напиши: нет',
    'Не выдумывай состав по типу средства и не вспоминай похожую формулу. Не пиши нет, если список компонентов виден на снимке.',
  ].join('\n')
  for (const model of TEXT_MODELS) {
    try {
      const { text } = await generate(
        key,
        model,
        {
          contents: [
            {
              role: 'user',
              parts: [{ inlineData: { mimeType: photo.mimeType || 'image/jpeg', data: photo.base64 } }, { text: prompt }],
            },
          ],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1500 },
        },
        'none',
      )
      const formula = ingredientField(fieldBlock(text, 'СОСТАВ'))
      const writtenName = cleanField(fieldBlock(text, 'НАЗВАНИЕ'))
      const name = /^состав с упаковки$/i.test(writtenName) ? '' : writtenName
      const title = name || (formula ? 'Состав с упаковки' : '')
      if (!title) continue
      return {
        brand: cleanField(fieldBlock(text, 'БРЕНД')),
        name: title,
        volume: cleanField(fieldBlock(text, 'ОБЪЁМ')),
        formula,
        usage: cleanField(fieldBlock(text, 'ПРИМЕНЕНИЕ')),
      } satisfies PackageFace
    } catch (error) {
      if (error instanceof Error && error.message === 'model:missing') continue
      throw error
    }
  }
  return null
}

async function officialPage(key: string, face: PackageFace) {
  const title = productQuery(face)
  const volume = face.volume ? `, объём ${face.volume}` : ''
  const seek = [
    `Найди официальный сайт бренда и страницу средства «${title}»${volume}.`,
    'Нужна страница самого бренда, не маркетплейс и не магазин.',
    'Название на странице должно совпадать с упаковкой. Похожее средство той же категории не подходит.',
    'Если в результатах поиска есть полный состав именно этой страницы, скопируй его дословно в строку СОСТАВ. Если полного списка в результатах нет, напиши СОСТАВ: нет и не собирай формулу по памяти.',
    'Верни только строки:',
    'ССЫЛКА: прямой адрес страницы, или нет',
    'СОСТАВ: список одной строкой, или нет',
    'ПРИМЕНЕНИЕ: способ применения со страницы, или нет',
  ].join('\n')

  let link = ''
  for (const model of LOOKUP_MODELS) {
    try {
      const found = await generate(
        key,
        model,
        {
          contents: [{ role: 'user', parts: [{ text: seek }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1200 },
        },
        'search',
      )
      link = acceptLink(fieldBlock(found.text, 'ССЫЛКА'), found.pages, face)
      const copied = found.pages.length > 0 ? ingredientField(fieldBlock(found.text, 'СОСТАВ')) : ''
      if (copied) return { formula: copied, usage: cleanField(fieldBlock(found.text, 'ПРИМЕНЕНИЕ')), source: link }
      if (link) break
    } catch (error) {
      if (error instanceof Error && (error.message === 'model:missing' || error.message === 'search:unavailable')) continue
      throw error
    }
  }
  if (!link) return null

  const copy = [
    `Открой только эту страницу: ${link}`,
    `На ней должно быть средство «${title}»${volume}. Если страница про другое средство, напиши СОСТАВ: нет.`,
    'Скопируй полный список компонентов дословно, как он напечатан на странице. Не дополняй его по памяти и не собирай типовую формулу этого типа средства.',
    'Если на странице нет полного состава, напиши СОСТАВ: нет.',
    'Верни только строки:',
    'СОСТАВ: список одной строкой',
    'ПРИМЕНЕНИЕ: способ применения со страницы, или нет',
  ].join('\n')

  try {
    const { text } = await generate(
      key,
      LOOKUP_MODELS[0],
      {
        contents: [{ role: 'user', parts: [{ text: copy }] }],
        tools: [{ url_context: {} }],
        generationConfig: { temperature: 0, maxOutputTokens: 1500 },
      },
      'url',
    )
    const formula = ingredientField(fieldBlock(text, 'СОСТАВ'))
    if (!formula) return null
    return { formula, usage: cleanField(fieldBlock(text, 'ПРИМЕНЕНИЕ')), source: link }
  } catch (error) {
    if (error instanceof Error && (error.message === 'model:missing' || error.message === 'url:unavailable')) return null
    throw error
  }
}

function acceptLink(raw: string, pages: { uri: string; title: string }[], face: PackageFace) {
  const written = raw.match(/https?:\/\/[^\s<>"']+/i)?.[0]?.replace(/[),.;]+$/g, '') ?? ''
  if (written && !isShop(written) && !/vertexaisearch|google\.com\/search/i.test(written)) return written
  const ranked = pages
    .filter((page) => page.uri && !isShop(`${page.uri} ${page.title}`) && mentionsProduct(page.title, face))
    .map((page) => page.uri)
  return ranked.find((uri) => !/vertexaisearch|google\.com\/search/i.test(uri)) ?? ''
}

function mentionsProduct(title: string, face: PackageFace) {
  const hay = title.toLowerCase().replace(/ё/g, 'е')
  const words = `${face.brand} ${face.name}`
    .toLowerCase()
    .replace(/ё/g, 'е')
    .split(/[^a-zа-я0-9]+/i)
    .filter((word) => word.length > 3)
  if (words.length === 0) return false
  const hits = words.filter((word) => hay.includes(word))
  return hits.length >= Math.min(2, words.length)
}

function isShop(value: string) {
  return SHOPS.test(value.toLowerCase())
}

const FIELD_LABELS = ['БРЕНД', 'НАЗВАНИЕ', 'ОБЪЁМ', 'ОБЪЕМ', 'СОСТАВ', 'ПРИМЕНЕНИЕ', 'ССЫЛКА']

function fieldBlock(text: string, label: string) {
  const others = FIELD_LABELS.filter((item) => item.toLowerCase() !== label.toLowerCase()).join('|')
  const match = text.match(new RegExp(`(?:^|\\n)\\s*${label}\\s*[:\\-–]\\s*([\\s\\S]*?)(?=\\n\\s*(?:${others})\\s*[:\\-–]|$)`, 'i'))
  return match?.[1]?.trim() ?? ''
}

function cleanField(value: string) {
  const text = value.replace(/\s+/g, ' ').trim().replace(/[.]+$/g, '')
  if (!text || /^(нет|не видно|неразборчиво|не найдено|не напечатано|отсутствует|unknown|n\/a|—|-)$/i.test(text)) return ''
  return text
}

function ingredientField(value: string) {
  const text = cleanField(value).replace(/([A-Za-zА-Яа-я])-\s+([a-zа-я])/g, '$1$2')
  if (!text || text.length < 12 || /типов(ая|ой) формул|по памяти|не найден/i.test(text)) return ''
  const parts = text.split(/[,;]/).map((part) => part.trim()).filter((part) => part.length > 1)
  if (parts.length < 3) return ''
  return parts.join(', ')
}

function lockFormula(paragraphs: string[], formula: string) {
  const next = [...paragraphs]
  const index = next.indexOf('СОСТАВ')
  if (index < 0) return ['СОСТАВ', formula, ...next]
  const after = next[index + 1]
  if (after && after !== 'РАЗБОР' && after !== 'ПЛЮСЫ' && after !== 'МИНУСЫ' && after !== 'ВЕРДИКТ' && after !== 'СОВЕТ' && !after.startsWith('ГРУППА:')) {
    next[index + 1] = formula
    return next
  }
  next.splice(index + 1, 0, formula)
  return next
}

async function generate(
  key: string,
  model: string,
  body: Record<string, unknown>,
  tool: 'search' | 'url' | 'none',
) {
  try {
    return await requestModel(key, model, body, tool)
  } catch (error) {
    if (!(error instanceof Error) || error.message !== 'limit:429') throw error
    await new Promise((resolve) => setTimeout(resolve, 12000))
    return requestModel(key, model, body, tool)
  }
}

async function requestModel(
  key: string,
  model: string,
  body: Record<string, unknown>,
  tool: 'search' | 'url' | 'none',
) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 50000)
  const target = geminiTarget(model, key)
  let response: Response
  try {
    response = await fetch(target.url, {
      method: 'POST',
      signal: controller.signal,
      headers: target.headers,
      body: JSON.stringify(body),
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
    if (response.status === 404 && !/search|ground|tool|url/i.test(detail)) throw new Error('model:missing')
    if (tool !== 'none' && /search|ground|tool|url|billing/i.test(detail) && [400, 403, 404, 429].includes(response.status)) {
      throw new Error(tool === 'url' ? 'url:unavailable' : 'search:unavailable')
    }
    if (response.status === 429 || response.status === 503) throw new Error('limit:429')
    throw new Error(publicError(response.status, detail))
  }
  const text = readText(payload)
  if (!text) throw new Error('Модель не прислала текст. Спросите иначе.')
  return { text, pages: readPages(payload) }
}

function readPages(payload: unknown) {
  if (!payload || typeof payload !== 'object') return []
  const candidates = (payload as { candidates?: unknown }).candidates
  if (!Array.isArray(candidates)) return []
  const first = candidates[0] as
    | { groundingMetadata?: { groundingChunks?: unknown }; grounding_metadata?: { grounding_chunks?: unknown } }
    | undefined
  const chunks = first?.groundingMetadata?.groundingChunks ?? first?.grounding_metadata?.grounding_chunks
  if (!Array.isArray(chunks)) return []
  return chunks.flatMap((chunk) => {
    if (!chunk || typeof chunk !== 'object') return []
    const web = (chunk as { web?: { uri?: unknown; title?: unknown } }).web
    const uri = typeof web?.uri === 'string' ? web.uri : ''
    const title = typeof web?.title === 'string' ? web.title : ''
    return uri || title ? [{ uri, title }] : []
  })
}

function formulaFrom(paragraphs: string[]) {
  const index = paragraphs.indexOf('СОСТАВ')
  if (index < 0) return ''
  const line = paragraphs[index + 1]?.trim() ?? ''
  if (line.length < 12) return ''
  if (line === 'РАЗБОР' || line === 'ПЛЮСЫ' || line === 'МИНУСЫ' || line === 'ВЕРДИКТ' || line === 'СОВЕТ' || line.startsWith('ГРУППА:')) return ''
  if (/не\s*видно|не\s*чита|не\s*разборч|не\s*удал|не\s*прочит|на\s+(фото|снимке)\s+нет/i.test(line)) return ''
  return line
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
  const lines = text
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .split(/\n+/)
  const paragraphs: string[] = []
  lines.forEach((line) => {
    const inline = line.trim().match(/^(?:состав|inci)\s*[:\-–]\s+(.{12,})$/i)
    if (inline && !/группа|плюс|минус|вердикт|совет/.test(inline[1].toLowerCase())) {
      paragraphs.push('СОСТАВ', inline[1].trim())
      return
    }
    const normalized = normalizeLine(line)
    if (normalized) paragraphs.push(normalized)
  })
  return paragraphs
}

function normalizeLine(line: string) {
  const bare = line.replace(/^\s*[-•]\s*/, '').replace(/^\s*\d+[.)]\s*/, '').trim()
  const group = bare.match(/^группа\s*[:\-–]\s*(.+)$/i)
  if (group?.[1]) return `ГРУППА: ${group[1].trim()}`
  const section = bare
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[:.]+$/g, '')
  if (section.length < 16 && section === 'состав') return 'СОСТАВ'
  if (section.length < 36 && (section === 'разбор' || section === 'разберем по группам')) return 'РАЗБОР'
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
