import { useCallback, useRef } from 'react'
import type { Point } from '../../../../types/design'

export function useCanvasInteraction(svgRef: React.RefObject<SVGSVGElement | null>) {
  const ctmRef = useRef<DOMMatrix | null>(null)

  const screenToSvg = useCallback((screenX: number, screenY: number): Point => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }

    if (!ctmRef.current) {
      ctmRef.current = svg.getScreenCTM()?.inverse() ?? null
    }
    const pt = svg.createSVGPoint()
    pt.x = screenX
    pt.y = screenY
    const svgPt = pt.matrixTransform(ctmRef.current!)
    return { x: svgPt.x, y: svgPt.y }
  }, [svgRef])

  const invalidateCTM = useCallback(() => {
    ctmRef.current = null
  }, [])

  return { screenToSvg, invalidateCTM }
}
