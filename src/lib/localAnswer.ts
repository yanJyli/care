import { analyzeProduct, citeFormula, describeComparison, describeSingle, reviewFormula, shortVerdict } from '@/lib/analyze'
import type { ChatRequest } from '@/lib/ask'
import { formulaTitle } from '@/lib/composer'
import { findProduct } from '@/lib/search'
import type { ProductReport } from '@/types'

export async function localReply(input: ChatRequest) {
  const pasted = input.formula?.trim() ?? ''
  const followUp = !pasted && isFollowUp(input.query, input.products.length > 0)
  if (followUp) return { paragraphs: followUpParagraphs(input), product: null }

  const manualName = pasted ? formulaTitle(input.query) : input.query.trim() && input.query.trim() !== 'Разбери этот состав' ? input.query.trim() : 'Свой состав'
  if (pasted) {
    const report = analyzeProduct(
      { code: '', query: input.query, name: manualName, brand: '', ingredients: pasted },
      input.criterion,
    )
    return {
      paragraphs: compose(report, input),
      product: { code: '', name: manualName, brand: '', ingredients: pasted },
    }
  }

  const found = await findProduct(input.query)
  if (found.status === 'error') {
    return {
      paragraphs: [found.message, 'Если состав есть под рукой, вставьте его — разбор пойдёт без поиска.'],
      product: null,
    }
  }
  if (found.status === 'not_found') {
    return {
      paragraphs: [
        'Опубликованный состав по этому названию не нашёлся.',
        `Вставьте состав сами, и я разберу его под критерий «${input.criterion}».`,
      ],
      product: null,
    }
  }
  if (found.status === 'no_ingredients') {
    const title = found.brand ? `${found.brand} · ${found.name}` : found.name
    return {
      paragraphs: [
        `${title} нашёлся, но опубликованного состава нет.`,
        'Вставьте состав сами — разберу плюсы, минусы и кому средство подходит.',
      ],
      product: { code: '', name: found.name, brand: found.brand, ingredients: '' },
    }
  }

  const report = analyzeProduct(
    {
      code: found.product.code,
      query: input.query,
      name: found.product.name,
      brand: found.product.brand,
      ingredients: found.product.ingredients,
    },
    input.criterion,
  )
  return {
    paragraphs: compose(report, input),
    product: {
      code: found.product.code,
      name: found.product.name,
      brand: found.product.brand,
      ingredients: found.product.ingredients,
    },
  }
}

function compose(report: ProductReport, input: ChatRequest) {
  const formula = report.ingredients?.trim() ?? ''
  const review = reviewFormula(formula, input.criterion)
  const cited = citeFormula(formula)
  const lead =
    cited.length > 0
      ? `По этому списку средство собрано вокруг таких ролей: ${cited.map((group) => group.title.toLowerCase()).join(', ')}.`
      : ''
  const opening = formula ? ['СОСТАВ', formula, ...(lead ? [lead] : [])] : []
  const groups =
    cited.length > 0
      ? ['РАЗБОР', ...cited.flatMap((group) => [`ГРУППА: ${group.title}`, ...group.lines])]
      : []
  return [...opening, ...groups, 'ПЛЮСЫ', ...review.plus, 'МИНУСЫ', ...review.minus, 'ВЕРДИКТ', verdict(report, input.criterion), 'СОВЕТ', advice(input, report)]
}

function verdict(report: ProductReport, criterion: string) {
  const title = report.brand ? `${report.brand} · ${report.name}` : report.name
  const level = shortVerdict(report)
  if (report.missingUv) {
    return `${title} само не закрывает защиту от солнца под критерий «${criterion}». Фильтров в составе нет. На уже раздражённую кожу его лучше не ставить, если выше есть жёсткие компоненты.`
  }
  if (level === 'уверенно' || level === 'заметно') {
    return `${title} подходит под критерий «${criterion}». Нужные компоненты в составе есть. Жёстковато оно будет для кожи, которая уже щиплет или сильно стянута.`
  }
  if (level === 'точечно') {
    return `${title} закрывает критерий «${criterion}» частично. На спокойной коже его можно пробовать, а при чувствительности смотрите на минусы выше.`
  }
  return `${title} почти не отвечает критерию «${criterion}». Брать его именно под эту задачу не стоит, особенно если кожа легко пересушивается.`
}

function advice(input: ChatRequest, report: ProductReport) {
  const text = `${input.zone} ${input.section} ${input.criterion}`.toLowerCase().replace(/ё/g, 'е')
  if (/отшелуш|кислот/.test(text)) {
    return 'Начните с одного-двух раз в неделю, не совмещайте в тот же вечер с другими кислотами и днём защищайте кожу от солнца.'
  }
  if (report.missingUv && /защищ/.test(text)) {
    return 'Днём используйте отдельное средство с фильтрами и обновляйте его, если долго находитесь на улице.'
  }
  if (/шампун|умыван|гель/.test(text)) {
    return 'Смойте средство полностью. Если после этого стягивает, следом нанесите увлажнение и не держите пену долго.'
  }
  if (report.notes.some((note) => /жёсткие|сушить|спирт/.test(note))) {
    return 'В первые дни проверьте реакцию на небольшом участке. Если стягивает, используйте реже и следом наносите увлажнение.'
  }
  if (input.zone === 'Волосы') {
    return 'Нанесите на нужную зону и смойте по времени с упаковки. Плотные масла не оставляйте на коже головы, если она быстро жирнеет.'
  }
  return 'Нанесите на чистую кожу и первые дни смотрите, нет ли стянутости или покраснения.'
}

function followUpParagraphs(input: ChatRequest) {
  const withFormula = input.products.filter((product) => product.ingredients)
  const question = input.query.toLowerCase().replace(/ё/g, 'е')
  if (withFormula.length >= 2 && /сравн|лучше|разниц|какой|кто/.test(question)) {
    return describeComparison(withFormula, input.criterion)
  }
  const last = withFormula[withFormula.length - 1]
  if (!last) {
    return ['Состава пока нет. Напишите название ещё раз или вставьте список компонентов.']
  }
  if (/как часто|каждый день|можно|сколько|когда/.test(question)) {
    const careful = last.notes.some((note) => /жёсткие|сушить|спирт/.test(note)) || last.missingUv
    const lead = careful
      ? 'Каждый день лучше не начинать. В составе есть компоненты, которые могут сушить или раздражать.'
      : 'На спокойной коже его можно использовать каждый день.'
    return [`${lead} ${advice(input, last)}`]
  }
  return describeSingle(last, input.criterion)
}

function isFollowUp(query: string, hasProducts: boolean) {
  if (!hasProducts) return false
  const text = query.toLowerCase().replace(/ё/g, 'е').trim()
  if (text.includes('?')) return true
  return /^(как|что|чем|почему|зачем|можно|стоит|когда|куда|нужно|надо|расскаж|объясн|сравни|подскаж|это |он |она |они |его |ее |её )/.test(text)
}
