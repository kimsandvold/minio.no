import { useRef, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import type { DesignerState, DesignerAction, DesignElement, Point } from '../../../types/design'
import { useCanvasInteraction } from './hooks/useCanvasInteraction'
import { useElementDrag } from './hooks/useElementDrag'
import { useElementResize } from './hooks/useElementResize'
import RectElement from './elements/RectElement'
import CircleElement from './elements/CircleElement'
import LineElement from './elements/LineElement'
import TextElement from './elements/TextElement'
import SymbolElement from './elements/SymbolElement'
import SelectionHandles from './elements/SelectionHandles'

const CanvasWrapper = styled.div`
  flex: 1;
  background: #2a2a2a;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 300px;
  }
`

interface Props {
  state: DesignerState
  dispatch: React.Dispatch<DesignerAction>
  selectedElement: DesignElement | null
  generateId: () => string
  svgRef: React.RefObject<SVGSVGElement | null>
  activeSymbolId: string
}

export default function DesignerCanvas({ state, dispatch, selectedElement, generateId, svgRef, activeSymbolId }: Props) {
  const { design, tool, zoom, panOffset } = state
  const wrapperRef = useRef<HTMLDivElement>(null)
  const drawStartRef = useRef<Point | null>(null)
  const drawPreviewRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)

  const { screenToSvg, invalidateCTM } = useCanvasInteraction(svgRef)
  const { startDrag } = useElementDrag(dispatch, design.elements, screenToSvg)
  const { startResize } = useElementResize(dispatch, design.elements, screenToSvg)

  // Invalidate CTM on zoom/pan changes
  useEffect(() => { invalidateCTM() }, [zoom, panOffset, invalidateCTM])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return
    const svgPt = screenToSvg(e.clientX, e.clientY)

    if (tool === 'select') {
      dispatch({ type: 'SELECT_ELEMENT', id: null })
      return
    }

    if (tool === 'text') {
      const id = generateId()
      dispatch({
        type: 'ADD_ELEMENT',
        element: {
          id, type: 'text', x: svgPt.x, y: svgPt.y,
          width: 60, height: 14, rotation: 0,
          fill: '#000000', stroke: 'none', strokeWidth: 0, opacity: 1,
          text: 'Tekst', fontSize: 12, fontFamily: 'Inter',
          fontWeight: 400, textAnchor: 'start', letterSpacing: 0,
        },
      })
      return
    }

    if (tool === 'symbol') {
      const id = generateId()
      dispatch({
        type: 'ADD_ELEMENT',
        element: {
          id, type: 'symbol', x: svgPt.x - 15, y: svgPt.y - 15,
          width: 30, height: 30, rotation: 0,
          fill: '#000000', stroke: 'none', strokeWidth: 0, opacity: 1,
          symbolId: activeSymbolId,
        },
      })
      return
    }

    // rect, circle, line — start drawing
    drawStartRef.current = svgPt
  }, [tool, dispatch, generateId, screenToSvg, activeSymbolId])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawStartRef.current) return
    const svgPt = screenToSvg(e.clientX, e.clientY)
    const start = drawStartRef.current
    drawPreviewRef.current = {
      x: Math.min(start.x, svgPt.x),
      y: Math.min(start.y, svgPt.y),
      width: Math.abs(svgPt.x - start.x),
      height: Math.abs(svgPt.y - start.y),
    }
    // Force re-render is handled by state updates; for preview we use a direct DOM approach
    const preview = svgRef.current?.querySelector('[data-draw-preview]') as SVGElement | null
    if (preview && drawPreviewRef.current) {
      const p = drawPreviewRef.current
      if (tool === 'line') {
        preview.setAttribute('x1', String(start.x))
        preview.setAttribute('y1', String(start.y))
        preview.setAttribute('x2', String(svgPt.x))
        preview.setAttribute('y2', String(svgPt.y))
      } else {
        preview.setAttribute('x', String(p.x))
        preview.setAttribute('y', String(p.y))
        preview.setAttribute('width', String(p.width))
        preview.setAttribute('height', String(p.height))
        if (tool === 'circle') {
          preview.setAttribute('cx', String(p.x + p.width / 2))
          preview.setAttribute('cy', String(p.y + p.height / 2))
          preview.setAttribute('rx', String(p.width / 2))
          preview.setAttribute('ry', String(p.height / 2))
        }
      }
      preview.style.display = ''
    }
  }, [screenToSvg, tool, svgRef])

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawStartRef.current) return
    const svgPt = screenToSvg(e.clientX, e.clientY)
    const start = drawStartRef.current
    drawStartRef.current = null

    const preview = svgRef.current?.querySelector('[data-draw-preview]') as SVGElement | null
    if (preview) preview.style.display = 'none'

    const minSize = 3
    const id = generateId()

    if (tool === 'rect') {
      const x = Math.min(start.x, svgPt.x)
      const y = Math.min(start.y, svgPt.y)
      const w = Math.abs(svgPt.x - start.x)
      const h = Math.abs(svgPt.y - start.y)
      if (w < minSize && h < minSize) return
      dispatch({
        type: 'ADD_ELEMENT',
        element: {
          id, type: 'rect', x, y, width: w, height: h, rotation: 0,
          fill: 'none', stroke: '#000000', strokeWidth: 1, opacity: 1, rx: 0, ry: 0,
        },
      })
    } else if (tool === 'circle') {
      const x = Math.min(start.x, svgPt.x)
      const y = Math.min(start.y, svgPt.y)
      const w = Math.abs(svgPt.x - start.x)
      const h = Math.abs(svgPt.y - start.y)
      if (w < minSize && h < minSize) return
      dispatch({
        type: 'ADD_ELEMENT',
        element: {
          id, type: 'circle', x, y, width: w, height: h, rotation: 0,
          fill: 'none', stroke: '#000000', strokeWidth: 1, opacity: 1,
        },
      })
    } else if (tool === 'line') {
      const dx = svgPt.x - start.x
      const dy = svgPt.y - start.y
      if (Math.sqrt(dx * dx + dy * dy) < minSize) return
      dispatch({
        type: 'ADD_ELEMENT',
        element: {
          id, type: 'line',
          x: start.x, y: start.y, x2: svgPt.x, y2: svgPt.y,
          width: Math.abs(dx), height: Math.abs(dy), rotation: 0,
          fill: 'none', stroke: '#000000', strokeWidth: 1, opacity: 1,
        },
      })
    }
  }, [tool, dispatch, generateId, screenToSvg, svgRef])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      dispatch({ type: 'SET_ZOOM', zoom: zoom * delta })
    }
  }, [dispatch, zoom])

  const handleResizeStart = useCallback((corner: string, startPoint: Point) => {
    if (!selectedElement) return
    startResize(selectedElement.id, corner, startPoint)
  }, [selectedElement, startResize])

  const renderElement = (el: DesignElement) => {
    const isSelected = el.id === state.selectedElementId

    switch (el.type) {
      case 'rect':
        return <RectElement key={el.id} element={el} isSelected={isSelected} />
      case 'circle':
        return <CircleElement key={el.id} element={el} isSelected={isSelected} />
      case 'line':
        return <LineElement key={el.id} element={el} isSelected={isSelected} />
      case 'text':
        return <TextElement key={el.id} element={el} isSelected={isSelected} />
      case 'symbol':
        return <SymbolElement key={el.id} element={el} isSelected={isSelected} />
    }
  }

  // We need a separate drag handler on each element group
  const handleGroupMouseDown = (el: DesignElement) => (e: React.MouseEvent) => {
    e.stopPropagation()
    if (tool === 'select') {
      dispatch({ type: 'SELECT_ELEMENT', id: el.id })
      startDrag(el.id, e)
    }
  }

  return (
    <CanvasWrapper ref={wrapperRef} onWheel={handleWheel}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${design.canvasWidth} ${design.canvasHeight}`}
        width={design.canvasWidth * zoom}
        height={design.canvasHeight * zoom}
        style={{
          background: design.backgroundColor === 'transparent'
            ? 'repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 20px 20px'
            : design.backgroundColor,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          cursor: tool === 'select' ? 'default' : 'crosshair',
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        {/* Draw preview shapes */}
        {tool === 'rect' && (
          <rect data-draw-preview data-ui-only x={0} y={0} width={0} height={0} fill="none" stroke="#1da1f2" strokeWidth={0.5} strokeDasharray="3 3" style={{ display: 'none' }} />
        )}
        {tool === 'circle' && (
          <ellipse data-draw-preview data-ui-only cx={0} cy={0} rx={0} ry={0} fill="none" stroke="#1da1f2" strokeWidth={0.5} strokeDasharray="3 3" style={{ display: 'none' }} />
        )}
        {tool === 'line' && (
          <line data-draw-preview data-ui-only x1={0} y1={0} x2={0} y2={0} stroke="#1da1f2" strokeWidth={0.5} strokeDasharray="3 3" style={{ display: 'none' }} />
        )}

        {design.elements.map(el => (
          <g key={el.id} onMouseDown={handleGroupMouseDown(el)}>
            {renderElement(el)}
          </g>
        ))}

        {selectedElement && (
          <g data-ui-only>
            <SelectionHandles element={selectedElement} onResizeStart={handleResizeStart} />
          </g>
        )}
      </svg>
    </CanvasWrapper>
  )
}
