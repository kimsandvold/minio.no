import type { DesignerSymbol } from '../../../data/designerSymbols'

/**
 * Søk i symbolbiblioteket.
 *
 * To ting gjør et symbolsøk brukbart på norsk:
 *
 * 1. NORMALISERING. Symbolnavnene i `designerSymbols` er skrevet uten norske
 *    tegn («Ol», «Snofnugg», «Lovtre»), mens folk skriver «øl», «snøfnugg» og
 *    «løvtre». Begge sider strippes derfor for diakritiske tegn før de
 *    sammenliknes.
 * 2. SYNONYMER. Folk søker etter anledningen, ikke tegningen: «bursdag» skal
 *    finne kaka, «mekk» skiftenøkkelen, «begravelse» lyset. Kartet under er
 *    søkeord vi legger PÅ TOPPEN av navnet og kategorien.
 */

const SYNONYMER: Record<string, string> = {
  heart: 'kjærlighet elsker love hjerte valentin bryllup',
  infinity: 'evig uendelig kjærlighet sammen',
  star: 'stjerne favoritt',
  'star-4': 'stjerne glitter nyttår',
  'star-6': 'stjerne nyttår',
  crown: 'konge dronning krone bursdag',
  ribbon: 'sløyfe gave',
  cake: 'bursdag kake feiring konfirmasjon',
  beer: 'øl pils pub bryggeri mann',
  wine: 'vin glass vinkveld fest',
  coffee: 'kaffe kopp morgen',
  bread: 'brød baking surdeig',
  cheese: 'ost ostefat',
  utensils: 'bestikk kjøkken mat kokk',
  apple: 'eple frukt',
  wrench: 'skiftenøkkel mekk verksted bil garasje',
  toolbox: 'verktøykasse verksted garasje bil mekk',
  bolt: 'bolt mutter skrue mekk bil',
  hammer: 'hammer snekker bygg',
  saw: 'sag snekker bygg',
  drill: 'drill bore verksted',
  axe: 'øks ved hogst',
  paw: 'pote hund katt dyr kjæledyr minne',
  deer: 'hjort dyr skog',
  elk: 'elg jakt dyr',
  antlers: 'gevir jakt elg hjort',
  fishing: 'fiske fisketur stang',
  fish: 'fisk fiske',
  tree: 'gran skog jul tre',
  pine: 'furu skog tre',
  'deciduous-tree': 'løvtre tre skog',
  mountain: 'fjell tur topptur',
  flower: 'blomst hage vår',
  leaf: 'blad høst natur',
  snowflake: 'snøfnugg vinter jul snø',
  sun: 'sol sommer',
  moon: 'måne natt',
  wave: 'bølge sjø hav',
  house: 'hus hjem innflytting',
  cabin: 'hytte fjellet',
  key: 'nøkkel innflytting nytt hjem',
  mailbox: 'postkasse adresse',
  candle: 'lys minne begravelse sorg advent',
  feather: 'fjær minne sorg lett',
  bell: 'bjelle klokke',
  wreath: 'krans dør',
  gift: 'gave presang bursdag',
  trophy: 'pokal vinner premie',
  compass: 'kompass tur retning',
  anchor: 'anker sjø båt',
  'music-note': 'note musikk sang',
  campfire: 'bål grill leirbål kos',
  tent: 'telt tur camping',
  ski: 'ski vinter skitur',
  bicycle: 'sykkel tur',
  kayak: 'kajakk padle',
  hiking: 'fottur tur fjell',
  snowboard: 'snowboard vinter',
  pumpkin: 'gresskar halloween',
  ghost: 'spøkelse halloween',
  bat: 'flaggermus halloween',
  spider: 'edderkopp halloween',
  skull: 'hodeskalle halloween',
  'witch-hat': 'heks halloween',
  cauldron: 'gryte heks halloween',
  'christmas-tree': 'juletre jul',
  'santa-hat': 'nisselue jul nisse',
  gingerbread: 'pepperkake jul baking kjevle',
  'candy-cane': 'sukkerstang jul',
  snowman: 'snømann jul vinter',
  stocking: 'julestrømpe jul',
  ornament: 'julekule jul',
  reindeer: 'reinsdyr jul',
  'wreath-xmas': 'julekrans jul advent',
  'gift-xmas': 'julegave jul',
  sleigh: 'slede jul kane',
  'star-xmas': 'julestjerne jul advent',
  angel: 'engel jul minne dåp',
  'bell-xmas': 'juleklokke jul',
  rabbit: 'kanin påske hare',
  bird: 'fugl natur',
  butterfly: 'sommerfugl natur',
  horse: 'hest ridning',
  cat: 'katt kjæledyr',
  dog: 'hund kjæledyr jakt',
  bear: 'bjørn villmark',
  owl: 'ugle natt skog',
  fox: 'rev skog',
  palette: 'palett kunst maling',
  camera: 'kamera foto minner',
  yarn: 'garn strikk håndarbeid',
  plank: 'planke trearbeid snekker',
  workbench: 'høvelbenk snekker verksted',
  'wood-grain': 'treåre trearbeid',
}

/** Små bokstaver uten norske særtegn, så «Ol» og «øl» møtes på midten. */
export function normaliser(tekst: string): string {
  return tekst
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø|ö/g, 'o')
    .replace(/å|ä/g, 'a')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

/** Alt som er søkbart for ett symbol: navn, id, kategori og synonymer. */
function sokeord(symbol: DesignerSymbol): string {
  return normaliser(`${symbol.name} ${symbol.id} ${symbol.category} ${SYNONYMER[symbol.id] ?? ''}`)
}

/**
 * Filtrerer og rangerer symbolene. Navnetreff først, så synonymtreff – et søk
 * på «jul» skal gi juletreet før grana.
 */
export function sokSymboler(
  symboler: DesignerSymbol[],
  sok: string,
  kategori: string | null,
): DesignerSymbol[] {
  const innenfor = kategori ? symboler.filter((s) => s.category === kategori) : symboler
  const q = normaliser(sok)
  if (!q) return innenfor

  const ord = q.split(/\s+/).filter(Boolean)

  /**
   * Treff på ORDSTART, ikke hvor som helst i teksten. Et fritt delstrengsøk ga
   * «Sol», «Bølge» og «Skjold» på søket «øl», fordi «ol» står inne i dem alle.
   * Delstreng tillates bare for ord på fire tegn eller mer, der tilfeldige
   * treff er sjeldne og folk gjerne skriver halve ordet.
   */
  const treffer = (felt: string[], term: string): boolean =>
    felt.some((o) => o.startsWith(term)) || (term.length >= 4 && felt.some((o) => o.includes(term)))

  return innenfor
    .map((symbol) => {
      const navnord = normaliser(symbol.name).split(/[\s-]+/).filter(Boolean)
      const alleord = sokeord(symbol).split(/[\s-]+/).filter(Boolean)
      if (!ord.every((term) => treffer(alleord, term))) return null
      const poeng = normaliser(symbol.name).startsWith(q) ? 0 : treffer(navnord, q) ? 1 : 2
      return { symbol, poeng }
    })
    .filter((t): t is { symbol: DesignerSymbol; poeng: number } => t !== null)
    .sort((a, b) => a.poeng - b.poeng)
    .map((t) => t.symbol)
}
