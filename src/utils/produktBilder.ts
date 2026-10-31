/**
 * Produktbilder som har en nedskalert 640px-variant i /images/products/640/
 * (samme filnavn). Verdien er originalens bredde, til srcset-beskrivelsen.
 *
 * Produktkortene vises i ~180–400 CSS-px, men originalene er 1100–1500 px og
 * opptil 340 kB. Med srcset henter mobil den lille varianten (~40–110 kB).
 * Bilder som ikke står her, brukes som før – uten srcset – så et nytt bilde
 * uten variant aldri gir 404.
 *
 * Ny variant: skaler til 640 px bredde, WebP q80, og legg filen i 640/-mappa.
 */
const VARIANTER: Record<string, number> = {
  '/images/products/fire_wood_shed_1.webp': 1200,
  '/images/products/garbage_house_1.webp': 1200,
  '/images/products/garbage_house_2.webp': 1200,
  '/images/products/hundehus.webp': 1200,
  '/images/products/kattehus.webp': 1100,
  '/images/products/mail_box_2.webp': 1200,
  '/images/products/mail_box_3.webp': 1200,
  '/images/products/mail_box_stand_1.webp': 1024,
  '/images/products/pidestall_krakk_1.webp': 1200,
  '/images/products/pidestall_krakk_2.webp': 1200,
  '/images/products/plantekasser_1.webp': 1200,
  '/images/products/plantekasser_2.webp': 1086,
  '/images/products/plantekasser_3.webp': 1122,
  '/images/products/plantekasser_4.webp': 1122,
  '/images/products/varm_hus.webp': 1498,
  '/images/products/varm_hus_v3.webp': 864,
}

/** srcset for et produktbilde, eller undefined hvis det ikke har variant. */
export function produktSrcSet(src: string | undefined): string | undefined {
  if (!src) return undefined
  const bredde = VARIANTER[src]
  if (!bredde) return undefined
  const liten = src.replace('/images/products/', '/images/products/640/')
  return `${liten} 640w, ${src} ${bredde}w`
}
