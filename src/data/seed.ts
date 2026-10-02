import type { Category } from '@/types'

function criterion(id: string, title: string) {
  return { id, title }
}

function section(id: string, title: string, criteria: { id: string; title: string }[]) {
  return { id, title, criteria }
}

export const seedCategories: Category[] = [
  {
    id: 'face',
    title: 'Лицо',
    sections: [
      section('face-day', 'Дневной крем', [
        criterion('face-day-moisture', 'Увлажняющий'),
        criterion('face-day-protect', 'Защищающий'),
        criterion('face-day-tone', 'Тонизирующий'),
        criterion('face-day-sensitive', 'Для чувствительной кожи'),
      ]),
      section('face-night', 'Ночной крем', [
        criterion('face-night-moisture', 'Увлажняющий'),
        criterion('face-night-repair', 'Восстанавливающий'),
        criterion('face-night-nourish', 'Питательный'),
        criterion('face-night-age', 'Антивозрастной'),
        criterion('face-night-sensitive', 'Для чувствительной кожи'),
      ]),
      section('face-wash', 'Гель для умывания', [
        criterion('face-wash-moisture', 'Увлажняющий'),
        criterion('face-wash-deep', 'Глубокое очищение'),
        criterion('face-wash-oily', 'Для жирной кожи'),
        criterion('face-wash-sensitive', 'Для чувствительной кожи'),
      ]),
      section('face-toner', 'Тоник', [
        criterion('face-toner-moisture', 'Увлажняющий'),
        criterion('face-toner-calm', 'Успокаивающий'),
        criterion('face-toner-peel', 'Отшелушивающий'),
        criterion('face-toner-sensitive', 'Для чувствительной кожи'),
      ]),
      section('face-mask', 'Маска', [
        criterion('face-mask-moisture', 'Увлажняющая'),
        criterion('face-mask-clean', 'Очищающая'),
        criterion('face-mask-calm', 'Успокаивающая'),
        criterion('face-mask-sensitive', 'Для чувствительной кожи'),
      ]),
      section('face-serum', 'Сыворотка', [
        criterion('face-serum-moisture', 'Увлажняющая'),
        criterion('face-serum-age', 'Антивозрастная'),
        criterion('face-serum-glow', 'Для сияния'),
        criterion('face-serum-acid', 'Кислотная'),
        criterion('face-serum-sensitive', 'Для чувствительной кожи'),
      ]),
    ],
  },
  {
    id: 'hair',
    title: 'Волосы',
    sections: [
      section('hair-shampoo', 'Шампунь', [
        criterion('hair-shampoo-volume', 'Для объёма'),
        criterion('hair-shampoo-dry', 'Для сухих'),
        criterion('hair-shampoo-oily', 'Для жирных'),
      ]),
      section('hair-balm', 'Бальзам', [
        criterion('hair-balm-moisture', 'Увлажняющий'),
        criterion('hair-balm-repair', 'Восстанавливающий'),
        criterion('hair-balm-shine', 'Для блеска'),
      ]),
      section('hair-mask', 'Маска', [
        criterion('hair-mask-nourish', 'Питательная'),
        criterion('hair-mask-repair', 'Восстанавливающая'),
      ]),
      section('hair-oil', 'Масло', [
        criterion('hair-oil-ends', 'Для кончиков'),
        criterion('hair-oil-scalp', 'Для кожи головы'),
      ]),
      section('hair-heat', 'Несмываемое средство', [
        criterion('hair-heat-protect', 'Термическая защита'),
        criterion('hair-heat-moisture', 'Увлажняющая'),
        criterion('hair-heat-shine', 'Для блеска'),
      ]),
    ],
  },
  {
    id: 'body',
    title: 'Тело',
    sections: [
      section('body-lotion', 'Лосьон', [
        criterion('body-lotion-moisture', 'Увлажняющий'),
        criterion('body-lotion-nourish', 'Питательный'),
      ]),
      section('body-wash', 'Гель для душа', [
        criterion('body-wash-gentle', 'Мягкий'),
        criterion('body-wash-fresh', 'Освежающий'),
      ]),
      section('body-scrub', 'Скраб', [
        criterion('body-scrub-gentle', 'Мягкий'),
        criterion('body-scrub-deep', 'Глубокий'),
      ]),
      section('body-cream', 'Крем', [
        criterion('body-cream-moisture', 'Увлажняющий'),
        criterion('body-cream-protect', 'Защищающий'),
      ]),
    ],
  },
]

export function cloneSeed(): Category[] {
  return seedCategories.map((category) => ({
    ...category,
    sections: category.sections.map((section) => ({
      ...section,
      criteria: section.criteria.map((criterion) => ({ ...criterion })),
    })),
  }))
}
