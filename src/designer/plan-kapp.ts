/**
 * Kappeplan – hvilke standardlengder du bør kjøpe, og hva du kapper av hver.
 *
 * Norsk trelast selges i lengder med 30 cm sprang (typisk 2,4–5,4 m, enkelte
 * dimensjoner til 6,0 m). Delene pakkes med «best fit decreasing» og
 * sagsnitt-tillegg, og hver planke krympes til korteste lengde som rommer
 * kappene. Gir et konkret innkjøp med svinn, i stedet for bare løpemeter.
 */

export interface KappBehov {
  profil: string
  pos: string
  lengdeMm: number
  antall: number
}

export interface Planke {
  lager: number
  kutt: Array<{ pos: string; lengdeMm: number }>
  rest: number
}

export interface KappeplanProfil {
  profil: string
  /** Like planker slått sammen. */
  grupper: Array<{ lager: number; antall: number; kutt: Array<{ pos: string; lengdeMm: number }>; rest: number }>
  antallPlanker: number
  kjoptLm: number
  nettoLm: number
  svinnPst: number
  /** Deler lengre enn lengste lagerlengde (må skjøtes/bestilles). */
  forLange: Array<{ pos: string; lengdeMm: number; antall: number }>
}

export const LAGERLENGDER = [2400, 2700, 3000, 3300, 3600, 3900, 4200, 4500, 4800, 5100, 5400, 5700, 6000]
const SAGSNITT = 4
const ENDEKAPP = 10 // rett opp en ende før første kapp

export function normalProfil(p: string): string {
  const m = p.match(/(\d+(?:[.,]\d+)?)\s*[×xX]\s*(\d+(?:[.,]\d+)?)/)
  if (!m) return p.trim()
  const a = Number(m[1].replace(',', '.'))
  const b = Number(m[2].replace(',', '.'))
  return `${Math.min(a, b)}×${Math.max(a, b)}`
}

export function lagKappeplan(behov: KappBehov[]): KappeplanProfil[] {
  const perProfil = new Map<string, KappBehov[]>()
  for (const b of behov) {
    if (!(b.lengdeMm > 0) || !(b.antall > 0)) continue
    const k = normalProfil(b.profil)
    if (!/×/.test(k)) continue
    const l = perProfil.get(k) ?? []
    l.push(b)
    perProfil.set(k, l)
  }
  const maks = LAGERLENGDER[LAGERLENGDER.length - 1]
  const ut: KappeplanProfil[] = []
  for (const [profil, liste] of perProfil) {
    const stykker: Array<{ pos: string; lengdeMm: number }> = []
    const forLange: KappeplanProfil['forLange'] = []
    for (const b of liste) {
      if (b.lengdeMm + ENDEKAPP > maks) { forLange.push({ pos: b.pos, lengdeMm: b.lengdeMm, antall: b.antall }); continue }
      for (let i = 0; i < b.antall; i++) stykker.push({ pos: b.pos, lengdeMm: b.lengdeMm })
    }
    stykker.sort((a, b) => b.lengdeMm - a.lengdeMm)
    const planker: Planke[] = []
    for (const s of stykker) {
      const behovMm = s.lengdeMm + SAGSNITT
      // Best fit: planken med minst restplass som fortsatt rommer stykket.
      let best: Planke | null = null
      for (const p of planker) if (p.rest >= behovMm && (!best || p.rest < best.rest)) best = p
      if (best) {
        best.kutt.push(s)
        best.rest -= behovMm
      } else {
        planker.push({ lager: maks, kutt: [s], rest: maks - ENDEKAPP - behovMm })
      }
    }
    // Krymp hver planke til korteste lagerlengde som rommer kappene.
    for (const p of planker) {
      const brukt = maks - p.rest
      const L = LAGERLENGDER.find((l) => l >= brukt) ?? maks
      p.rest = L - brukt
      p.lager = L
    }
    const grupper = new Map<string, KappeplanProfil['grupper'][number]>()
    for (const p of planker) {
      const k = `${p.lager}|${p.kutt.map((c) => `${c.pos}${c.lengdeMm}`).join(',')}`
      const g = grupper.get(k)
      if (g) g.antall++
      else grupper.set(k, { lager: p.lager, antall: 1, kutt: p.kutt, rest: p.rest })
    }
    const kjopt = planker.reduce((s, p) => s + p.lager, 0)
    const netto = stykker.reduce((s, p) => s + p.lengdeMm, 0)
    ut.push({
      profil,
      grupper: [...grupper.values()].sort((a, b) => b.lager - a.lager || b.antall - a.antall),
      antallPlanker: planker.length,
      kjoptLm: kjopt / 1000,
      nettoLm: netto / 1000,
      svinnPst: kjopt > 0 ? ((kjopt - netto) / kjopt) * 100 : 0,
      forLange,
    })
  }
  return ut.sort((a, b) => a.profil.localeCompare(b.profil, 'nb', { numeric: true }))
}
