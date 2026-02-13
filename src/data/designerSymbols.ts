export interface DesignerSymbol {
  id: string
  name: string
  viewBox: string
  path: string
}

export const designerSymbols: DesignerSymbol[] = [
  {
    id: 'tree',
    name: 'Gran',
    viewBox: '0 0 100 100',
    path: 'M50 5 L75 45 H65 L85 70 H60 V95 H40 V70 H15 L35 45 H25 Z',
  },
  {
    id: 'mountain',
    name: 'Fjell',
    viewBox: '0 0 100 100',
    path: 'M5 90 L35 20 L50 45 L65 15 L95 90 Z',
  },
  {
    id: 'house',
    name: 'Hus',
    viewBox: '0 0 100 100',
    path: 'M50 10 L90 45 H75 V90 H60 V65 H40 V90 H25 V45 H10 Z',
  },
  {
    id: 'sun',
    name: 'Sol',
    viewBox: '0 0 100 100',
    path: 'M50 30 A20 20 0 1 0 50 70 A20 20 0 1 0 50 30 M50 5 V15 M50 85 V95 M5 50 H15 M85 50 H95 M18 18 L25 25 M75 75 L82 82 M82 18 L75 25 M25 75 L18 82',
  },
  {
    id: 'star',
    name: 'Stjerne',
    viewBox: '0 0 100 100',
    path: 'M50 5 L61 38 H95 L68 58 L79 92 L50 72 L21 92 L32 58 L5 38 H39 Z',
  },
  {
    id: 'heart',
    name: 'Hjerte',
    viewBox: '0 0 100 100',
    path: 'M50 88 C20 65 5 50 5 35 C5 20 17 10 30 10 C38 10 45 14 50 20 C55 14 62 10 70 10 C83 10 95 20 95 35 C95 50 80 65 50 88 Z',
  },
  {
    id: 'anchor',
    name: 'Anker',
    viewBox: '0 0 100 100',
    path: 'M50 15 A10 10 0 1 0 50 35 A10 10 0 1 0 50 15 M50 35 V85 M25 85 C25 60 50 55 50 55 C50 55 75 60 75 85 M35 55 H15 M85 55 H65',
  },
  {
    id: 'elk',
    name: 'Elg',
    viewBox: '0 0 100 100',
    path: 'M30 85 V55 L25 40 L35 30 L40 15 L45 25 H55 L60 15 L65 30 L75 40 L70 55 V85 M35 85 V70 M65 85 V70 M40 45 A2 2 0 1 0 42 45',
  },
  {
    id: 'wave',
    name: 'Bolge',
    viewBox: '0 0 100 100',
    path: 'M5 50 C15 30 25 30 35 50 C45 70 55 70 65 50 C75 30 85 30 95 50 M5 65 C15 45 25 45 35 65 C45 85 55 85 65 65 C75 45 85 45 95 65',
  },
  {
    id: 'compass',
    name: 'Kompass',
    viewBox: '0 0 100 100',
    path: 'M50 10 L55 45 L90 50 L55 55 L50 90 L45 55 L10 50 L45 45 Z M50 5 A45 45 0 1 0 50 95 A45 45 0 1 0 50 5 M50 10 A40 40 0 1 0 50 90 A40 40 0 1 0 50 10',
  },
]
