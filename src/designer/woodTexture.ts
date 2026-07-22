import * as THREE from 'three'

/**
 * Genererer en prosedural trestruktur (canvas) som lyst grunnlag med årer.
 * Teksturen er lys/nøytral slik at materialets `color` kan tinte den til
 * riktig treslag/farge via multiplikasjon (map × color).
 */
export function makeWoodTexture(): THREE.CanvasTexture {
  const size = 512
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!

  // Lyst grunnlag.
  ctx.fillStyle = '#efe8dc'
  ctx.fillRect(0, 0, size, size)

  // Loddrette årer med lett bølge.
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * size
    const w = 0.4 + Math.random() * 2.4
    const a = 0.02 + Math.random() * 0.11
    ctx.strokeStyle = `rgba(96, 64, 33, ${a})`
    ctx.lineWidth = w
    ctx.beginPath()
    let px = x
    ctx.moveTo(px, 0)
    for (let y = 0; y <= size; y += 14) {
      px += (Math.random() - 0.5) * 3.5
      ctx.lineTo(px, y)
    }
    ctx.stroke()
  }

  // Brede tonebånd for dybde.
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * size
    ctx.fillStyle = `rgba(120, 88, 52, ${0.02 + Math.random() * 0.03})`
    ctx.fillRect(x, 0, 8 + Math.random() * 26, size)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 2)
  tex.anisotropy = 4
  return tex
}
