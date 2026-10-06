const OWN_FORMULA = 'Разбери этот состав'

export function looksLikeFormula(value: string) {
  const text = value.trim()
  if (text.includes('?')) return false
  const parts = text
    .split(/[;,\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length < 4) return false
  const ingredients = parts.filter((part) => part.length <= 60 && part.split(/\s+/).length <= 8)
  return ingredients.length >= 4 && ingredients.length >= parts.length - 1
}

export function looksLikeQuestion(value: string) {
  const text = value.toLowerCase().replace(/ё/g, 'е').trim()
  if (!text || looksLikeFormula(text)) return false
  if (text.includes('?')) return true
  return /^(как|что|чем|почему|зачем|можно|стоит|когда|куда|нужно|надо|расскаж\w*|объясн\w*|сравни\w*|подскаж\w*|это|он|она|они|его|ее|её)(\s|$)/.test(text)
}

export function formulaTitle(query: string) {
  const text = query.trim()
  if (!text || text === OWN_FORMULA || looksLikeQuestion(text) || looksLikeFormula(text)) return 'Свой состав'
  return text
}

export function submitsOnEnter(draft: string) {
  const text = draft.trim()
  return Boolean(text) && !text.includes('\n') && !looksLikeFormula(text)
}

export function readComposer(draft: string) {
  const text = draft.trim()
  if (!text) return { query: '', formula: '', name: '', question: false }

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const picked = pickFormula(lines)
  if (!picked) return { query: text, formula: '', name: '', question: looksLikeQuestion(text) }

  const note = picked.note.trim()
  return {
    query: note || OWN_FORMULA,
    formula: picked.formula,
    name: formulaTitle(note),
    question: looksLikeQuestion(note),
  }
}

function pickFormula(lines: string[]) {
  let best: { formula: string; note: string; score: number } | null = null
  for (let start = 0; start < lines.length; start += 1) {
    for (let end = lines.length; end > start; end -= 1) {
      const formula = lines.slice(start, end).join('\n')
      if (!looksLikeFormula(formula)) continue
      const noteLines = [...lines.slice(0, start), ...lines.slice(end)]
      const note = noteLines.join('\n')
      const noteIsList = Boolean(note.trim()) && (looksLikeFormula(note) || noteLines.some((line) => looksLikeFormula(line)))
      const formulaHasList = /[;,]/.test(formula)
      const noteLooksAttached =
        !formulaHasList && noteLines.every((line) => line.length <= 40 && !/[;,]/.test(line) && line.split(/\s+/).length <= 6)
      const score = formula.length + (note.trim() && !noteIsList && !noteLooksAttached ? 1000 : 0)
      if (!best || score > best.score) best = { formula, note, score }
      break
    }
  }
  return best
}
