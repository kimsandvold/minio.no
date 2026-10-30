import type { OppsettId } from './gravering'

/**
 * Motivmalene – startpunktene i graveringskonfiguratoren.
 *
 * Malene er sortert i anledninger, fordi det er slik folk handler: de leter
 * ikke etter «midtstilt tekst i Cormorant», de leter etter en konfirmasjonsgave
 * eller noe til svigerfar som mekker.
 *
 * TEKSTEN ER TOKENS, IKKE FERDIG TEKST. `{familie}`, `{fornavn}`, `{sted}`,
 * `{ar}` og `{initial}` fylles ut fra innlogget bruker og nettleserposisjon i
 * `usePersonligTekst.ts`. Uten noen av delene faller de tilbake på de samme
 * plassholderne vi hadde før, så en utlogget kunde ser det samme som før.
 *
 * Skriftene må finnes i `graveringFonter` og symbolene i `designerSymbols`.
 */

export type MalKategori =
  | 'klassisk'
  | 'jul'
  | 'hoytid'
  | 'bursdag'
  | 'halloween'
  | 'kjaerlighet'
  | 'han'
  | 'henne'
  | 'minne'

export interface MotivMal {
  id: string
  navn: string
  beskrivelse: string
  kategori: MalKategori
  oppsett: OppsettId
  linjer: [string, string, string]
  font: string
  /** Symbol-id fra designerSymbols, eller null. */
  symbol: string | null
}

export const malKategorier: Array<{ id: MalKategori; navn: string }> = [
  { id: 'klassisk', navn: 'Klassisk' },
  { id: 'jul', navn: 'Jul' },
  { id: 'hoytid', navn: 'Høytider' },
  { id: 'bursdag', navn: 'Bursdag' },
  { id: 'halloween', navn: 'Halloween' },
  { id: 'kjaerlighet', navn: 'Kjærlighet' },
  { id: 'han', navn: 'Til han' },
  { id: 'henne', navn: 'Til henne' },
  { id: 'minne', navn: 'Til minne' },
]

export const motivMaler: MotivMal[] = [
  // --- Klassisk --------------------------------------------------------
  { id: 'navn', navn: 'Navn', beskrivelse: 'Ett navn, stort og rent', kategori: 'klassisk', oppsett: 'senter', linjer: ['{familie}', '', ''], font: 'Cormorant Garamond', symbol: null },
  { id: 'moderne', navn: 'Moderne', beskrivelse: 'Sperret versal mellom streker', kategori: 'klassisk', oppsett: 'linjer', linjer: ['{etternavn}', '{sted}', ''], font: 'Montserrat', symbol: null },
  { id: 'monogram', navn: 'Monogram', beskrivelse: 'Initial i ring, navn under', kategori: 'klassisk', oppsett: 'monogram', linjer: ['{initial}', '{familie}', ''], font: 'Playfair Display', symbol: null },
  { id: 'merke', navn: 'Hjørnemerke', beskrivelse: 'Diskret signatur i hjørnet', kategori: 'klassisk', oppsett: 'hjorne', linjer: ['{etternavn}', '{sted}', ''], font: 'Montserrat', symbol: null },
  { id: 'kjokken', navn: 'Kjøkkenet', beskrivelse: 'Venstrestilt, som en etikett', kategori: 'klassisk', oppsett: 'venstre', linjer: ['{fornavn}s kjøkken', '{sted}', ''], font: 'Montserrat', symbol: null },
  { id: 'hytte', navn: 'Hytta', beskrivelse: 'Hyttenavn med motiv', kategori: 'klassisk', oppsett: 'senter', linjer: ['Solheim', '{sted}', ''], font: 'Lora', symbol: 'tree' },
  { id: 'blank', navn: 'Blank', beskrivelse: 'Start fra bunnen', kategori: 'klassisk', oppsett: 'senter', linjer: ['', '', ''], font: 'Montserrat', symbol: null },

  // --- Jul -------------------------------------------------------------
  { id: 'god-jul', navn: 'God jul', beskrivelse: 'Hilsen med julestjerne', kategori: 'jul', oppsett: 'senter', linjer: ['God jul', '{familie}', ''], font: 'Cormorant Garamond', symbol: 'star-xmas' },
  { id: 'julegave', navn: 'Julegave', beskrivelse: 'Til noen, fra noen', kategori: 'jul', oppsett: 'senter', linjer: ['Til mormor', 'Jul {ar}', ''], font: 'Great Vibes', symbol: 'wreath-xmas' },
  { id: 'pepperkaker', navn: 'Pepperkaker', beskrivelse: 'Bakeriet på kjøkkenet', kategori: 'jul', oppsett: 'linjer', linjer: ['PEPPERKAKER', '{sted}', ''], font: 'Montserrat', symbol: 'gingerbread' },
  { id: 'julekjevle', navn: 'Julemønster', beskrivelse: 'Mønster rundt hele kjevla', kategori: 'jul', oppsett: 'monster', linjer: ['God jul', '', ''], font: 'Cormorant Garamond', symbol: 'gingerbread' },
  { id: 'julebord', navn: 'Julebord', beskrivelse: 'Årstall og anledning', kategori: 'jul', oppsett: 'linjer', linjer: ['JULEBORD', '{ar}', ''], font: 'Bebas Neue', symbol: 'bell-xmas' },
  { id: 'nissen', navn: 'Nissens verksted', beskrivelse: 'Til barna og kjøkkenet', kategori: 'jul', oppsett: 'senter', linjer: ['Nissens verksted', '{sted}', ''], font: 'Lora', symbol: 'santa-hat' },

  // --- Høytider --------------------------------------------------------
  { id: 'paske', navn: 'Påske', beskrivelse: 'God påske til hytta', kategori: 'hoytid', oppsett: 'senter', linjer: ['God påske', '{familie}', ''], font: 'Cormorant Garamond', symbol: 'rabbit' },
  { id: 'syttende-mai', navn: '17. mai', beskrivelse: 'Nasjonaldagen i versaler', kategori: 'hoytid', oppsett: 'linjer', linjer: ['17. MAI', '{ar}', ''], font: 'Bebas Neue', symbol: 'flag' },
  { id: 'konfirmasjon', navn: 'Konfirmasjon', beskrivelse: 'Navn og årstall', kategori: 'hoytid', oppsett: 'senter', linjer: ['Konfirmant', '{fornavn} · {ar}', ''], font: 'Playfair Display', symbol: 'star' },
  { id: 'dapen', navn: 'Dåp', beskrivelse: 'Den første gaven', kategori: 'hoytid', oppsett: 'senter', linjer: ['Til dåpen', '{fornavn} · {ar}', ''], font: 'Great Vibes', symbol: 'angel' },
  { id: 'innflytting', navn: 'Innflytting', beskrivelse: 'Nytt hjem, nytt kjøkken', kategori: 'hoytid', oppsett: 'linjer', linjer: ['NYTT HJEM', '{familie} · {ar}', ''], font: 'Montserrat', symbol: 'house' },
  { id: 'nyttar', navn: 'Nyttår', beskrivelse: 'Årstallet stort', kategori: 'hoytid', oppsett: 'linjer', linjer: ['GODT NYTTÅR', '{ar}', ''], font: 'Bebas Neue', symbol: 'star-4' },

  // --- Bursdag ---------------------------------------------------------
  { id: 'gratulerer', navn: 'Gratulerer', beskrivelse: 'Hilsen med kake', kategori: 'bursdag', oppsett: 'senter', linjer: ['Gratulerer med dagen', '{fornavn}', ''], font: 'Dancing Script', symbol: 'cake' },
  { id: 'runddag', navn: 'Runddag', beskrivelse: 'Tallet i ring, navn under', kategori: 'bursdag', oppsett: 'monogram', linjer: ['50', '{fornavn}', '{ar}'], font: 'Playfair Display', symbol: null },
  { id: 'bursdag-moderne', navn: 'Jubilanten', beskrivelse: 'Navn og alder i versaler', kategori: 'bursdag', oppsett: 'linjer', linjer: ['{fornavn}', '40 ÅR', ''], font: 'Bebas Neue', symbol: 'star' },
  { id: 'barnebursdag', navn: 'Barnebursdag', beskrivelse: 'Leken skrift til de minste', kategori: 'bursdag', oppsett: 'senter', linjer: ['{fornavn} 6 år', 'Hipp hurra', ''], font: 'Permanent Marker', symbol: 'cake' },
  { id: 'fodt', navn: 'Nyfødt', beskrivelse: 'Navn og fødselsår', kategori: 'bursdag', oppsett: 'senter', linjer: ['{fornavn}', 'Født {ar}', ''], font: 'Cormorant Garamond', symbol: 'heart' },

  // --- Halloween -------------------------------------------------------
  { id: 'halloween', navn: 'Halloween', beskrivelse: 'Gresskar og årstall', kategori: 'halloween', oppsett: 'linjer', linjer: ['HALLOWEEN', '{ar}', ''], font: 'Bebas Neue', symbol: 'pumpkin' },
  { id: 'trick-treat', navn: 'Trick or treat', beskrivelse: 'Til godteriskåla', kategori: 'halloween', oppsett: 'senter', linjer: ['Trick or treat', '{familie}', ''], font: 'Permanent Marker', symbol: 'ghost' },
  { id: 'heksekjokken', navn: 'Heksekjøkkenet', beskrivelse: 'Litt uhygge på kjøkkenet', kategori: 'halloween', oppsett: 'senter', linjer: ['Heksekjøkkenet', '{sted}', ''], font: 'Cormorant Garamond', symbol: 'witch-hat' },
  { id: 'halloween-monster', navn: 'Flaggermus', beskrivelse: 'Mønster rundt hele kjevla', kategori: 'halloween', oppsett: 'monster', linjer: ['Boo', '', ''], font: 'Permanent Marker', symbol: 'bat' },

  // --- Kjærlighet ------------------------------------------------------
  { id: 'bryllup', navn: 'Bryllup', beskrivelse: 'To navn og datoen', kategori: 'kjaerlighet', oppsett: 'senter', linjer: ['Ida & Jonas', '14. juni {ar}', ''], font: 'Great Vibes', symbol: 'heart' },
  { id: 'arsdag', navn: 'Årsdag', beskrivelse: 'Sammen siden', kategori: 'kjaerlighet', oppsett: 'linjer', linjer: ['SAMMEN SIDEN', '2019', ''], font: 'Cormorant Garamond', symbol: 'infinity' },
  { id: 'kjaerestemonogram', navn: 'To initialer', beskrivelse: 'Monogram for et par', kategori: 'kjaerlighet', oppsett: 'monogram', linjer: ['I & J', '{sted}', ''], font: 'Playfair Display', symbol: null },
  { id: 'elsker', navn: 'Jeg elsker deg', beskrivelse: 'Kort og enkelt', kategori: 'kjaerlighet', oppsett: 'senter', linjer: ['Jeg elsker deg', '{fornavn}', ''], font: 'Dancing Script', symbol: 'heart' },

  // --- Til han ---------------------------------------------------------
  { id: 'bryggeriet', navn: 'Bryggeriet', beskrivelse: 'Til ølbryggeren', kategori: 'han', oppsett: 'linjer', linjer: ['{etternavn}S BRYGGERI', 'EST. {ar}', ''], font: 'Bebas Neue', symbol: 'beer' },
  { id: 'verkstedet', navn: 'Verkstedet', beskrivelse: 'Til han som mekker', kategori: 'han', oppsett: 'venstre', linjer: ['{fornavn}s verksted', '{sted}', ''], font: 'Montserrat', symbol: 'wrench' },
  { id: 'garasjen', navn: 'Garasjen', beskrivelse: 'Skilt til garasjeveggen', kategori: 'han', oppsett: 'linjer', linjer: ['GARASJEN', '{fornavn}', ''], font: 'Bebas Neue', symbol: 'toolbox' },
  { id: 'grillmester', navn: 'Grillmesteren', beskrivelse: 'Til han ved grillen', kategori: 'han', oppsett: 'senter', linjer: ['Grillmesteren', '{fornavn}', ''], font: 'Montserrat', symbol: 'campfire' },
  { id: 'jaktlaget', navn: 'Jaktlaget', beskrivelse: 'Til jakta og hytta', kategori: 'han', oppsett: 'senter', linjer: ['Jaktlaget', '{sted}', ''], font: 'Lora', symbol: 'antlers' },
  { id: 'fisket', navn: 'Fiskelykke', beskrivelse: 'Til han som fisker', kategori: 'han', oppsett: 'senter', linjer: ['Fiskelykke', '{fornavn}', ''], font: 'Lora', symbol: 'fishing' },

  // --- Til henne -------------------------------------------------------
  { id: 'vinkvelden', navn: 'Vinkvelden', beskrivelse: 'Til ostefatet og vinen', kategori: 'henne', oppsett: 'senter', linjer: ['Vinkvelden', 'Hos {fornavn}', ''], font: 'Cormorant Garamond', symbol: 'wine' },
  { id: 'med-kjaerlighet', navn: 'Med kjærlighet', beskrivelse: 'Håndskrift og hjerte', kategori: 'henne', oppsett: 'senter', linjer: ['{fornavn}', 'Med kjærlighet', ''], font: 'Great Vibes', symbol: 'heart' },
  { id: 'gode-minner', navn: 'Gode minner', beskrivelse: 'Sted og år det skjedde', kategori: 'henne', oppsett: 'linjer', linjer: ['GODE MINNER', '{sted} · {ar}', ''], font: 'Lora', symbol: 'flower' },
  { id: 'kjokkensjefen', navn: 'Kjøkkensjefen', beskrivelse: 'Hennes kjøkken, hennes regler', kategori: 'henne', oppsett: 'venstre', linjer: ['{fornavn}s kjøkken', '{sted}', ''], font: 'Montserrat', symbol: 'utensils' },
  { id: 'blomstermonogram', navn: 'Blomstermonogram', beskrivelse: 'Initial i ring med blomst', kategori: 'henne', oppsett: 'monogram', linjer: ['{initial}', '{fornavn} {etternavn}', ''], font: 'Playfair Display', symbol: null },

  // --- Til minne -------------------------------------------------------
  { id: 'til-minne', navn: 'Til minne om', beskrivelse: 'Navn og årstall', kategori: 'minne', oppsett: 'senter', linjer: ['Til minne om', 'Kari Berg', '1948–{ar}'], font: 'Cormorant Garamond', symbol: 'candle' },
  { id: 'alltid-savnet', navn: 'Alltid savnet', beskrivelse: 'Kort hilsen, lett symbol', kategori: 'minne', oppsett: 'senter', linjer: ['Alltid savnet', 'Aldri glemt', ''], font: 'Cormorant Garamond', symbol: 'feather' },
  { id: 'minnestund', navn: 'Minnestund', beskrivelse: 'Sted og år', kategori: 'minne', oppsett: 'linjer', linjer: ['TIL MINNE', '{sted} · {ar}', ''], font: 'Lora', symbol: 'angel' },
  { id: 'minne-dyr', navn: 'Til minne om dyret', beskrivelse: 'Den som lå under bordet', kategori: 'minne', oppsett: 'senter', linjer: ['Til minne om', 'Bamse', '2012–{ar}'], font: 'Lora', symbol: 'paw' },
]
