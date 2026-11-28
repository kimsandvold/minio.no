import { SIDE } from './nyhetsbrevHtml'

/**
 * Bygger bildene inn i brevet før det kopieres til Mail.
 *
 * Lenkede bilder (https://minio.no/…) viste seg å bli «?» når brevet ble
 * limt inn i Mail, og de vises heller ikke hos mottakere som blokkerer
 * eksterne bilder – som er standard mange steder. Innebygde bilder (data-URI)
 * gjør Mail om til vedlegg i selve e-posten ved innliming, så logoen og
 * bildene følger med brevet uansett.
 *
 * Samtidig gjøres tre ting som ellers ville vært opp til mottakerens klient:
 *   - Beskjæring. aspect-ratio/object-fit støttes ikke av Gmail og Outlook,
 *     så utsnittet bakes inn i selve bildet og stilene fjernes.
 *   - Format. WebP vises ikke i Outlook; bildene blir JPEG (logoen PNG, for
 *     gjennomsiktigheten).
 *   - Størrelse. Dobbel visningsbredde for skarphet på Retina, ikke mer –
 *     originalene er opptil 2400 px og ville gjort brevet flere MB.
 */

/** Minio-bilder hentes fra samme opprinnelse som admin – ingen CORS. */
function lokalSti(src: string): string {
  return src.startsWith(SIDE + '/') ? src.slice(SIDE.length) : src
}

function lastBilde(url: string): Promise<HTMLImageElement> {
  return new Promise((ok, feil) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => ok(img)
    img.onerror = () => feil(new Error(`Kunne ikke laste ${url}`))
    img.src = url
  })
}

function lesFormat(stil: string): number | null {
  const m = stil.match(/aspect-ratio:\s*([\d.]+)\s*\/\s*([\d.]+)/)
  return m ? Number(m[1]) / Number(m[2]) : null
}

async function bakInn(el: HTMLImageElement): Promise<void> {
  const src = el.getAttribute('src') ?? ''
  if (!src || src.startsWith('data:')) return
  const bilde = await lastBilde(lokalSti(src))

  const visning = Number(el.getAttribute('width')) || bilde.naturalWidth
  const stil = el.getAttribute('style') ?? ''
  const format = lesFormat(stil)

  // Utsnittet: midt i bildet, i ønsket format (object-fit: cover).
  let sx = 0
  let sy = 0
  let sb = bilde.naturalWidth
  let sh = bilde.naturalHeight
  if (format) {
    if (sb / sh > format) {
      sb = sh * format
      sx = (bilde.naturalWidth - sb) / 2
    } else {
      sh = sb / format
      sy = (bilde.naturalHeight - sh) / 2
    }
  }

  const bredde = Math.min(Math.round(visning * 2), Math.round(sb))
  const hoyde = Math.round(bredde * (sh / sb))
  const lerret = document.createElement('canvas')
  lerret.width = bredde
  lerret.height = hoyde
  const ctx = lerret.getContext('2d')
  if (!ctx) return
  const png = /\.png($|\?)/i.test(src)
  if (!png) {
    // JPEG har ingen gjennomsiktighet; hvit bunn i stedet for svart.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, bredde, hoyde)
  }
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bilde, sx, sy, sb, sh, 0, 0, bredde, hoyde)

  el.setAttribute('src', lerret.toDataURL(png ? 'image/png' : 'image/jpeg', 0.84))
  el.setAttribute('height', String(Math.round(visning * (sh / sb))))
  el.setAttribute('style', stil.replace(/aspect-ratio:[^;]+;?/, '').replace(/object-fit:[^;]+;?/, ''))
}

/**
 * Returnerer HTML-en med alle bilder innebygd. Et bilde som ikke lar seg
 * hente (ekstern adresse uten CORS) beholder lenken – brevet kopieres
 * fortsatt, og `feilet` sier hvor mange det gjaldt.
 */
export async function medInnebygdeBilder(html: string): Promise<{ html: string; feilet: number }> {
  const dok = new DOMParser().parseFromString(`<div id="rot">${html}</div>`, 'text/html')
  const bilder = [...dok.querySelectorAll('img')]
  const resultat = await Promise.allSettled(bilder.map(bakInn))
  return {
    html: dok.getElementById('rot')!.innerHTML,
    feilet: resultat.filter((r) => r.status === 'rejected').length,
  }
}
