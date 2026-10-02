import type { Effect, ProductReport } from '@/types'
import { matchIngredient, splitIngredients } from '@/lib/ingredients'

type Profile = {
  want: Effect[]
  avoid: Effect[]
  custom: boolean
}

const PROFILES: { test: RegExp; want: Effect[]; avoid: Effect[] }[] = [
  { test: /глубок/, want: ['exfoliant', 'cleansing', 'harsh'], avoid: [] },
  { test: /жирн/, want: ['sebum', 'exfoliant', 'gentle'], avoid: ['occlusive', 'butter', 'oil'] },
  { test: /сух/, want: ['oil', 'butter', 'humectant', 'occlusive', 'emollient'], avoid: ['harsh', 'drying'] },
  { test: /кожи головы/, want: ['soothing', 'sebum', 'gentle'], avoid: ['harsh', 'occlusive'] },
  { test: /объем/, want: ['protein'], avoid: ['oil', 'butter', 'silicone'] },
  { test: /блеск/, want: ['silicone', 'oil', 'emollient'], avoid: ['harsh'] },
  { test: /кончик/, want: ['oil', 'silicone', 'butter', 'protein'], avoid: [] },
  { test: /антивозраст/, want: ['antiage', 'antioxidant', 'brightening'], avoid: [] },
  { test: /восстан/, want: ['repair', 'barrier', 'protein', 'soothing'], avoid: ['harsh', 'drying'] },
  { test: /увлаж/, want: ['humectant', 'emollient', 'barrier', 'occlusive'], avoid: ['drying', 'harsh'] },
  { test: /защищ/, want: ['uv', 'antioxidant', 'barrier', 'occlusive'], avoid: ['drying'] },
  { test: /тониз|тонус/, want: ['refreshing', 'brightening'], avoid: [] },
  { test: /питат/, want: ['oil', 'butter', 'emollient', 'occlusive'], avoid: ['harsh'] },
  { test: /мягк/, want: ['gentle', 'soothing', 'humectant'], avoid: ['harsh', 'drying'] },
  { test: /успок/, want: ['soothing', 'repair'], avoid: ['harsh', 'fragrance', 'drying'] },
  { test: /отшелуш|пилинг/, want: ['exfoliant'], avoid: [] },
  { test: /очищ/, want: ['cleansing', 'exfoliant'], avoid: [] },
  { test: /освеж/, want: ['refreshing', 'gentle'], avoid: [] },
  { test: /сиян|осветл/, want: ['brightening', 'antioxidant'], avoid: [] },
  { test: /акне|прыщ/, want: ['sebum', 'exfoliant'], avoid: ['occlusive', 'butter'] },
  { test: /барьер/, want: ['barrier', 'repair'], avoid: ['harsh', 'drying'] },
]

function profileFor(title: string): Profile {
  const normalized = title.toLowerCase().replace(/ё/g, 'е')
  const found = PROFILES.find((profile) => profile.test.test(normalized))
  if (found) return { want: found.want, avoid: found.avoid, custom: false }
  return { want: [], avoid: [], custom: true }
}

function weightAt(index: number) {
  return 1 / (1 + index * 0.12)
}

function wordsOf(title: string) {
  return title
    .toLowerCase()
    .replace(/ё/g, 'е')
    .split(/[^a-zа-я0-9]+/i)
    .filter((word) => word.length > 3)
}

export function analyzeProduct(
  input: { code: string; query: string; name: string; brand: string; ingredients: string },
  criterion: string,
): ProductReport {
  const profile = profileFor(criterion)
  const lines = splitIngredients(input.ingredients)
  const highlights: string[] = []
  const known: string[] = []
  const repeats = new Map<string, number>()
  const present = new Set<Effect>()
  let score = 0

  lines.forEach((line, index) => {
    const rule = matchIngredient(line)
    if (!rule || rule.effects.length === 0) return
    rule.effects.forEach((effect) => present.add(effect))
    if (!known.includes(rule.label)) known.push(rule.label)

    const weight = weightAt(index)
    const wanted = rule.effects.filter((effect) => profile.want.includes(effect))
    const avoided = rule.effects.some((effect) => profile.avoid.includes(effect))
    let delta = 0

    if (profile.custom) {
      const words = wordsOf(criterion)
      if (words.some((word) => rule.label.toLowerCase().includes(word))) delta = weight
    } else if (wanted.length > 0) {
      delta = weight * (1 + (wanted.length - 1) * 0.2)
    }
    if (avoided) delta -= weight * 1.5

    if (delta > 0) {
      const seen = repeats.get(rule.label) ?? 0
      repeats.set(rule.label, seen + 1)
      score += seen === 0 ? delta : delta * 0.35
      if (seen === 0) highlights.push(rule.label)
      return
    }
    if (delta < 0) score += delta
  })

  const missingUv = profile.want.includes('uv') && !present.has('uv')
  const notes: string[] = []
  if (missingUv) notes.push('Солнцезащитных фильтров в составе нет.')
  if (present.has('harsh')) {
    notes.push(
      profile.want.includes('harsh')
        ? 'Жёсткие ПАВ усиливают очищение.'
        : 'Есть жёсткие ПАВ: они сильнее смывают и могут сушить.',
    )
  } else if (present.has('drying') && !profile.want.includes('harsh')) {
    notes.push('Спирт в формуле может сушить.')
  }

  return {
    id: input.code || input.name,
    code: input.code,
    query: input.query,
    name: input.name,
    brand: input.brand,
    total: lines.length,
    score: Math.round(Math.max(0, score) * 100) / 100,
    hitCount: highlights.length,
    highlights,
    known,
    notes: notes.slice(0, 2),
    missingUv,
    ingredients: input.ingredients,
  }
}

const GOOD: Record<Effect, string> = {
  humectant: 'удерживает воду и помогает коже не стягиваться',
  emollient: 'смягчает и делает нанесение комфортнее',
  occlusive: 'задерживает влагу на поверхности',
  barrier: 'поддерживает защитный барьер',
  antioxidant: 'снижает окислительное повреждение',
  uv: 'закрывает кожу от солнца',
  soothing: 'снижает ощущение раздражения',
  brightening: 'помогает выравнивать тон',
  exfoliant: 'обновляет поверхность кожи',
  cleansing: 'смывает загрязнения',
  gentle: 'очищает мягче, чем жёсткие ПАВ',
  harsh: 'усиливает очищение',
  protein: 'укрепляет структуру волоса',
  silicone: 'приглаживает и добавляет блеск',
  oil: 'питает и смягчает',
  butter: 'плотно питает',
  refreshing: 'даёт ощущение свежести',
  sebum: 'помогает с жирностью',
  repair: 'помогает восстановлению',
  antiage: 'работает на плотность и следы возраста',
  fragrance: 'отвечает за запах средства',
  drying: 'быстро уходит с кожи и может сушить',
}

const BAD: Record<Effect, string> = {
  humectant: 'для этой задачи увлажнители не главное',
  emollient: 'смягчители могут быть лишними именно здесь',
  occlusive: 'плотная плёнка может быть тяжеловата под этот критерий',
  barrier: 'барьерные компоненты здесь не в приоритете',
  antioxidant: 'антиоксиданты не закрывают этот критерий',
  uv: 'фильтры здесь не нужны',
  soothing: 'успокаивающие компоненты не закрывают эту задачу',
  brightening: 'осветление здесь не требуется',
  exfoliant: 'кислоты могут быть жёсткими именно для этой кожи',
  cleansing: 'очищение здесь не главное',
  gentle: 'мягкие ПАВ не закрывают этот критерий',
  harsh: 'сильно смывает защитный слой и может сушить',
  protein: 'протеин может утяжелять, если нужен лёгкий уход',
  silicone: 'силиконы могут быть тяжеловаты под эту задачу',
  oil: 'масла могут быть слишком плотными именно здесь',
  butter: 'плотные масла могут перегружать кожу под этот критерий',
  refreshing: 'охлаждение не закрывает эту задачу',
  sebum: 'компоненты против жирности здесь не главное',
  repair: 'восстановление здесь не в приоритете',
  antiage: 'антивозрастные компоненты не закрывают этот критерий',
  fragrance: 'повышает риск раздражения, особенно на чувствительной коже',
  drying: 'может пересушивать кожу',
}

function concernOf(effect: Effect, profile: Profile) {
  if (profile.want.includes(effect)) return false
  return profile.avoid.includes(effect) || effect === 'harsh' || effect === 'drying' || effect === 'fragrance'
}

function capital(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function reviewFormula(ingredients: string, criterion: string) {
  const profile = profileFor(criterion)
  const plus: string[] = []
  const minus: string[] = []
  const seen = new Set<string>()

  splitIngredients(ingredients).forEach((line) => {
    const rule = matchIngredient(line)
    if (!rule || rule.effects.length === 0 || seen.has(rule.label)) return
    const concern = rule.effects.find((effect) => concernOf(effect, profile))
    const support = rule.effects.find((effect) => profile.want.includes(effect))
    if (concern && minus.length < 4) {
      seen.add(rule.label)
      minus.push(`${capital(rule.label)} — ${BAD[concern]}`)
      return
    }
    if (support && plus.length < 5) {
      seen.add(rule.label)
      plus.push(`${capital(rule.label)} — ${GOOD[support]}`)
      return
    }
    if (!profile.custom) return
    const words = wordsOf(criterion)
    const effect = rule.effects[0]
    if (words.some((word) => rule.label.toLowerCase().includes(word)) && plus.length < 5 && effect) {
      seen.add(rule.label)
      plus.push(`${capital(rule.label)} — ${GOOD[effect]}`)
    }
  })

  if (plus.length === 0) {
    plus.push('Явных совпадений с критерием в составе не видно. Знакомые компоненты под эту задачу не выделены.')
  }
  if (minus.length === 0) {
    minus.push('Явных жёстких компонентов не видно. Сильных ПАВ и сушащего спирта в списке нет.')
  }
  return { plus, minus }
}

export function shortVerdict(report: ProductReport) {
  if (report.score < 0.5) return 'слабо'
  const strong = report.score >= 2.4 && report.hitCount >= 3 && !report.missingUv
  if (strong) return 'уверенно'
  if (report.hitCount >= 2 || report.score >= 1.4) return 'заметно'
  if (report.hitCount >= 1) return 'точечно'
  return 'слабо'
}

function fullVerdict(report: ProductReport) {
  const verdict = shortVerdict(report)
  if (verdict === 'уверенно') return 'Критерий закрыт уверенно.'
  if (verdict === 'заметно') return 'Совпадение заметное.'
  if (verdict === 'точечно') return 'Совпадение точечное.'
  return 'Под этот критерий формула почти не отвечает.'
}

function productTitle(report: ProductReport) {
  if (!report.brand) return report.name || 'Без названия'
  if (report.name.toLowerCase().includes(report.brand.toLowerCase())) return report.name
  return `${report.brand} · ${report.name}`
}

function plural(count: number) {
  const n10 = count % 10
  const n100 = count % 100
  if (n10 === 1 && n100 !== 11) return 'ингредиент'
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return 'ингредиента'
  return 'ингредиентов'
}

export function describeSingle(report: ProductReport, criterion: string) {
  const lines = [productTitle(report), `В списке ${report.total} ${plural(report.total)}.`]
  if (report.score >= 0.5 && report.highlights.length > 0) {
    lines.push(`Для критерия «${criterion}» выделяются: ${report.highlights.slice(0, 5).join(', ')}.`)
    lines.push(fullVerdict(report))
  } else if (report.known.length > 0) {
    lines.push(`По критерию «${criterion}» явных совпадений нет.`)
    lines.push(`В формуле узнаю: ${report.known.slice(0, 5).join(', ')}.`)
  } else {
    lines.push('Состав найден, но знакомых компонентов в нём почти нет.')
  }
  return [...lines, ...report.notes]
}

export function describeComparison(reports: ProductReport[], criterion: string) {
  const ranked = [...reports].sort((a, b) => b.score - a.score || b.hitCount - a.hitCount)
  const lines = [`Сравнение по критерию «${criterion}».`]
  ranked.forEach((report, index) => {
    const marks = report.highlights.slice(0, 3).join(', ')
    const title = productTitle(report)
    lines.push(`${index + 1}. ${title} — ${shortVerdict(report)}${marks ? `: ${marks}` : ''}.`)
  })

  const [best, next] = ranked
  if (!next) return lines
  if (best.score <= 0 && next.score <= 0) {
    lines.push('По этому критерию ни один состав явно не выделяется.')
    return lines
  }
  if (best.score - next.score < 0.45) {
    lines.push('Разница небольшая: по этому критерию продукты близки.')
    return lines
  }
  const unique = best.highlights.filter((item) => !next.highlights.includes(item)).slice(0, 3)
  const reason = unique.length > 0 ? `в составе есть ${unique.join(', ')}` : 'совпадений больше'
  lines.push(`${best.name} ближе к критерию: ${reason}.`)
  return lines
}
