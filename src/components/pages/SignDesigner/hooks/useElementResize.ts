import { useState, useCallback, useEffect } from 'react'
import type { DesignElement, DesignerAction, Point } from '../../../../types/design'

interface ResizeState {
  elementId: string
  corner: string
  startMouse: Point
  startBounds: { x: number; y: number; width: number; height: number; x2?: number; y2?: number }
}

export function useElementResize(
  dispatch: React.Dispatch<DesignerAction>,
  elements: DesignElement[],
  screenToSvg: (x: number, y: number) => Point,
) {
  const [resize, setResize] = useState<ResizeState | null>(null)

  const startResize = useCallback((elementId: string, corner: string, screenPoint: Point) => {
    const el = elements.find(e => e.id === elementId)
    if (!el) return
    const svgPt = screenToSvg(screenPoint.x, screenPoint.y)
    setResize({
      elementId,
      corner,
      startMouse: svgPt,
      startBounds: {
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        x2: el.type === 'line' ? el.x2 : undefined,
        y2: el.type === 'line' ? el.y2 : undefined,
      },
    })
  }, [elements, screenToSvg])

  useEffect(() => {
    if (!resize) return

    const handleMove = (e: MouseEvent) => {
      const svgPt = screenToSvg(e.clientX, e.clientY)
      const dx = svgPt.x - resize.startMouse.x
      const dy = svgPt.y - resize.startMouse.y
      const b = resize.startBounds

      if (resize.corner === 'line-start') {
        dispatch({ type: 'UPDATE_ELEMENT', id: resize.elementId, changes: { x: b.x + dx, y: b.y + dy } })
        return
      }
      if (resize.corner === 'line-end') {
        dispatch({ type: 'UPDATE_ELEMENT', id: resize.elementId, changes: { x2: (b.x2 ?? 0) + dx, y2: (b.y2 ?? 0) + dy } })
        return
      }

      let newX = b.x, newY = b.y, newW = b.width, newH = b.height

      switch (resize.corner) {
        case 'se':
          newW = Math.max(5, b.width + dx)
          newH = Math.max(5, b.height + dy)
          break
        case 'sw':
          newX = b.x + dx
          newW = Math.max(5, b.width - dx)
          newH = Math.max(5, b.height + dy)
          break
        case 'ne':
          newY = b.y + dy
          newW = Math.max(5, b.width + dx)
          newH = Math.max(5, b.height - dy)
          break
        case 'nw':
          newX = b.x + dx
          newY = b.y + dy
          newW = Math.max(5, b.width - dx)
          newH = Math.max(5, b.height - dy)
          break
      }

      dispatch({
        type: 'UPDATE_ELEMENT',
        id: resize.elementId,
        changes: { x: newX, y: newY, width: newW, height: newH },
      })
    }

    const handleUp = () => setResize(null)

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [resize, dispatch, screenToSvg])

  return { isResizing: resize !== null, startResize }
}
