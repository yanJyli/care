import { analyzeProduct } from '@/lib/analyze'
import { reply } from '@/lib/ask'
import { moveTo, readPurpose, suggestMove } from '@/lib/fit'
import type { ChatMessage, ChatRedirect, ProductReport } from '@/types'

type ConsultInput = {
  query: string
  criterion: string
  section: string
  sectionId: string
  zone: string
  previous: ProductReport[]
  history: ChatMessage[]
  formula?: string
  photo?: { mimeType: string; base64: string }
}

type ConsultResult = {
  paragraphs: string[]
  product?: ProductReport
  redirect?: ChatRedirect
}

export async function consult(input: ConsultInput) {
  try {
    const result = await reply({
      query: input.query,
      criterion: input.criterion,
      section: input.section,
      zone: input.zone,
      history: input.history,
      products: input.previous,
      formula: input.formula,
      photo: input.photo,
    })
    const found = result.product
    if (!found?.name) return place(input, { paragraphs: result.paragraphs })

    const same = input.previous.some((item) => {
      if (found.code && item.code === found.code) return true
      return item.name.trim().toLowerCase() === found.name.trim().toLowerCase()
    })
    if (same) return place(input, { paragraphs: result.paragraphs }, found.name)

    if (!found.ingredients) {
      return place(
        input,
        {
          paragraphs: result.paragraphs,
          product: {
            id: found.name,
            code: found.code,
            query: input.query,
            name: found.name,
            brand: found.brand,
            total: 0,
            score: 0,
            hitCount: 0,
            highlights: [],
            known: [],
            notes: [],
            missingUv: false,
          },
        },
        found.name,
      )
    }

    return place(
      input,
      {
        paragraphs: result.paragraphs,
        product: analyzeProduct(
          { code: found.code, query: input.query, name: found.name, brand: found.brand, ingredients: found.ingredients },
          input.criterion,
        ),
      },
      found.name,
    )
  } catch (error) {
    return place(input, { paragraphs: [error instanceof Error ? error.message : 'Не удалось получить ответ.'] })
  }
}

function place(input: ConsultInput, result: ConsultResult, productName = ''): ConsultResult {
  const parsed = readPurpose(result.paragraphs)
  const fromModel = parsed.sectionId ? moveTo(parsed.sectionId, input.sectionId, 'purpose') : null
  const hint = fromModel ?? suggestMove({ query: input.query, productName, sectionId: input.sectionId })
  if (!hint) return { ...result, paragraphs: parsed.paragraphs }
  const analysis = parsed.paragraphs.filter((line) => line.trim() && line.trim() !== hint.text)
  return {
    paragraphs: analysis.length > 0 ? [...analysis, hint.text] : [hint.text],
    redirect: hint.redirect,
    product: result.product,
  }
}
