import { useState, useCallback, useEffect } from 'react'
import type { DesignElement, DesignerAction, Point } from '../../../../types/design'

const SNAP_THRESHOLD = 5

interface DragState {
  elementId: string
  startMouse: Point
  startPos: Point
  startX2?: number
  startY2?: number
}

export interface SnapGuides {
  horizontal: boolean
  vertical: boolean
}

export function useElementDrag(
  dispatch: React.Dispatch<DesignerAction>,
  elements: DesignElement[],
  screenToSvg: (x: number, y: number) => Point,
  canvasWidth = 700,
  canvasHeight = 500,
) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const [snapGuides, setSnapGuides] = useState<SnapGuides>({ horizontal: false, vertical: false })

  const startDrag = useCallback((elementId: string, e: React.PointerEvent) => {
    const el = elements.find(el => el.id === elementId)
    if (!el) return
    const svgPt = screenToSvg(e.clientX, e.clientY)
    setDrag({
      elementId,
      startMouse: svgPt,
      startPos: { x: el.x, y: el.y },
      startX2: el.type === 'line' ? el.x2 : undefined,
      startY2: el.type === 'line' ? el.y2 : undefined,
    })
  }, [elements, screenToSvg])

  useEffect(() => {
    if (!drag) {
      setSnapGuides({ horizontal: false, vertical: false })
      return
    }

    const handleMove = (e: PointerEvent) => {
      const svgPt = screenToSvg(e.clientX, e.clientY)
      const dx = svgPt.x - drag.startMouse.x
      const dy = svgPt.y - drag.startMouse.y

      const el = elements.find(el => el.id === drag.elementId)
      if (!el) return

      let newX = drag.startPos.x + dx
      let newY = drag.startPos.y + dy

      const canvasCenterX = canvasWidth / 2
      const canvasCenterY = canvasHeight / 2

      let snappedH = false
      let snappedV = false

      if (el.type === 'line' && drag.startX2 !== undefined && drag.startY2 !== undefined) {
        const newX2 = drag.startX2 + dx
        const newY2 = drag.startY2 + dy
        // Snap line midpoint to center
        const midX = (newX + newX2) / 2
        const midY = (newY + newY2) / 2

        if (Math.abs(midX - canvasCenterX) < SNAP_THRESHOLD) {
          const snapDx = canvasCenterX - midX
          newX += snapDx
          snappedV = true
          dispatch({
            type: 'UPDATE_ELEMENT',
            id: drag.elementId,
            changes: { x: newX, y: newY, x2: newX2 + snapDx, y2: newY2 },
          })
        } else if (Math.abs(midY - canvasCenterY) < SNAP_THRESHOLD) {
          const snapDy = canvasCenterY - midY
          newY += snapDy
          snappedH = true
          dispatch({
            type: 'UPDATE_ELEMENT',
            id: drag.elementId,
            changes: { x: newX, y: newY, x2: newX2, y2: newY2 + snapDy },
          })
        } else {
          dispatch({
            type: 'UPDATE_ELEMENT',
            id: drag.elementId,
            changes: { x: newX, y: newY, x2: newX2, y2: newY2 },
          })
        }
      } else {
        // Element center
        const elCenterX = newX + el.width / 2
        const elCenterY = newY + el.height / 2

        if (Math.abs(elCenterX - canvasCenterX) < SNAP_THRESHOLD) {
          newX = canvasCenterX - el.width / 2
          snappedV = true
        }
        if (Math.abs(elCenterY - canvasCenterY) < SNAP_THRESHOLD) {
          newY = canvasCenterY - el.height / 2
          snappedH = true
        }

        dispatch({
          type: 'UPDATE_ELEMENT',
          id: drag.elementId,
          changes: { x: newX, y: newY },
        })
      }

      setSnapGuides({ horizontal: snappedH, vertical: snappedV })
    }

    const handleUp = () => {
      setDrag(null)
      setSnapGuides({ horizontal: false, vertical: false })
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [drag, dispatch, screenToSvg, elements, canvasWidth, canvasHeight])

  return { isDragging: drag !== null, startDrag, snapGuides }
}
