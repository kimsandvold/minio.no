/** «Varmepumpehus – tilpasset ditt hjem» → «Varmepumpehus». */
export function kortNavn(tittel: string) {
  return tittel.split(' – ')[0]
}

/** «Pris fra 3490,-» → «fra 3 490 kr». Faller tilbake på originalteksten. */
export function kortPris(pris: string) {
  const tall = pris.match(/\d[\d\s]*/)?.[0].replace(/\s/g, '')
  return tall ? `fra ${Number(tall).toLocaleString('nb-NO')} kr` : pris
}
