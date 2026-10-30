/**
 * Minimal typedeklarasjon for opentype.js (pakken leverer ingen selv).
 * Bare det graveringseksporten faktisk bruker er beskrevet her – se
 * `src/components/pages/Gravering/graveringSvg.ts`.
 */
declare module 'opentype.js' {
  export interface PathKommando {
    type: 'M' | 'L' | 'C' | 'Q' | 'Z'
    x?: number
    y?: number
    x1?: number
    y1?: number
    x2?: number
    y2?: number
  }

  export interface Path {
    commands: PathKommando[]
    toPathData(desimaler?: number): string
  }

  export interface Glyph {
    advanceWidth?: number
    /** Glyfens kontur i fontenheter, med y-aksen opp. */
    path: Path
    getPath(x: number, y: number, fontSize: number): Path
  }

  export interface Font {
    unitsPerEm: number
    /** Slår opp ett tegn direkte i cmap, uten GSUB-erstatninger. */
    charToGlyph(tegn: string): Glyph
    getKerningValue(venstre: Glyph, hoyre: Glyph): number
  }

  export function parse(buffer: ArrayBuffer): Font
}
