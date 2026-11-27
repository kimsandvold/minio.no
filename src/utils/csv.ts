/**
 * CSV-bygging og nedlasting.
 *
 * Reglene er RFC 4180: felt som inneholder skilletegn, anførselstegn eller
 * linjeskift pakkes i anførselstegn, og anførselstegn inni dobles. Uten det
 * sprekker lista første gang noen heter «Hansen, Ola» – og det er ikke noe
 * man oppdager før importen til Brevo har lagt navnet i feil kolonne.
 */

/** Ett felt, klart til å stå i en CSV-linje. */
function felt(verdi: unknown, skille: string): string {
  const s = verdi == null ? '' : String(verdi)
  return s.includes(skille) || s.includes('"') || /[\r\n]/.test(s)
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

/**
 * Bygger en CSV-streng av en overskriftsrad og dataradene.
 *
 * Linjeskiftet er CRLF, slik RFC-en og Excel vil ha det.
 */
export function byggCsv(
  overskrifter: string[],
  rader: Array<Array<string | number | undefined>>,
  skille = ',',
): string {
  return [overskrifter, ...rader]
    .map((rad) => rad.map((v) => felt(v, skille)).join(skille))
    .join('\r\n')
}

/**
 * Laster ned en CSV-fil.
 *
 * BOM-en foran er ikke pynt: uten den leser Excel UTF-8 som Windows-1252, og
 * «Søgne» blir «SÃ¸gne». Brevo leser BOM-en riktig.
 */
export function lastNedCsv(filnavn: string, innhold: string): void {
  const blob = new Blob(['﻿' + innhold], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filnavn.endsWith('.csv') ? filnavn : `${filnavn}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** `2026-11-27` – til filnavn, så nedlastingene sorterer seg selv. */
export function datostempel(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
