import { useState, useCallback, useEffect } from 'react'
import type { DesignElement, DesignerAction, Point } from '../../../../types/design'

interface ResizeState {
  elementId: string
  corner: string
  startMouse: Point
  startBounds: { x: number; y: number; width: number; height: number; x2?: number; y2?: number; fontSize?: number; elementType?: string; text?: string; fontWeight?: number; fontFamily?: string }
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
        fontSize: el.type === 'text' ? el.fontSize : undefined,
        text: el.type === 'text' ? el.text : undefined,
        fontWeight: el.type === 'text' ? el.fontWeight : undefined,
        fontFamily: el.type === 'text' ? el.fontFamily : undefined,
        elementType: el.type,
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

      const changes: Record<string, number> = { x: newX, y: newY, width: newW, height: newH }

      if (b.elementType === 'text' && b.fontSize && b.text) {
        const scale = newH / b.height
        const newFontSize = Math.max(4, Math.round(b.fontSize * scale))
        changes.fontSize = newFontSize

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        ctx.font = `${b.fontWeight ?? 400} ${newFontSize}px ${b.fontFamily ?? 'Inter'}`
        const measuredWidth = ctx.measureText(b.text).width + newFontSize * 0.5
        changes.width = Math.max(measuredWidth, 20)
        changes.height = newFontSize * 1.25
      }

      dispatch({
        type: 'UPDATE_ELEMENT',
        id: resize.elementId,
        changes,
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
