import type { ImageSourcePropType } from 'react-native'

const tube = require('../../assets/tiles/cream-tube.png') as ImageSourcePropType
const jar = require('../../assets/tiles/cream-jar.png') as ImageSourcePropType
const pump = require('../../assets/tiles/pump-bottle.png') as ImageSourcePropType
const toner = require('../../assets/tiles/toner-bottle.png') as ImageSourcePropType
const shampoo = require('../../assets/tiles/shampoo-bottle.png') as ImageSourcePropType
const dropper = require('../../assets/tiles/dropper-bottle.png') as ImageSourcePropType
const gel = require('../../assets/tiles/gel-bottle.png') as ImageSourcePropType
const shower = require('../../assets/tiles/shower-bottle.png') as ImageSourcePropType
const spray = require('../../assets/tiles/spray-bottle.png') as ImageSourcePropType
const scrub = require('../../assets/tiles/scrub-jar.png') as ImageSourcePropType
const bodyPump = require('../../assets/tiles/body-pump.png') as ImageSourcePropType
const drop = require('../../assets/tiles/symbol-drop.png') as ImageSourcePropType
const shield = require('../../assets/tiles/symbol-shield.png') as ImageSourcePropType
const orange = require('../../assets/tiles/symbol-orange.png') as ImageSourcePropType
const sprout = require('../../assets/tiles/symbol-sprout.png') as ImageSourcePropType
const honey = require('../../assets/tiles/symbol-honey.png') as ImageSourcePropType
const cotton = require('../../assets/tiles/symbol-cotton.png') as ImageSourcePropType
const bubbles = require('../../assets/tiles/symbol-bubbles.png') as ImageSourcePropType
const lemon = require('../../assets/tiles/symbol-lemon.png') as ImageSourcePropType
const charcoal = require('../../assets/tiles/symbol-charcoal.png') as ImageSourcePropType
const chamomile = require('../../assets/tiles/symbol-chamomile.png') as ImageSourcePropType
const grains = require('../../assets/tiles/symbol-grains.png') as ImageSourcePropType
const balloon = require('../../assets/tiles/symbol-balloon.png') as ImageSourcePropType
const almond = require('../../assets/tiles/symbol-almond.png') as ImageSourcePropType
const pearl = require('../../assets/tiles/symbol-pearl.png') as ImageSourcePropType
const oil = require('../../assets/tiles/symbol-oil.png') as ImageSourcePropType
const mint = require('../../assets/tiles/symbol-mint.png') as ImageSourcePropType
const leaf = require('../../assets/tiles/symbol-leaf.png') as ImageSourcePropType
const clock = require('../../assets/tiles/symbol-clock.png') as ImageSourcePropType
const dahlia = require('../../assets/tiles/symbol-dahlia.png') as ImageSourcePropType
const redDrop = require('../../assets/tiles/symbol-red-drop.png') as ImageSourcePropType
const bloom = require('../../assets/tiles/section-shine.png') as ImageSourcePropType
const bead = require('../../assets/tiles/criterion-bead.png') as ImageSourcePropType

const sources: Record<string, ImageSourcePropType> = {
  tube, jar, pump, toner, shampoo, dropper, gel, shower, spray, scrub, bodyPump,
  drop, shield, orange, sprout, honey, cotton, bubbles, lemon, charcoal, chamomile,
  grains, balloon, almond, pearl, oil, mint, leaf, clock, dahlia, bloom, bead,
}

export const tileOptions = {
  section: [
    { id: 'tube', hint: 'тюбик крема' },
    { id: 'jar', hint: 'баночка крема или маски' },
    { id: 'pump', hint: 'флакон с помпой, лосьон' },
    { id: 'toner', hint: 'бутылочка тоника' },
    { id: 'shampoo', hint: 'флакон шампуня' },
    { id: 'dropper', hint: 'флакон с пипеткой, сыворотка или масло' },
    { id: 'gel', hint: 'флакон геля или бальзама' },
    { id: 'shower', hint: 'гель для душа' },
    { id: 'spray', hint: 'спрей' },
    { id: 'scrub', hint: 'баночка скраба' },
    { id: 'bodyPump', hint: 'крупный флакон для тела' },
  ],
  criterion: [
    { id: 'drop', hint: 'капля, увлажнение' },
    { id: 'shield', hint: 'щит, защита' },
    { id: 'orange', hint: 'цитрус, тонус' },
    { id: 'sprout', hint: 'росток, восстановление' },
    { id: 'honey', hint: 'мёд, питание' },
    { id: 'cotton', hint: 'хлопок, мягкость' },
    { id: 'bubbles', hint: 'пузыри, очищение' },
    { id: 'lemon', hint: 'лимон, кислота' },
    { id: 'charcoal', hint: 'уголь, жирность' },
    { id: 'chamomile', hint: 'ромашка, успокоение' },
    { id: 'grains', hint: 'зёрна, отшелушивание' },
    { id: 'balloon', hint: 'объём' },
    { id: 'almond', hint: 'миндаль, сухость' },
    { id: 'pearl', hint: 'жемчуг, блеск и сияние' },
    { id: 'oil', hint: 'масло, кончики' },
    { id: 'mint', hint: 'мята, свежесть' },
    { id: 'leaf', hint: 'лист, кожа головы' },
    { id: 'clock', hint: 'время, антивозраст' },
    { id: 'dahlia', hint: 'цветок, чувствительная кожа' },
  ],
}

const byId: Record<string, ImageSourcePropType> = {
  face: tube,
  hair: shampoo,
  body: pump,
  'face-day': tube,
  'face-night': tube,
  'face-wash': pump,
  'face-toner': toner,
  'face-mask': jar,
  'face-serum': dropper,
  'hair-shampoo': shampoo,
  'hair-balm': gel,
  'hair-mask': jar,
  'hair-oil': dropper,
  'hair-heat': spray,
  'body-lotion': pump,
  'body-wash': shower,
  'body-scrub': scrub,
  'body-cream': tube,
  'face-day-moisture': drop,
  'face-day-protect': shield,
  'face-day-tone': orange,
  'face-day-sensitive': dahlia,
  'face-night-repair': sprout,
  'face-night-nourish': honey,
  'face-night-age': clock,
  'face-night-sensitive': dahlia,
  'face-wash-gentle': cotton,
  'face-wash-deep': bubbles,
  'face-wash-oily': charcoal,
  'face-wash-sensitive': dahlia,
  'face-toner-moisture': drop,
  'face-toner-calm': chamomile,
  'face-toner-peel': grains,
  'face-toner-sensitive': dahlia,
  'face-mask-moisture': drop,
  'face-mask-clean': bubbles,
  'face-mask-calm': chamomile,
  'face-mask-sensitive': dahlia,
  'face-serum-moisture': drop,
  'face-serum-age': clock,
  'face-serum-glow': pearl,
  'face-serum-acid': redDrop,
  'face-serum-sensitive': dahlia,
  'hair-shampoo-volume': balloon,
  'hair-shampoo-dry': almond,
  'hair-shampoo-oily': charcoal,
  'hair-balm-moisture': drop,
  'hair-balm-repair': sprout,
  'hair-balm-shine': pearl,
  'hair-mask-nourish': honey,
  'hair-mask-repair': sprout,
  'hair-oil-ends': oil,
  'hair-oil-scalp': leaf,
  'hair-heat-protect': shield,
  'hair-heat-moisture': drop,
  'hair-heat-shine': pearl,
  'body-lotion-moisture': drop,
  'body-lotion-nourish': honey,
  'body-wash-gentle': cotton,
  'body-wash-fresh': mint,
  'body-scrub-gentle': cotton,
  'body-scrub-deep': grains,
  'body-cream-moisture': drop,
  'body-cream-protect': shield,
}

const byTitle: [RegExp, string][] = [
  [/чувствительн/, 'dahlia'],
  [/увлаж/, 'drop'],
  [/солн|spf|защит/, 'shield'],
  [/тониз|тонус/, 'orange'],
  [/восстан/, 'sprout'],
  [/питат/, 'honey'],
  [/антивозраст/, 'clock'],
  [/мягк/, 'cotton'],
  [/глубок/, 'bubbles'],
  [/кислот/, 'lemon'],
  [/жирн/, 'charcoal'],
  [/успок/, 'chamomile'],
  [/отшелуш/, 'grains'],
  [/объем/, 'balloon'],
  [/сух/, 'almond'],
  [/блеск/, 'pearl'],
  [/кончик/, 'oil'],
  [/сиян/, 'pearl'],
  [/сыворот/, 'dropper'],
  [/термо|несмыв|спрей/, 'spray'],
  [/душ/, 'shower'],
  [/голов/, 'leaf'],
  [/освеж/, 'mint'],
  [/очищ/, 'bubbles'],
  [/скраб/, 'scrub'],
  [/шампун/, 'shampoo'],
  [/масл/, 'dropper'],
  [/тоник/, 'toner'],
  [/умывал/, 'pump'],
  [/гель/, 'gel'],
  [/лосьон/, 'pump'],
  [/маск/, 'jar'],
  [/ночн/, 'jar'],
  [/дневн|крем|бальзам/, 'tube'],
  [/волос/, 'shampoo'],
  [/тело/, 'bodyPump'],
  [/лиц/, 'tube'],
]

export function tileImageFor(id: string, title: string, image?: string) {
  if (image?.startsWith('data:') || image?.startsWith('http')) return { uri: image }
  if (image && sources[image]) return sources[image]
  const known = byId[id]
  if (known) return known
  const key = matchTitle(title)
  return key ? sources[key] : undefined
}

export function fallbackTile(title: string, kind: 'section' | 'criterion') {
  const allowed = new Set(tileOptions[kind].map((option) => option.id))
  const matched = matchTitle(title)
  if (matched && allowed.has(matched)) return matched
  return kind === 'section' ? 'tube' : 'drop'
}

function matchTitle(title: string) {
  const normalized = title.toLowerCase().replace(/ё/g, 'е')
  return byTitle.find(([pattern]) => pattern.test(normalized))?.[1]
}
