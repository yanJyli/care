import tube from '../../assets/tiles/cream-tube.png'
import jar from '../../assets/tiles/cream-jar.jpg'
import pump from '../../assets/tiles/pump-bottle.jpg'
import toner from '../../assets/tiles/toner-bottle.jpg'
import shampoo from '../../assets/tiles/shampoo-bottle.jpg'
import dropper from '../../assets/tiles/dropper-bottle.jpg'
import gel from '../../assets/tiles/gel-bottle.jpg'
import shower from '../../assets/tiles/shower-bottle.png'
import spray from '../../assets/tiles/spray-bottle.png'
import scrub from '../../assets/tiles/scrub-jar.jpg'
import bodyPump from '../../assets/tiles/body-pump.jpg'
import drop from '../../assets/tiles/symbol-drop.jpg'
import shield from '../../assets/tiles/symbol-shield.jpg'
import orange from '../../assets/tiles/symbol-orange.jpg'
import sprout from '../../assets/tiles/symbol-sprout.jpg'
import honey from '../../assets/tiles/symbol-honey.jpg'
import cotton from '../../assets/tiles/symbol-cotton.jpg'
import bubbles from '../../assets/tiles/symbol-bubbles.jpg'
import lemon from '../../assets/tiles/symbol-lemon.jpg'
import charcoal from '../../assets/tiles/symbol-charcoal.jpg'
import chamomile from '../../assets/tiles/symbol-chamomile.jpg'
import grains from '../../assets/tiles/symbol-grains.jpg'
import balloon from '../../assets/tiles/symbol-balloon.jpg'
import almond from '../../assets/tiles/symbol-almond.jpg'
import pearl from '../../assets/tiles/symbol-pearl.jpg'
import oil from '../../assets/tiles/symbol-oil.jpg'
import mint from '../../assets/tiles/symbol-mint.jpg'
import leaf from '../../assets/tiles/symbol-leaf.jpg'
import clock from '../../assets/tiles/symbol-clock.jpg'
import dahlia from '../../assets/tiles/symbol-dahlia.png'
import redDrop from '../../assets/tiles/symbol-red-drop.png'
import bloom from '../../assets/tiles/section-shine.png'
import bead from '../../assets/tiles/criterion-bead.png'

const sources: Record<string, string> = {
  tube, jar, pump, toner, shampoo, dropper, gel, shower, spray, scrub, bodyPump,
  drop, shield, orange, sprout, honey, cotton, bubbles, lemon, charcoal, chamomile,
  grains, balloon, almond, pearl, oil, mint, leaf, clock, dahlia, redDrop, bloom, bead,
}

const byId: Record<string, string> = {
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
  if (image?.startsWith('data:') || image?.startsWith('http')) return image
  if (image && sources[image]) return sources[image]
  const known = byId[id]
  if (known) return known
  const key = matchTitle(title)
  return key ? sources[key] : undefined
}

function matchTitle(title: string) {
  const normalized = title.toLowerCase().replace(/ё/g, 'е')
  return byTitle.find(([pattern]) => pattern.test(normalized))?.[1]
}
