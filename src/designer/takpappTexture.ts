import * as THREE from 'three'

/**
 * Prosedural takpapp-/asfaltbelegg-tekstur: svart tjæregrunnlag strødd med
 * små grå steiner (granulat), slik ekte takpapp/shingel ser ut. Leses samlet
 * som mørk grå. Samme canvas brukes som fargekart og som bump for lett relieff.
 */
function drawTakpapp(): HTMLCanvasElement {
  const size = 512
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!

  // Svart tjæregrunnlag.
  ctx.fillStyle = '#1a1a1d'
  ctx.fillRect(0, 0, size, size)

  // Små steiner/granulat i grå toner – tett strødd.
  const grays = ['#3a3a3e', '#4a4a4f', '#5c5c62', '#6e6e74', '#818187', '#96969c']
  const grains = 26000
  for (let i = 0; i < grains; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 0.6 + Math.random() * 1.6
    ctx.fillStyle = grays[(Math.random() * grays.length) | 0]
    ctx.globalAlpha = 0.55 + Math.random() * 0.45
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  return c
}

let cached: { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } | null = null

/** Tekstur (map + bump) for takpapp – bygges én gang og gjenbrukes. */
export function takpappTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  if (cached) return cached
  const canvas = drawTakpapp()
  const map = new THREE.CanvasTexture(canvas)
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.repeat.set(2.5, 2.5)
  map.anisotropy = 4
  const bump = new THREE.CanvasTexture(canvas)
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping
  bump.repeat.set(2.5, 2.5)
  cached = { map, bump }
  return cached
}
