import { FARGER, TRESLAG } from './materials'
import type { DesignConfig, PartMaterial, ProductTemplate } from './types'

/**
 * Lesbar liste over ALT kunden har valgt i designverktøyet – samme etiketter
 * og verdier som sidepanelet viser. Brukes i forespørsler (e-post + admin) så
 * verkstedet kan gjenskape designet uten å gjette; `bom.sammendrag` alene er
 * bare én linje og mangler de fleste valgene.
 */
export function konfigTekst(
  template: ProductTemplate,
  cfg: DesignConfig,
  overrides: Record<string, PartMaterial> = {},
): string {
  const linjer: string[] = []
  const valgNavn = (choices: Array<{ id: string; label: string }>, v: unknown) =>
    choices.find((c) => c.id === v)?.label ?? String(v ?? '–')

  if (template.former) linjer.push(`${template.former.label}: ${valgNavn(template.former.choices, cfg[template.former.key])}`)
  for (const d of template.dimensjoner) {
    if (d.visibleWhen && !d.visibleWhen(cfg)) continue
    linjer.push(`${d.label}: ${cfg[d.key]} ${d.unit ?? 'cm'}`)
  }
  for (const a of template.alternativer ?? []) {
    if (a.visibleWhen && !a.visibleWhen(cfg)) continue
    linjer.push(`${a.label}: ${valgNavn(a.choices, cfg[a.key])}`)
  }
  for (const t of template.valg ?? []) linjer.push(`${t.label}: ${cfg[t.key] ? 'Ja' : 'Nei'}`)
  for (const m of template.materialer) linjer.push(`${m.label}: ${valgNavn(m.choices, cfg[m.key])}`)

  // Deler kunden har malt/byttet treslag på (paint bucket).
  for (const [del, mat] of Object.entries(overrides)) {
    const navn = template.parts?.find((p) => p.key === del)?.label ?? del
    const deler = [
      mat.treslag && (TRESLAG[mat.treslag]?.label ?? mat.treslag),
      mat.farge && (FARGER[mat.farge]?.label ?? mat.farge),
    ].filter(Boolean)
    if (deler.length) linjer.push(`${navn} (egen farge/treslag): ${deler.join(', ')}`)
  }
  return linjer.join('\n')
}
