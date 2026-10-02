export type FoundProduct = {
  code: string
  name: string
  brand: string
  ingredients: string
}

export type SearchResult =
  | { status: 'found'; product: FoundProduct }
  | { status: 'no_ingredients'; name: string; brand: string }
  | { status: 'not_found' }
  | { status: 'error'; message: string }

type OffProduct = {
  code?: string
  product_name?: string
  brands?: string
  ingredients_text?: string
  ingredients_text_ru?: string
}

const BRANDS: [string, string][] = [
  ['ля рош-позе', 'la roche-posay'],
  ['ля рош позе', 'la roche-posay'],
  ['ла рош-позе', 'la roche-posay'],
  ['ла рош позе', 'la roche-posay'],
  ['ля рош', 'la roche-posay'],
  ['ла рош', 'la roche-posay'],
  ['зе ординари', 'the ordinary'],
  ['ди ординари', 'the ordinary'],
  ['паула чойс', 'paulas choice'],
  ['инки лист', 'the inkey list'],
  ['натура сиберика', 'natura siberica'],
  ['чистая линия', 'chistaya liniya'],
  ['черный жемчуг', 'black pearl'],
  ['ивс роше', 'yves rocher'],
  ['ив роше', 'yves rocher'],
  ['эсте лаудер', 'estee lauder'],
  ['цераве', 'cerave'],
  ['сераве', 'cerave'],
  ['биодерма', 'bioderma'],
  ['нейтрогена', 'neutrogena'],
  ['либридерм', 'librederm'],
  ['иннисфри', 'innisfree'],
  ['инисфри', 'innisfree'],
  ['сесдерма', 'sesderma'],
  ['гарньер', 'garnier'],
  ['лореаль', 'loreal'],
  ['эуцерин', 'eucerin'],
  ['юцерин', 'eucerin'],
  ['цетафил', 'cetaphil'],
  ['кларинс', 'clarins'],
  ['кляранс', 'clarins'],
  ['каудали', 'caudalie'],
  ['филорга', 'filorga'],
  ['холика', 'holika holika'],
  ['косрикс', 'cosrx'],
  ['ланеж', 'laneige'],
  ['дарфин', 'darphin'],
  ['шанель', 'chanel'],
  ['клиник', 'clinique'],
  ['урьяж', 'uriage'],
  ['дукре', 'ducray'],
  ['киелс', 'kiehls'],
  ['нивея', 'nivea'],
  ['виши', 'vichy'],
  ['авен', 'avene'],
  ['килс', 'kiehls'],
  ['диор', 'dior'],
  ['миша', 'missha'],
]

const WORDS: [string, string][] = [
  ['солнцезащит', 'sunscreen'],
  ['кондиционер', 'conditioner'],
  ['сыворот', 'serum'],
  ['шампун', 'shampoo'],
  ['бальзам', 'conditioner'],
  ['умывал', 'cleanser'],
  ['эмульс', 'emulsion'],
  ['лосьон', 'lotion'],
  ['увлаж', 'moisturizing'],
  ['флюид', 'fluid'],
  ['пилинг', 'peeling'],
  ['скраб', 'scrub'],
  ['тонер', 'toner'],
  ['тоник', 'toner'],
  ['маск', 'mask'],
  ['масл', 'oil'],
  ['ночн', 'night'],
  ['дневн', 'day'],
  ['пенк', 'cleanser'],
  ['гель', 'gel'],
  ['крем', 'cream'],
  ['мист', 'mist'],
]

const LETTERS: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

function transliterate(value: string) {
  return value
    .toLowerCase()
    .split('')
    .map((letter) => LETTERS[letter] ?? letter)
    .join('')
}

export function displayName(value: string) {
  const clean = value.replace(/[®™]/g, '').replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  if (clean !== clean.toLowerCase()) return clean
  return clean.replace(/(^|[\s\-])(\p{L})/gu, (_, separator: string, char: string) => separator + char.toUpperCase())
}

export function buildQueries(raw: string) {
  const original = raw.trim().replace(/\s+/g, ' ')
  const normalized = original.toLowerCase().replace(/ё/g, 'е')
  let branded = normalized
  for (const [from, to] of BRANDS) {
    if (branded.includes(from)) branded = branded.split(from).join(to)
  }
  const extras = WORDS.filter(([from]) => normalized.includes(from)).map(([, to]) => to)
  const enriched = `${branded} ${extras.join(' ')}`.replace(/\s+/g, ' ').trim()
  const latin = enriched
    .split(/\s+/)
    .filter((word) => word && !/[а-яё]/i.test(word))
    .join(' ')
  const queries = new Set<string>([original, enriched, latin])
  if (/[а-яё]/i.test(branded) && latin.split(/\s+/).filter(Boolean).length < 2) {
    queries.add(transliterate(branded))
  }
  return [...queries].filter((query) => query.length > 1)
}

function tokensOf(queries: string[]) {
  const tokens = new Set<string>()
  for (const query of queries) {
    for (const token of query.toLowerCase().split(/[^a-z0-9а-яё]+/i)) {
      if (token.length > 2) tokens.add(token)
    }
  }
  return [...tokens]
}

function ingredientText(product: OffProduct) {
  const english = product.ingredients_text?.trim() ?? ''
  const russian = product.ingredients_text_ru?.trim() ?? ''
  if (english.length >= 12) return english
  if (russian.length >= 12) return russian
  return ''
}

function nameScore(product: OffProduct, tokens: string[]) {
  const hay = `${product.brands ?? ''} ${product.product_name ?? ''}`.toLowerCase()
  return tokens.reduce((score, token) => {
    if (!hay.includes(token)) return score
    return score + (token.length >= 5 ? 3 : 2)
  }, 0)
}

async function searchOnce(query: string): Promise<OffProduct[] | null> {
  const url = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,ingredients_text,ingredients_text_ru,code`
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (typeof document === 'undefined') headers['User-Agent'] = 'UhodApp/1.0 (personal care picker)'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch(url, { headers, signal: controller.signal })
    if (!response.ok) return null
    const data = (await response.json()) as { products?: OffProduct[] }
    return Array.isArray(data.products) ? data.products : []
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function pickBest(products: Map<string, OffProduct>, tokens: string[]) {
  let named: { product: OffProduct; score: number } | null = null
  let complete: { product: OffProduct; score: number; ingredients: string } | null = null
  for (const product of products.values()) {
    const score = nameScore(product, tokens)
    if (score <= 0) continue
    if (!named || score > named.score) named = { product, score }
    const ingredients = ingredientText(product)
    if (!ingredients) continue
    const shorterName = (product.product_name ?? '').length < (complete?.product.product_name ?? '').length
    if (!complete || score > complete.score || (score === complete.score && shorterName)) {
      complete = { product, score, ingredients }
    }
  }
  return { named, complete }
}

function queryRank(query: string) {
  const latin = query.match(/[a-z]/gi)?.length ?? 0
  const cyrillic = query.match(/[а-яё]/gi)?.length ?? 0
  return latin - cyrillic * 2
}

export async function findProduct(rawQuery: string): Promise<SearchResult> {
  const queries = buildQueries(rawQuery).sort((a, b) => queryRank(b) - queryRank(a))
  const products = new Map<string, OffProduct>()
  let sawSuccess = false

  for (const query of queries) {
    const list = await searchOnce(query)
    if (!list) continue
    sawSuccess = true
    list.forEach((product, index) => {
      const key = product.code || `${product.brands ?? ''}-${product.product_name ?? ''}-${index}`
      if (!products.has(key)) products.set(key, product)
    })
    const early = pickBest(products, tokensOf([query, rawQuery]))
    if (early.complete && early.complete.score >= 6) break
  }

  if (!sawSuccess) {
    return { status: 'error', message: 'Нет связи с базой составов. Проверьте интернет и попробуйте ещё раз.' }
  }

  const tokens = tokensOf(queries)
  const { named: bestNamed, complete: bestComplete } = pickBest(products, tokens)

  if (bestComplete) {
    return {
      status: 'found',
      product: {
        code: bestComplete.product.code ?? '',
        name: displayName(bestComplete.product.product_name ?? '') || 'Без названия',
        brand: displayName(bestComplete.product.brands ?? ''),
        ingredients: bestComplete.ingredients.slice(0, 8000),
      },
    }
  }

  if (bestNamed) {
    return {
      status: 'no_ingredients',
      name: displayName(bestNamed.product.product_name ?? '') || 'Продукт',
      brand: displayName(bestNamed.product.brands ?? ''),
    }
  }

  return { status: 'not_found' }
}
