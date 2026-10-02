import { seedCategories } from '@/data/seed'
import type { ChatRedirect } from '@/types'

const RULES: { re: RegExp; sectionId: string; weight: number }[] = [
  { re: /шампун|shampoo/, sectionId: 'hair-shampoo', weight: 3 },
  { re: /бальзам|кондиционер|conditioner/, sectionId: 'hair-balm', weight: 3 },
  { re: /несмыва|leave[-\s]?in|термозащит/, sectionId: 'hair-heat', weight: 3 },
  { re: /маск[а-я]*\s+для\s+волос|hair\s+mask/, sectionId: 'hair-mask', weight: 4 },
  { re: /масл[а-я]*\s+для\s+волос|hair\s+oil/, sectionId: 'hair-oil', weight: 4 },
  { re: /для\s+душа|shower\s+gel|body\s+wash/, sectionId: 'body-wash', weight: 4 },
  { re: /скраб|scrub/, sectionId: 'body-scrub', weight: 3 },
  { re: /лосьон|body\s+lotion|молочко\s+для\s+тела/, sectionId: 'body-lotion', weight: 3 },
  { re: /крем[а-я]*\s+для\s+тела|крем[а-я]*\s+для\s+рук|body\s+cream/, sectionId: 'body-cream', weight: 4 },
  { re: /сыворот|serum/, sectionId: 'face-serum', weight: 3 },
  { re: /тоник|тонер|toner/, sectionId: 'face-toner', weight: 3 },
  { re: /умыван|face\s+wash|cleanser/, sectionId: 'face-wash', weight: 3 },
  { re: /ночн[а-я]*\s+крем|night\s+cream/, sectionId: 'face-night', weight: 4 },
  { re: /дневн[а-я]*\s+крем|day\s+cream/, sectionId: 'face-day', weight: 4 },
  { re: /маск[а-я]*\s+для\s+лица|face\s+mask|тканев[а-я]*\s+маск/, sectionId: 'face-mask', weight: 4 },
  { re: /spf|солнцезащит/, sectionId: 'face-day', weight: 2 },
]

export function suggestMove(input: { query: string; productName?: string; sectionId: string }) {
  if (looksLikeQuestion(input.query)) return null
  const text = normalize(`${input.query} ${input.productName ?? ''}`)
  const scores = new Map<string, number>()
  for (const rule of RULES) {
    if (!rule.re.test(text)) continue
    if (rule.sectionId === 'body-lotion' && /для\s+лица/.test(text)) continue
    if (rule.sectionId === 'face-day' && /для\s+тела|для\s+рук/.test(text)) continue
    scores.set(rule.sectionId, (scores.get(rule.sectionId) ?? 0) + rule.weight)
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1])
  const [best, next] = ranked
  if (best && (!next || best[1] > next[1]) && best[0] !== input.sectionId) {
    return moveTo(best[0], input.sectionId, 'name')
  }

  const zone = zoneHint(text)
  const current = findSection(input.sectionId)
  if (zone && current && zone !== current.category.id && !best) {
    const category = seedCategories.find((item) => item.id === zone)
    if (!category) return null
    return {
      text: `По названию это средство ${zonePhrase(zone)}, а здесь подбор ${zonePhrase(current.category.id)}.`,
      redirect: {
        label: `Перейти в «${category.title}»`,
        pathname: '/category/[id]' as const,
        id: category.id,
      },
    }
  }
  return null
}

export function readPurpose(paragraphs: string[]) {
  let sectionId: string | null = null
  const kept: string[] = []
  for (const line of paragraphs) {
    if (!/^назначение\s*:/i.test(line.trim())) {
      kept.push(line)
      continue
    }
    if (!sectionId) sectionId = sectionFromPurpose(line)
  }
  return { paragraphs: kept, sectionId }
}

export function moveTo(sectionId: string, currentSectionId: string, because: 'name' | 'purpose') {
  if (sectionId === currentSectionId) return null
  const place = findSection(sectionId)
  if (!place) return null
  const current = findSection(currentSectionId)
  const here = current ? `«${current.section.title}»` : 'этом разделе'
  const sameZone = current?.category.id === place.category.id
  const label = sameZone ? `Перейти в «${place.section.title}»` : `Перейти в «${place.category.title} · ${place.section.title}»`
  const redirect: ChatRedirect = { label, pathname: '/section/[id]', id: place.section.id }
  const lead = because === 'purpose' ? 'По назначению' : 'По названию'
  return {
    text: `${lead} это средство ${zonePhrase(place.category.id)}, раздел «${place.section.title}», а здесь подбор ${here}.`,
    redirect,
  }
}

function sectionFromPurpose(line: string) {
  const match = line.trim().match(/^назначение\s*:\s*(.+?)\s*\|\s*(.+)$/i)
  if (!match) return null
  const sectionTitle = normalize(match[1])
  const zoneTitle = normalize(match[2])
  for (const category of seedCategories) {
    if (normalize(category.title) !== zoneTitle) continue
    const section = category.sections.find((item) => normalize(item.title) === sectionTitle)
    if (section) return section.id
  }
  const hits = seedCategories.flatMap((category) =>
    category.sections.filter((item) => normalize(item.title) === sectionTitle).map((item) => item.id),
  )
  return hits.length === 1 ? hits[0] : null
}

function findSection(sectionId: string) {
  for (const category of seedCategories) {
    const section = category.sections.find((item) => item.id === sectionId)
    if (section) return { category, section }
  }
  return null
}

function zoneHint(text: string) {
  const face = /для\s+лица/.test(text)
  const hair = /для\s+волос/.test(text)
  const body = /для\s+тела|для\s+рук|для\s+душа/.test(text)
  const hits = [face ? 'face' : '', hair ? 'hair' : '', body ? 'body' : ''].filter(Boolean)
  if (hits.length !== 1) return null
  return hits[0]
}

function zonePhrase(zoneId: string) {
  if (zoneId === 'hair') return 'для волос'
  if (zoneId === 'body') return 'для тела'
  return 'для лица'
}

function looksLikeQuestion(query: string) {
  const text = normalize(query)
  return /^(как|что|чем|почему|зачем|можно|стоит|когда|куда|нужно|надо|расскаж|объясн|сравни|подскаж|это |он |она |они )/.test(text)
}

function normalize(value: string) {
  return value.toLowerCase().replace(/ё/g, 'е')
}
