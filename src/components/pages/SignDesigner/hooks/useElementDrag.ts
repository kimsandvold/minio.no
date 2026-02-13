import { useState, useCallback, useEffect } from 'react'
import type { DesignElement, DesignerAction, Point } from '../../../../types/design'

interface DragState {
  elementId: string
  startMouse: Point
  startPos: Point
}

export function useElementDrag(
  dispatch: React.Dispatch<DesignerAction>,
  elements: DesignElement[],
  screenToSvg: (x: number, y: number) => Point,
) {
  const [drag, setDrag] = useState<DragState | null>(null)

  const startDrag = useCallback((elementId: string, e: React.MouseEvent) => {
    const el = elements.find(el => el.id === elementId)
    if (!el) return
    const svgPt = screenToSvg(e.clientX, e.clientY)
    setDrag({
      elementId,
      startMouse: svgPt,
      startPos: { x: el.x, y: el.y },
    })
  }, [elements, screenToSvg])

  useEffect(() => {
    if (!drag) return

    const handleMove = (e: MouseEvent) => {
      const svgPt = screenToSvg(e.clientX, e.clientY)
      const dx = svgPt.x - drag.startMouse.x
      const dy = svgPt.y - drag.startMouse.y

      const el = elements.find(el => el.id === drag.elementId)
      if (!el) return

      if (el.type === 'line') {
        const origEl = el
        dispatch({
          type: 'UPDATE_ELEMENT',
          id: drag.elementId,
          changes: {
            x: drag.startPos.x + dx,
            y: drag.startPos.y + dy,
            x2: origEl.x2 + (drag.startPos.x + dx - origEl.x),
            y2: origEl.y2 + (drag.startPos.y + dy - origEl.y),
          },
        })
      } else {
        dispatch({
          type: 'UPDATE_ELEMENT',
          id: drag.elementId,
          changes: {
            x: drag.startPos.x + dx,
            y: drag.startPos.y + dy,
          },
        })
      }
    }

    const handleUp = () => setDrag(null)

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [drag, dispatch, screenToSvg, elements])

  return { isDragging: drag !== null, startDrag }
}
