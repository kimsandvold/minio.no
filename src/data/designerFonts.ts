export interface DesignerFont {
  family: string
  label: string
  google?: boolean
}

export const designerFonts: DesignerFont[] = [
  // Sans-serif
  { family: 'Inter', label: 'Inter', google: true },
  { family: 'Roboto', label: 'Roboto', google: true },
  { family: 'Open Sans', label: 'Open Sans', google: true },
  { family: 'Montserrat', label: 'Montserrat', google: true },
  { family: 'Poppins', label: 'Poppins', google: true },
  { family: 'Raleway', label: 'Raleway', google: true },
  { family: 'Oswald', label: 'Oswald', google: true },
  { family: 'Bebas Neue', label: 'Bebas Neue', google: true },
  { family: 'Anton', label: 'Anton', google: true },
  { family: 'Archivo Black', label: 'Archivo Black', google: true },
  { family: 'Rubik', label: 'Rubik', google: true },
  // Serif
  { family: 'Playfair Display', label: 'Playfair Display', google: true },
  { family: 'Merriweather', label: 'Merriweather', google: true },
  { family: 'Lora', label: 'Lora', google: true },
  { family: 'Cormorant Garamond', label: 'Cormorant Garamond', google: true },
  { family: 'Abril Fatface', label: 'Abril Fatface', google: true },
  // Display / decorative
  { family: 'Righteous', label: 'Righteous', google: true },
  { family: 'Passion One', label: 'Passion One', google: true },
  { family: 'Bungee', label: 'Bungee', google: true },
  { family: 'Fredoka', label: 'Fredoka', google: true },
  { family: 'Lobster', label: 'Lobster', google: true },
  { family: 'Pacifico', label: 'Pacifico', google: true },
  { family: 'Permanent Marker', label: 'Permanent Marker', google: true },
  { family: 'Satisfy', label: 'Satisfy', google: true },
  { family: 'Dancing Script', label: 'Dancing Script', google: true },
  { family: 'Great Vibes', label: 'Great Vibes', google: true },
  // Monospace / technical
  { family: 'Space Mono', label: 'Space Mono', google: true },
  { family: 'Courier Prime', label: 'Courier Prime', google: true },
  // Stencil / sign-like
  { family: 'Black Ops One', label: 'Black Ops One', google: true },
  { family: 'Russo One', label: 'Russo One', google: true },
]

let fontsLoaded = false

export function loadDesignerFonts(): void {
  if (fontsLoaded) return
  fontsLoaded = true

  const googleFonts = designerFonts
    .filter(f => f.google && f.family !== 'Inter')
    .map(f => `family=${f.family.replace(/ /g, '+')}:wght@400;700`)
    .join('&')

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${googleFonts}&display=swap`
  document.head.appendChild(link)
}
