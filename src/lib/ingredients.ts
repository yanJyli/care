import type { Effect } from '@/types'

type Rule = {
  keys: string[]
  label: string
  effects: Effect[]
}

const RULES: Rule[] = [
  { keys: ['hydrolyzed hyaluronic', 'sodium hyaluronate', 'hyaluron'], label: 'гиалуроновая кислота', effects: ['humectant'] },
  { keys: ['glycerin', 'glycerol', 'глицерин'], label: 'глицерин', effects: ['humectant'] },
  { keys: ['propanediol'], label: 'пропандиол', effects: ['humectant'] },
  { keys: ['butylene glycol', 'pentylene glycol', 'propylene glycol'], label: 'гликоль', effects: ['humectant'] },
  { keys: ['sodium pca'], label: 'PCA', effects: ['humectant'] },
  { keys: ['diazolidinyl urea', 'imidazolidinyl urea'], label: 'консервант', effects: [] },
  { keys: ['urea', 'мочевина'], label: 'мочевина', effects: ['humectant'] },
  { keys: ['trehalose', 'трегалоза'], label: 'трегалоза', effects: ['humectant'] },
  { keys: ['panthenol', 'pantothen', 'пантенол'], label: 'пантенол', effects: ['humectant', 'soothing', 'repair'] },
  { keys: ['beta-glucan', 'beta glucan'], label: 'бета-глюкан', effects: ['humectant', 'soothing'] },
  { keys: ['aloe barbadensis', 'aloe vera', 'алоэ'], label: 'алоэ', effects: ['soothing', 'humectant'] },
  { keys: ['honey', 'мёд'], label: 'мёд', effects: ['humectant'] },
  { keys: ['ceramide', 'церамид'], label: 'церамиды', effects: ['barrier', 'repair'] },
  { keys: ['phytosphingosine', 'фитосфингозин'], label: 'фитосфингозин', effects: ['barrier'] },
  { keys: ['cholesterol', 'холестерин'], label: 'холестерин', effects: ['barrier'] },
  { keys: ['squalane', 'squalene', 'сквален', 'сквалан'], label: 'сквалан', effects: ['emollient', 'barrier'] },
  { keys: ['caprylic/capric triglyceride', 'caprylic triglyceride'], label: 'смягчающая основа', effects: ['emollient'] },
  { keys: ['cetearyl alcohol', 'cetyl alcohol', 'stearyl alcohol', 'myristyl alcohol', 'behenyl alcohol', 'arachidyl alcohol'], label: 'жирные спирты', effects: ['emollient'] },
  { keys: ['butyrospermum', 'shea butter', 'масло ши'], label: 'масло ши', effects: ['butter', 'emollient', 'oil'] },
  { keys: ['petrolatum', 'вазелин'], label: 'петролатум', effects: ['occlusive'] },
  { keys: ['paraffinum liquidum', 'mineral oil'], label: 'минеральное масло', effects: ['occlusive'] },
  { keys: ['dimethicone', 'диметикон'], label: 'диметикон', effects: ['silicone', 'emollient'] },
  { keys: ['cyclopentasiloxane', 'cyclohexasiloxane', 'dimethiconol', 'phenyl trimethicone'], label: 'силикон', effects: ['silicone', 'emollient'] },
  { keys: ['argania'], label: 'аргановое масло', effects: ['oil'] },
  { keys: ['simmondsia', 'jojoba'], label: 'масло жожоба', effects: ['oil'] },
  { keys: ['cocos nucifera oil'], label: 'кокосовое масло', effects: ['oil'] },
  { keys: ['helianthus annuus'], label: 'масло подсолнечника', effects: ['oil'] },
  { keys: ['prunus amygdalus'], label: 'миндальное масло', effects: ['oil'] },
  { keys: ['olea europaea'], label: 'оливковое масло', effects: ['oil'] },
  { keys: ['persea gratissima'], label: 'масло авокадо', effects: ['oil'] },
  { keys: ['niacinamide', 'ниацинамид'], label: 'ниацинамид', effects: ['barrier', 'brightening', 'sebum'] },
  { keys: ['tocopher', 'токоферол'], label: 'витамин E', effects: ['antioxidant'] },
  { keys: ['ascorb', 'аскорб'], label: 'витамин C', effects: ['brightening', 'antioxidant'] },
  { keys: ['retinyl', 'retinol', 'retinal', 'ретинол'], label: 'ретиноид', effects: ['antiage'] },
  { keys: ['peptide', 'пептид'], label: 'пептиды', effects: ['antiage'] },
  { keys: ['caffeine', 'кофеин'], label: 'кофеин', effects: ['refreshing', 'sebum'] },
  { keys: ['ethylhexyl salicylate', 'homosalate', 'octisalate'], label: 'UV-фильтр', effects: ['uv'] },
  { keys: ['salicylic', 'салицилов'], label: 'салициловая кислота', effects: ['exfoliant', 'sebum'] },
  { keys: ['glycolic', 'гликолев'], label: 'гликолевая кислота', effects: ['exfoliant'] },
  { keys: ['lactic acid', 'молочная кислота'], label: 'молочная кислота', effects: ['exfoliant', 'humectant'] },
  { keys: ['mandelic', 'миндальная кислота'], label: 'миндальная кислота', effects: ['exfoliant'] },
  { keys: ['gluconolactone', 'lactobionic'], label: 'PHA', effects: ['exfoliant'] },
  { keys: ['centella', 'asiaticoside', 'madecassoside', 'мадекассосид'], label: 'центелла', effects: ['soothing', 'repair'] },
  { keys: ['allantoin', 'аллантоин'], label: 'аллантоин', effects: ['soothing'] },
  { keys: ['bisabolol', 'бисаболол'], label: 'бисаболол', effects: ['soothing'] },
  { keys: ['chamomilla', 'ромашк'], label: 'ромашка', effects: ['soothing'] },
  { keys: ['camellia sinensis'], label: 'зелёный чай', effects: ['antioxidant'] },
  { keys: ['zinc oxide', 'оксид цинка'], label: 'оксид цинка', effects: ['uv', 'sebum'] },
  { keys: ['titanium dioxide', 'диоксид титана'], label: 'диоксид титана', effects: ['uv'] },
  { keys: ['ethylhexyl methoxycinnamate', 'butyl methoxydibenzoylmethane', 'octocrylene', 'ethylhexyl triazone', 'bis-ethylhexyloxyphenol', 'avobenzone', 'octinoxate', 'polysilicone-15', 'diethylamino hydroxybenzoyl'], label: 'UV-фильтр', effects: ['uv'] },
  { keys: ['zinc pca'], label: 'цинк PCA', effects: ['sebum'] },
  { keys: ['hydrolyzed keratin', 'keratin', 'кератин'], label: 'кератин', effects: ['protein', 'repair'] },
  { keys: ['hydrolyzed collagen', 'collagen', 'коллаген'], label: 'коллаген', effects: ['protein', 'repair'] },
  { keys: ['hydrolyzed wheat', 'hydrolyzed silk', 'hydrolyzed rice protein', 'hydrolyzed soy'], label: 'протеин', effects: ['protein', 'repair'] },
  { keys: ['biotin', 'биотин'], label: 'биотин', effects: ['protein'] },
  { keys: ['sodium laureth sulfate', 'sodium lauryl sulfate', 'ammonium laureth sulfate', 'ammonium lauryl sulfate'], label: 'жёсткий ПАВ', effects: ['harsh', 'cleansing'] },
  { keys: ['cocamidopropyl betaine'], label: 'бетаин', effects: ['gentle', 'cleansing'] },
  { keys: ['caprylyl/capryl glucoside', 'decyl glucoside', 'coco-glucoside', 'lauryl glucoside'], label: 'мягкий ПАВ', effects: ['gentle', 'cleansing'] },
  { keys: ['menthol', 'ментол'], label: 'ментол', effects: ['refreshing'] },
  { keys: ['behentrimonium'], label: 'кондиционирующий агент', effects: ['emollient'] },
  { keys: ['polyquaternium'], label: 'поликватерниум', effects: ['emollient'] },
  { keys: ['benzyl salicylate', 'hexyl cinnamal', 'limonene', 'linalool', 'citronellol', 'geraniol'], label: 'компонент отдушки', effects: ['fragrance'] },
  { keys: ['parfum', 'fragrance', 'aroma', 'отдушк'], label: 'отдушка', effects: ['fragrance'] },
  { keys: ['benzyl alcohol', 'phenoxyethanol'], label: 'консервант', effects: [] },
  { keys: ['alcohol denat', 'sd alcohol', 'isopropyl alcohol', 'alcohol'], label: 'спирт', effects: ['drying'] },
]

const MATCHERS = RULES.flatMap((rule) =>
  rule.keys.map((key) => ({
    key: key.toLowerCase().replace(/ё/g, 'е'),
    label: rule.label,
    effects: rule.effects,
  })),
).sort((a, b) => b.key.length - a.key.length)

function isWater(line: string) {
  return /^(aqua|water|eau|вода)(\s*\/\s*(aqua|water|eau|вода))*$/.test(line)
}

export function splitIngredients(text: string) {
  return text
    .replace(/\([^)]*\)/g, ' ')
    .split(/[,;\n•]+/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part.length > 1)
}

export function matchIngredient(line: string) {
  const normalized = line.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim()
  if (!normalized || isWater(normalized)) return null
  return MATCHERS.find((matcher) => normalized.includes(matcher.key)) ?? null
}
