export type AnswerTone = 'plus' | 'minus' | 'group'

export function answerSection(text: string) {
  if (text === 'СОСТАВ') return { label: 'Состав', tone: 'plus' as const }
  if (text === 'РАЗБОР') return { label: 'Разберём по группам', tone: 'plus' as const }
  if (text.startsWith('ГРУППА:')) {
    const label = text.slice('ГРУППА:'.length).trim()
    return label ? { label, tone: 'group' as const } : null
  }
  if (text === 'ПЛЮСЫ') return { label: 'Что здесь хорошо', tone: 'plus' as const }
  if (text === 'МИНУСЫ') return { label: 'Что здесь настораживает', tone: 'minus' as const }
  if (text === 'ВЕРДИКТ') return { label: 'Общий вердикт', tone: 'plus' as const }
  if (text === 'СОВЕТ') return { label: 'Совет', tone: 'plus' as const }
  return null
}

export function splitAnswerPoint(text: string) {
  if (answerSection(text)) return null
  const dash = text.match(/^(.{2,80}?)\s+[—–]\s+(.+)$/)
  if (dash) return { name: dash[1], rest: dash[2] }
  const colon = text.match(/^(.{2,60}?):\s+(.+)$/)
  if (colon && !colon[1].includes('.')) return { name: colon[1], rest: colon[2] }
  return null
}
